# Deployment Runbook: Form Handler

The form handler is a serverless service built with the Serverless Framework. It processes submissions from the Fluctum landing page, validates them using Google reCAPTCHA Enterprise, and sends notifications via Amazon SES and Slack.

## Service Details

- **Location**: `landing-page/form-handler/`
- **Framework**: Serverless Framework v3.40.0
- **Runtime**: Node.js 20.x
- **Region**: `eu-west-1`
- **Stages**: `dev`, `production`

## Prerequisites

1.  **AWS SES Verified Sender**: The domain `fluctum.io` must be verified in Amazon SES in the `eu-west-1` region. Ensure the source email address is also verified if not using the entire domain.
2.  **reCAPTCHA Enterprise**: Setup a project in Google Cloud Console and create a reCAPTCHA Enterprise site key for `fluctum.io`. The service account used for validation must have the `reCAPTCHA Enterprise Agent` role.
3.  **Slack App**: Create a Slack App with the `chat:write` scope. Install the app to your workspace and invite the bot to the target notification channel.

## Environment Variables

The following environment variables are required for deployment. These should be configured in your CI/CD provider (e.g., GitHub Actions secrets) or in a stage-specific `.env` file.

| Variable                 | Description                               | User Reference             |
| :----------------------- | :---------------------------------------- | :------------------------- |
| `SES_SOURCE_EMAIL`       | Verified SES sender address               | `SES_SOURCE_ADDRESS`       |
| `SES_NOTIFICATION_EMAIL` | Destination email for lead notifications  | `SES_NOTIFICATION_ADDRESS` |
| `CAPTCHA_PROJECT_ID`     | Google Cloud Project ID                   | `CAPTCHA_PROJECT_ID`       |
| `CAPTCHA_SITE_KEY`       | reCAPTCHA Enterprise Site Key             | `CAPTCHA_SITE_KEY`         |
| `CAPTCHA_CLIENT_EMAIL`   | Service Account email for reCAPTCHA       | `CAPTCHA_CLIENT_EMAIL`     |
| `CAPTCHA_PRIVATE_KEY`    | Service Account private key               | `CAPTCHA_PRIVATE_KEY`      |
| `SLACK_TOKEN`            | Slack Bot User OAuth Token                | `SLACK_BOT_TOKEN`          |
| `SLACK_CHANNEL`          | ID of the Slack channel for notifications | -                          |
| `SLACK_USERNAME`         | Display name for the Slack bot            | -                          |

> Note: `ALLOWED_ORIGIN` is managed via the `serverless.yml` CORS configuration.

## Deployment Commands

### Development

```bash
serverless deploy
```

### Production

```bash
serverless deploy --stage production
```

## Post-Deployment

After a successful deployment, retrieve the service information and endpoint URL:

```bash
serverless info
```

The output will include the HTTP API endpoint. This URL must be configured in the landing page storefront (`NEXT_PUBLIC_FORM_HANDLER_URL`) to point to the newly deployed service.

## Error Codes

The service returns the following error codes in the response body when a request cannot be processed:

| Code    | Type      | Description                                                    |
| :------ | :-------- | :------------------------------------------------------------- |
| `10000` | Unknown   | General internal server error                                  |
| `10001` | Honeypot  | Honeypot field was filled (bot detected)                       |
| `10002` | reCAPTCHA | reCAPTCHA validation failed or score was below threshold (0.5) |
| `10003` | SES       | Error sending notification or confirmation email               |
| `10004` | DynamoDB  | Error persisting the submission to the database                |
| `10005` | Slack     | Error sending notification to Slack                            |

## Operational Notes

### SES Silent-Drop Risk

Amazon SES can sometimes silently drop emails if there is a significant discrepancy between the HTML and Plain Text versions of a template. Ensure that parity is maintained between the files in `email-templates/`:

- `visitor-notification.html` / `visitor-notification.txt`
- `visitor-confirmation.html` / `visitor-confirmation.txt`
- `visitor-confirmation-with-message.html` / `visitor-confirmation-with-message.txt`

### CORS Configuration

The service is currently configured to allow requests from:

- `https://fluctum.io`
- `https://www.fluctum.io`
- `http://localhost:3000` (for local development)
