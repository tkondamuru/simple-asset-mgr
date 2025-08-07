# Simple Asset Manager

A simple asset manager built with Cloudflare Workers and a React SPA. This project provides a simple interface to upload and manage puzzle assets.

## Deployment

This project is set up for continuous deployment to Cloudflare using GitHub Actions.

### Cloudflare Resources

Before deploying, you need to set up the following resources in your Cloudflare account:

1.  **D1 Database**:
    *   Create a new D1 database.
    *   Find the **Database ID** in the database's dashboard.
    *   Update `wrangler.toml` with your D1 database binding and ID.

2.  **R2 Bucket**:
    *   Create a new R2 bucket.
    *   Update `wrangler.toml` with your R2 bucket name.
    *   Enable public access to your R2 bucket by connecting a domain or using the public `r2.dev` domain. This is required to serve the uploaded images.

### GitHub Actions Secrets

To enable automated deployments, you must add the following secrets to your GitHub repository settings (`Settings > Secrets and variables > Actions`):

*   `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with permissions to edit Workers, D1, and R2.
*   `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.

Once these secrets are in place, any push to the `main` branch will trigger the GitHub Actions workflow to build and deploy the application.
