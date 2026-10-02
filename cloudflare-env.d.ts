declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GITHUB_TOKEN?: string;
    AUTOGIT_ACCESS_KEY?: string;
    GITHUB_OWNER?: string;
    PUBLISH_INTERVAL_MINUTES?: string;
    PORTFOLIO_REPO?: string;
  }
}
