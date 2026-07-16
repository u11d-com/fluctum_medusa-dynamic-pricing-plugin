# Starter Sync Runbook

This runbook describes how to set up and maintain the `fluctum_sync` GitHub App and the workflow that pushes code from this monorepo to the standalone `u11d-com/fluctum_starter` repository.

## 1. Create the Target Repository

The target repository must exist before you run the sync workflow.

1. Go to GitHub and create a new repository: `u11d-com/fluctum_starter`.
2. Keep it empty. Do not initialize it with a README, license, or gitignore.

## 2. Create the GitHub App

The workflow uses a GitHub App to authenticate and push changes. This is more secure and flexible than using a Personal Access Token.

1. Go to your organization settings or personal settings on GitHub.
2. Select **Developer settings** > **GitHub Apps** > **New GitHub App**.
3. **GitHub App name**: `fluctum_sync`
4. **Homepage URL**: `https://github.com/u11d-com/dynamic-pricing`
5. **Webhook**: Uncheck "Active" (webhooks are not needed for this).
6. **Permissions**:
   - Under **Repository permissions**, find **Contents**.
   - Set it to **Access: Read and write**.
7. **Where can this GitHub App be installed?**: Select "Only on this account".
8. Click **Create GitHub App**.

## 3. Install the App and Generate Keys

1. After creating the app, click **Install App** in the sidebar.
2. Install it on the `u11d-com` account.
3. Select "Only select repositories" and pick `u11d-com/fluctum_starter`.
4. Return to the App settings page.
5. In the **General** section, scroll down to **Private keys**.
6. Click **Generate a private key**. A `.pem` file will download to your computer.
7. Note the **App ID** shown at the top of the General page.

## 4. Store Secrets in the Source Repository

You must store the App credentials in this repository (`u11d-com/dynamic-pricing`) so the workflow can use them.

1. Go to your source repository on GitHub.
2. Select **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. **Name**: `FLUCTUM_SYNC_APP_ID`
5. **Value**: Paste the App ID from Step 3.
6. Click **New repository secret** again.
7. **Name**: `FLUCTUM_SYNC_PRIVATE_KEY`
8. **Value**: Paste the entire content of the `.pem` file downloaded in Step 3.

## 5. Configure the Target Repository

### Set as Template

The `fluctum_starter` repo should serve as a template for users.

1. Go to `u11d-com/fluctum_starter` settings.
2. Check the box **Template repository**. This sets the GitHub API property `is_template: true` on the repository, enabling the "Use this template" button on the repo page.

### Branch Protection

Protect the `main` branch while allowing the sync app to push updates.

1. Go to **Settings** > **Branches**.
2. Click **Add branch protection rule**.
3. **Branch name pattern**: `main`
4. Check **Lock branch** or enable required reviews if needed.
5. Under **Allow specific actors to bypass required pull requests**, add the `fluctum_sync` app. This lets the sync workflow update the branch directly.

## 6. Run the Sync Workflow

The workflow runs automatically after a successful **Release** workflow (`workflow_run`) and can also be triggered manually.

1. Go to the **Actions** tab in the source repository.
2. Select the **Starter Sync** workflow in the sidebar.
3. Click **Run workflow**.
4. You can optionally provide a version number (e.g., `v1.2.3`). This will be used in the commit message.

### Lockfile requirement

Medusa Cloud builds can fail with `No lockfiles found` when the project root in the deployed repository does not contain a lockfile. The sync workflow copies the root scaffold `package-lock.json` and validates lockfiles for root, backend, and storefront before pushing to `u11d-com/fluctum_starter`.

## 7. Technical Rationale: Force-with-lease

The sync workflow uses `git push --force-with-lease`. This is safer than a plain `--force` because it checks that the remote branch has not changed since your last fetch. It prevents the workflow from accidentally overwriting commits made directly to the starter repo if someone bypassed the process.

## 8. Private Key Rotation

If you need to rotate the private key:

1. Go to the GitHub App settings for `fluctum_sync`.
2. Generate a new private key.
3. Update the `FLUCTUM_SYNC_PRIVATE_KEY` secret in the source repository.
4. Verify the sync works.
5. Delete the old private key from the GitHub App settings.
