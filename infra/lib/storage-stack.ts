import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import * as budgets from 'aws-cdk-lib/aws-budgets'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import type { Construct } from 'constructs'

interface StorageStackProps extends cdk.StackProps {
  environment: string
}

export class StorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props)

    const { environment } = props

    const allOrigins = this.node.tryGetContext('allowedOrigins') || {}
    const allowedOrigins: string[] = allOrigins[environment]
    if (!allowedOrigins || allowedOrigins.length === 0) {
      throw new Error(
        `No allowedOrigins configured for environment "${environment}" in CDK context`,
      )
    }

    // Access logging bucket
    const logBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `infinite-adventures-logs-${environment}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
        },
      ],
    })

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: `infinite-adventures-${environment}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      serverAccessLogsBucket: logBucket,
      serverAccessLogsPrefix: 'photos-bucket/',
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins,
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.hours(24),
        },
      ],
    })

    // IAM User
    const user = new iam.User(this, 'S3User', {
      userName: `infinite-adventures-s3-${environment}`,
    })

    user.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:PutObject',
          's3:GetObject',
          's3:DeleteObject',
        ],
        resources: [bucket.bucketArn, bucket.arnForObjects('*')],
      }),
    )

    // Access Key
    const accessKey = new iam.AccessKey(this, 'S3UserAccessKey', {
      user,
    })

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket name (S3_BUCKET_NAME)',
    })

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region (AWS_REGION)',
    })

    new cdk.CfnOutput(this, 'AccessKeyId', {
      value: accessKey.accessKeyId,
      description: 'IAM access key ID (AWS_ACCESS_KEY_ID)',
    })

    new cdk.CfnOutput(this, 'SecretAccessKey', {
      value: accessKey.secretAccessKey.unsafeUnwrap(),
      description: 'IAM secret access key (AWS_SECRET_ACCESS_KEY)',
    })

    // ─── Billing Alerts & Cost Kill Switch ───

    const alertEmail = this.node.tryGetContext('alertEmail') as string
    const pushoverAppToken = this.node.tryGetContext('pushoverAppToken') as string
    const pushoverUserToken = this.node.tryGetContext('pushoverUserToken') as string

    // SNS Topic for billing alerts
    const billingAlertsTopic = new sns.Topic(this, 'BillingAlertsTopic', {
      topicName: `infinite-adventures-billing-alerts-${environment}`,
    })

    billingAlertsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['sns:Publish'],
        principals: [new iam.ServicePrincipal('budgets.amazonaws.com')],
        resources: [billingAlertsTopic.topicArn],
      }),
    )

    // Email subscription
    if (alertEmail) {
      billingAlertsTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(alertEmail),
      )
    }

    // Pushover notifier Lambda (SNS-triggered)
    const pushoverNotifier = new lambda.NodejsFunction(
      this,
      'PushoverNotifier',
      {
        functionName: `infinite-adventures-pushover-notifier-${environment}`,
        entry: path.join(__dirname, '..', 'lambda', 'pushover-notifier.ts'),
        handler: 'handler',
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(15),
        environment: {
          ...(pushoverAppToken && { PUSHOVER_APP_TOKEN: pushoverAppToken }),
          ...(pushoverUserToken && { PUSHOVER_USER_TOKEN: pushoverUserToken }),
        },
      },
    )

    billingAlertsTopic.addSubscription(
      new snsSubscriptions.LambdaSubscription(pushoverNotifier),
    )

    // Daily cost report Lambda (EventBridge-triggered, production only)
    // Billing is account-wide so only one environment needs to report
    if (environment === 'production') {
      const dailyCostReport = new lambda.NodejsFunction(
        this,
        'DailyCostReport',
        {
          functionName: 'infinite-adventures-daily-cost-report',
          entry: path.join(__dirname, '..', 'lambda', 'daily-cost-report.ts'),
          handler: 'handler',
          runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
          timeout: cdk.Duration.seconds(15),
          environment: {
            ...(pushoverAppToken && { PUSHOVER_APP_TOKEN: pushoverAppToken }),
            ...(pushoverUserToken && { PUSHOVER_USER_TOKEN: pushoverUserToken }),
          },
        },
      )

      dailyCostReport.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ce:GetCostAndUsage'],
          resources: ['*'],
        }),
      )

      // EventBridge rule — daily at 11am US Central (17:00 UTC)
      const dailyCostSchedule = new events.Rule(this, 'DailyCostSchedule', {
        ruleName: 'infinite-adventures-daily-cost-report',
        schedule: events.Schedule.expression('cron(0 17 * * ? *)'),
      })
      dailyCostSchedule.addTarget(
        new targets.LambdaFunction(dailyCostReport),
      )
    }

    // AWS Budget — $100/month with notifications at $5/$10/$15/$20/$25
    const notificationThresholds = [5, 10, 15, 20, 25]

    new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: `infinite-adventures-monthly-${environment}`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 100,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: notificationThresholds.map(
        (threshold) => ({
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold,
            thresholdType: 'ABSOLUTE_VALUE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: billingAlertsTopic.topicArn,
            },
          ],
        }),
      ),
    })

    // Deny-all IAM policy for cost kill switch
    const denyAllPolicy = new iam.ManagedPolicy(this, 'CostKillSwitchPolicy', {
      managedPolicyName: `infinite-adventures-cost-kill-switch-${environment}`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['s3:*'],
          resources: ['*'],
        }),
      ],
    })

    // IAM role for AWS Budgets to assume when applying the policy
    const budgetActionRole = new iam.Role(this, 'BudgetActionRole', {
      roleName: `infinite-adventures-budget-action-${environment}`,
      assumedBy: new iam.ServicePrincipal('budgets.amazonaws.com'),
      inlinePolicies: {
        ApplyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'iam:AttachUserPolicy',
                'iam:DetachUserPolicy',
              ],
              resources: [user.userArn],
            }),
          ],
        }),
      },
    })

    // Budget action — auto-apply deny-all policy at $100
    new budgets.CfnBudgetsAction(this, 'CostKillSwitchAction', {
      budgetName: `infinite-adventures-monthly-${environment}`,
      notificationType: 'ACTUAL',
      actionType: 'APPLY_IAM_POLICY',
      actionThreshold: {
        value: 100,
        type: 'ABSOLUTE_VALUE',
      },
      executionRoleArn: budgetActionRole.roleArn,
      approvalModel: 'AUTOMATIC',
      definition: {
        iamActionDefinition: {
          policyArn: denyAllPolicy.managedPolicyArn,
          users: [user.userName],
        },
      },
      subscribers: [
        {
          type: 'SNS',
          address: billingAlertsTopic.topicArn,
        },
      ],
    })
  }
}
