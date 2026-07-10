# Demo Deployment to Medusa Cloud

Runbook for deploying the Fluctum demo (backend) to [Medusa Cloud](https://medusajs.com/cloud/).

## Prerequisites

- Access to Medusa Cloud dashboard.
- GitHub repository connected to Medusa Cloud.
- Custom domain `demo.fluctum.io` configured in Cloud DNS (or pointing to Cloud).

## Backend Deployment

The demo backend is located at `starter/backend/`. When setting up the project in Medusa Cloud, specify this path as the base directory if required, or ensure the build command targets this directory.

### Environment Variables

Configure the following environment variables in the Medusa Cloud dashboard:

| Variable                         | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`                   | PostgreSQL connection string (provided by Medusa Cloud) |
| `REDIS_URL`                      | Redis connection string (provided by Medusa Cloud)      |
| `STORE_CORS`                     | CORS for storefront (e.g., `https://demo.fluctum.io`)   |
| `ADMIN_CORS`                     | CORS for admin dashboard                                |
| `AUTH_CORS`                      | CORS for authentication                                 |
| `JWT_SECRET`                     | Secret for JWT signing                                  |
| `COOKIE_SECRET`                  | Secret for cookies                                      |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | The public URL of this backend                          |
| `NEXT_PUBLIC_DEFAULT_REGION`     | Default region code (e.g., `us`)                        |
| `MEDUSA_CLOUD_S3_HOSTNAME`       | S3 hostname for file storage                            |
| `MEDUSA_CLOUD_S3_PATHNAME`       | S3 pathname for file storage                            |

## Custom Domain Hookup

To use `demo.fluctum.io`:

1. Add the domain in the Medusa Cloud project settings.
2. Update the `STORE_CORS` and `NEXT_PUBLIC_MEDUSA_BACKEND_URL` to reflect the custom domain.

## Plugin Dependency

The demo backend pulls `@u11d/medusa-dynamic-pricing` from npm as a standard dependency. After a new plugin release is published, trigger a redeploy in Medusa Cloud to pick up the updated version.

Alternatively, if deploying directly from the monorepo (not recommended for production), you would need to commit the `.yalc/` directory and ensure the backend's `package.json` references `file:.yalc/@u11d/medusa-dynamic-pricing`. However, the recommended approach is to deploy from the `fluctum_starter` template repository where the plugin is consumed as a published npm package.
