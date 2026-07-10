# Landing Page Deployment (AWS Amplify)

`landing-page/www/` is deployed to AWS Amplify. The `amplify.yml` at the repo root controls the build (`appRoot: landing-page/www`, output in `out/`).

## Prerequisites

- The `fluctum.io` domain registered and accessible
- GitHub connection to Amplify set up (one-time manual step in Amplify console)
- Custom domain configured manually in the Amplify console

## Post-Deploy Verification

1. Open the Amplify console → check the app shows the `main` branch connected
2. Trigger a build manually if auto-build hasn't started
3. Check custom domain status in Amplify → Domain management
4. Verify `https://fluctum.io` resolves after DNS propagation

## Auto-Deploy on Push

Once the Amplify app is connected, every push to `main` triggers a new build automatically.
