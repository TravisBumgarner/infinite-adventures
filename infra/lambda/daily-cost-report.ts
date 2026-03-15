import * as https from 'node:https'
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer'

const ceClient = new CostExplorerClient({ region: 'us-east-1' })

function sendPushover(
  token: string,
  user: string,
  message: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ token, user, message })
    const req = https.request(
      {
        hostname: 'api.pushover.net',
        path: '/1/messages.json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve()
          } else {
            reject(new Error(`Pushover API returned ${res.statusCode}: ${body}`))
          }
        })
      },
    )
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

export async function handler(): Promise<void> {
  const appToken = process.env.PUSHOVER_APP_TOKEN
  const userToken = process.env.PUSHOVER_USER_TOKEN
  if (!appToken || !userToken) throw new Error('PUSHOVER_APP_TOKEN and PUSHOVER_USER_TOKEN must be set')

  const now = new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const end = tomorrow.toISOString().slice(0, 10)

  if (startOfMonth === end) return // 1st of the month, no data yet

  const costResult = await ceClient.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: startOfMonth, End: end },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
    }),
  )

  const amount = costResult.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount
  const cost = amount !== undefined ? parseFloat(amount).toFixed(2) : 'no data'

  await sendPushover(
    appToken,
    userToken,
    `Infinite Adventures: Month-to-date cost is $${cost}`,
  )
}
