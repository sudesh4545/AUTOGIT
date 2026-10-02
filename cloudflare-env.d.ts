declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GITHUB_TOKEN?: string;
    GITHUB_OWNER?: string;
    PORTFOLIO_REPO?: string;
    PUBLISH_INTERVAL_MINUTES?: string;
    PORTFOLIO_REPO?: string;
  }
}
