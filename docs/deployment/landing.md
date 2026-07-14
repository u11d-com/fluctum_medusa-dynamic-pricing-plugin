# Landing Page Deployment (S3 + CloudFront)

`landing-page/www/` is deployed to AWS S3 + CloudFront via GitHub Actions. The infrastructure is managed with AWS CDK (`infra/landing-page/`).

## Architecture

```
landing-page/www/ (Next.js static export)
  ↓ GitHub Actions (.github/workflows/deploy-landing.yml)
  ↓ npm run build → out/
  ↓ aws s3 sync → S3 bucket
  ↓ CloudFront invalidation
  ↓ https://fluctum.io (custom domain)
```

- **Build**: Next.js static export (`output: "export"` in `next.config.ts`)
- **Deployment**: GitHub Actions on push to `main` (only when `landing-page/www/**` changes)
- **Hosting**: Private S3 bucket with CloudFront Origin Access Control (OAC)
- **CDN**: CloudFront with 24h default TTL, 365d max TTL
- **Cache invalidation**: Full `/*` invalidation on every deploy (2-5 min propagation)

## Prerequisites

1. AWS account with CLI configured (`aws configure`)
2. CDK CLI installed: `npm install -g aws-cdk`
3. Domain `fluctum.io` registered and accessible
4. ACM certificate for `*.fluctum.io` in `us-east-1` (CloudFront requirement)

## Initial Setup

### Step 1: Deploy Infrastructure (CDK)

```bash
cd infra/landing-page
npm install
cdk bootstrap  # First-time only, per AWS account
cdk deploy
```

**Save the outputs**:

- `BucketName` → use for `S3_BUCKET` secret
- `DistributionId` → use for `CLOUDFRONT_DISTRIBUTION_ID` secret
- `DistributionDomainName` → CloudFront URL before custom domain

### Step 2: Configure Custom Domain

1. Go to CloudFront console → your distribution → "General" → "Edit"
2. Add alternate domain names (CNAMEs): `fluctum.io`, `www.fluctum.io`
3. Select ACM certificate (must be in `us-east-1`)
4. Save changes

5. Update DNS records (Route 53 or your DNS provider):
   - `A` record: `fluctum.io` → CloudFront distribution (alias/CNAME)
   - `CNAME` record: `www.fluctum.io` → your CloudFront domain

### Step 3: Configure GitHub Secrets

In your GitHub repo settings → Secrets and variables → Actions → New repository secret:

| Secret Name                  | Value                 | Source                                                          |
| ---------------------------- | --------------------- | --------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`          | IAM user access key   | Create IAM user with `S3FullAccess` + `CloudFrontFullAccess`    |
| `AWS_SECRET_ACCESS_KEY`      | IAM user secret       | From IAM user creation                                          |
| `AWS_REGION`                 | `us-east-1`           | Or your chosen region                                           |
| `S3_BUCKET`                  | Bucket name           | CDK output `BucketName`                                         |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID       | CDK output `DistributionId`                                     |
| `NEXT_PUBLIC_WEBFORM_URL`    | Form handler endpoint | From `serverless info` (see [form-handler.md](form-handler.md)) |

### Step 4: Create IAM User for GitHub Actions

**Recommended**: Create a dedicated IAM user with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

Replace `YOUR_BUCKET_NAME`, `YOUR_ACCOUNT_ID`, and `YOUR_DISTRIBUTION_ID` with your values.

## Deployment Flow

### Automatic Deployment

Push to `main` branch with changes in `landing-page/www/**` → GitHub Actions runs automatically.

```bash
git add landing-page/www/
git commit -m "Update landing page"
git push origin main
```

### Manual Deployment

Trigger workflow manually in GitHub Actions tab:

1. Go to Actions → "Deploy Landing Page"
2. Click "Run workflow" → select `main` branch
3. Click "Run workflow"

### Workflow Steps

1. ✅ Checkout code
2. ✅ Setup Node.js 20 + cache
3. ✅ Install dependencies (`npm ci`)
4. ✅ Build static site (`npm run build`)
5. ✅ Configure AWS credentials
6. ✅ Sync to S3 with cache headers:
   - Static assets (JS, CSS, images): `max-age=31536000, immutable` (1 year)
   - HTML, JSON, text: `max-age=3600, must-revalidate` (1 hour)
7. ✅ Invalidate CloudFront cache (`/*`)
8. ✅ Deployment summary

**Deployment time**: ~2-3 minutes (build) + 2-5 minutes (cache invalidation propagation)

## Post-Deploy Verification

1. Check GitHub Actions workflow status → should be green ✅
2. Open CloudFront console → "Invalidations" tab → verify `/*` invalidation in progress
3. Wait 2-5 minutes for invalidation to complete
4. Open `https://fluctum.io` in a browser (use incognito to bypass local cache)
5. Verify content is updated

## Troubleshooting

### Build Fails in GitHub Actions

**Symptom**: Workflow fails at "Build static site" step

**Solutions**:

- Check `NEXT_PUBLIC_WEBFORM_URL` is set correctly in GitHub secrets
- Review build logs for missing dependencies or syntax errors
- Test build locally: `cd landing-page/www && npm run build`

### Content Not Updating

**Symptom**: Changes don't appear on `fluctum.io` after deployment

**Solutions**:

- Wait 5 minutes for CloudFront invalidation to propagate globally
- Check CloudFront invalidations tab → verify `/*` invalidation completed
- Open in incognito/private browsing to bypass browser cache
- Check S3 bucket contents → verify files are updated (timestamps)

### 403 Forbidden Errors

**Symptom**: `https://fluctum.io` returns 403 Forbidden

**Solutions**:

- Verify S3 bucket policy allows CloudFront to read (should be auto-configured by CDK)
- Check CloudFront distribution → "Origins" → verify OAC is attached
- Check S3 bucket → "Permissions" → verify policy includes `cloudfront.amazonaws.com` principal

### AWS Credentials Invalid

**Symptom**: Workflow fails at "Configure AWS credentials" or "Sync files to S3"

**Solutions**:

- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct in GitHub secrets
- Check IAM user has required permissions (S3 + CloudFront)
- Regenerate IAM user access keys if compromised

## Cost Estimate

| Service                          | Cost (monthly, 10k visits) |
| -------------------------------- | -------------------------- |
| S3 storage (1 GB)                | ~$0.023                    |
| S3 requests (50k GET)            | ~$0.02                     |
| CloudFront transfer (10 GB)      | ~$0.85                     |
| CloudFront requests (50k)        | ~$0.05                     |
| CloudFront invalidations (30/mo) | Free (1000/mo included)    |
| **Total**                        | **~$0.94/month**           |

**vs. AWS Amplify**: $5–50/month (depends on build minutes, compute hours)

## Rollback

To deploy a previous version:

1. Find the commit hash of the last known good deployment
2. Go to GitHub Actions → "Deploy Landing Page" → "Run workflow"
3. Select the commit hash (or branch) to deploy
4. Click "Run workflow"

Alternatively, revert the commit and push:

```bash
git revert <bad-commit-hash>
git push origin main
```

## Infrastructure Updates

To update S3 or CloudFront configuration:

```bash
cd infra/landing-page
# Edit lib/landing-page-stack.ts
cdk diff   # Preview changes
cdk deploy # Apply changes
```

**Note**: Custom domain CNAMEs and ACM certificate are managed manually in CloudFront console, not via CDK (to avoid accidental deletion).

## Destroy Infrastructure

⚠️ **Only run this if you're migrating away or tearing down the site!**

```bash
cd infra/landing-page
cdk destroy
```

The S3 bucket has `RETAIN` policy, so it won't be deleted automatically. To fully clean up:

1. Empty the S3 bucket in AWS console
2. Delete the bucket manually
3. Run `cdk destroy` again if needed
