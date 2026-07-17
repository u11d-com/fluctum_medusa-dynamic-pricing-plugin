# Landing Page Infrastructure (CDK)

AWS CDK infrastructure for the fluctum.io landing page. Provisions:

- **S3 bucket** — stores static site content (HTML, CSS, JS, images)
- **CloudFront distribution** — global CDN with Origin Access Control (OAC)
- **IAM policies** — allows CloudFront to read from S3 (bucket remains private)

## Architecture

```
GitHub Actions → S3 bucket → CloudFront (OAC) → fluctum.io (custom domain)
```

- Build happens in GitHub Actions (`landing-page/www/` → `pnpm run build` → `out/`)
- Deployment uploads `out/` to S3 and invalidates CloudFront cache
- CloudFront serves content globally with 24h default TTL, 365d max TTL

## Prerequisites

1. AWS CLI configured with credentials (`aws configure`)
2. Node.js 20+ and pnpm installed
3. CDK CLI installed globally: `npm install -g aws-cdk`

## Deploy Infrastructure

```bash
cd infra/landing-page

# Install dependencies
pnpm install

# Bootstrap CDK in your AWS account (first-time only)
cdk bootstrap

# Preview changes
cdk diff

# Deploy stack
cdk deploy
```

**Outputs** (save these for GitHub Actions):

- `BucketName` — S3 bucket to upload content to
- `DistributionId` — CloudFront distribution ID for cache invalidation
- `DistributionDomainName` — CloudFront domain (\*.cloudfront.net)

## Custom Domain Setup

After deploying the stack:

1. Go to CloudFront console → your distribution → "Alternate domain names (CNAMEs)"
2. Add `fluctum.io` and `www.fluctum.io`
3. Request/import an ACM certificate in **us-east-1** for `*.fluctum.io`
4. Attach certificate to the distribution
5. Update DNS records in Route 53 (or your DNS provider):
   - `A` record: `fluctum.io` → CloudFront distribution (alias)
   - `CNAME` record: `www.fluctum.io` → CloudFront domain

## GitHub Actions Integration

Required secrets in GitHub:

- `AWS_ACCESS_KEY_ID` — IAM user with S3 + CloudFront permissions
- `AWS_SECRET_ACCESS_KEY` — IAM user secret
- `AWS_REGION` — `us-east-1` (or your chosen region)
- `S3_BUCKET` — from CDK output `BucketName`
- `CLOUDFRONT_DISTRIBUTION_ID` — from CDK output `DistributionId`

See [.github/workflows/deploy-landing.yml](../../.github/workflows/deploy-landing.yml) for the workflow.

## Local Testing

Preview CloudFormation template before deployment:

```bash
pnpm run synth
```

Check the `cdk.out/` folder for generated CloudFormation JSON.

## Cost Estimate

| Service                    | Cost (monthly)              |
| -------------------------- | --------------------------- |
| S3 storage (1 GB)          | ~$0.023                     |
| S3 requests (10k GET)      | ~$0.004                     |
| CloudFront (1 GB transfer) | ~$0.085                     |
| CloudFront requests (10k)  | ~$0.01                      |
| **Total**                  | **~$0.12 + actual traffic** |

Negligible compared to Amplify ($5–50/mo depending on build minutes).

## Destroy Infrastructure

⚠️ **Only run this if you're sure!** The S3 bucket has `RETAIN` policy, so it won't be deleted.

```bash
cdk destroy
```

To fully clean up:

1. Empty the S3 bucket manually in the AWS console
2. Delete the bucket
3. Run `cdk destroy`
