# QuietLink — Anonymous URL Shortener

QuietLink is a privacy-first URL shortener built for Cloudflare Pages Functions with Cloudflare Workers KV. It requires no accounts and does not implement click analytics.

## Features

- Random 8-character short codes.
- Redirects to HTTP(S) destinations.
- Expiration presets: 1 hour, 24 hours, 7 days, 30 days, custom duration (1 hour to 365 days), or never expire.
- Cloudflare KV persists mappings and applies TTL for expiring links.
- No click counts, visitor profiles, analytics cookies, or application-level access logs.
- Minimal mapping data: destination URL and optional expiry timestamp only.
- Referrer Policy `no-referrer` on redirects.
- Rejects non-HTTP(S) schemes, URLs with embedded credentials, local hostnames, and private/reserved IPv4 destinations.
- Responsive accessible interface, privacy notice, and security headers.

## Deploy using GitHub + Cloudflare Pages

1. In Cloudflare, open **Workers & Pages** and create a **Pages** project by connecting the GitHub repository `rajeevtv1972-crypto/anonymous-url-shortener`.
2. Set the production branch to `main`.
3. There is no build step. Set the build command to blank (or no command) and the build output directory to `public`.
4. Create a Cloudflare **Workers KV** namespace, for example `quietlink-links`.
5. In the Pages project, open **Settings → Bindings → Add → KV namespace**. Set the variable name to exactly `LINKS`, choose the namespace you created, save, and redeploy. The Function returns a setup message until this binding exists.
6. Open the deployed Pages URL and create a one-hour test link. Confirm it redirects correctly. Also test an expired link and the **Never expire** option.

The repository does not include a Cloudflare account ID, namespace ID, API token, or other deployment secret. Create the KV namespace in your own account; don't commit credentials to GitHub.

### Optional local preview

Install Node.js, clone this repository, then run:

```bash
npx wrangler pages dev public --kv=LINKS
```

This provides a local development binding. If you need durable local test data, follow the current Wrangler KV local-development instructions.

## Routes

- `/` — shortener interface
- `/privacy.html` — privacy notice
- `POST /api/shorten` — validate and store a destination mapping
- `/<8-character-code>` — redirect to a saved destination

The `functions/[[path]].js` Pages Function passes static assets through to Pages and handles the API and short-code redirects.

## Privacy scope and limitations

QuietLink doesn't collect identifiers or click events in its application code. Cloudflare necessarily processes network requests and its platform-level handling depends on Cloudflare's own policies and settings. A short link is not an anonymity proxy: the destination can still receive network information from the person opening it.

“Never expire” links remain in KV until removed or the service changes. Expiring links are given a KV TTL and are also checked at redirect time. Expiration does not guarantee immediate physical deletion from every underlying storage layer.

## Production hardening

Before sharing this publicly, use Cloudflare's current security controls to add a modest rate-limit rule for `POST /api/shorten`, review abuse-report handling, and monitor service availability without enabling click analytics. Public URL shorteners can be abused for phishing, so keep destination validation and acceptable-use language in place.

## License

Choose a license before accepting external contributions or redistributing the code.