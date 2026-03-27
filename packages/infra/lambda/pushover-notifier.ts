import type { SNSEvent } from 'aws-lambda'
import * as https from 'node:https'

function sendPushover(token: string, user: string, message: string): Promise<void> {
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

export async function handler(event: SNSEvent): Promise<void> {
  const appToken = process.env.PUSHOVER_APP_TOKEN
  const userToken = process.env.PUSHOVER_USER_TOKEN
  if (!appToken || !userToken) throw new Error('PUSHOVER_APP_TOKEN and PUSHOVER_USER_TOKEN must be set')

  for (const record of event.Records) {
    const message = record.Sns.Message
    const subject = record.Sns.Subject || 'AWS Billing Alert'
    await sendPushover(appToken, userToken, `${subject}\n\n${message}`)
  }
}
