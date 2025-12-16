## Cloudflare Worker proxy to Firebase Functions

Use this Worker to forward requests from your domain to the gen1 function `api`.

### Worker script (module syntax)
```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Point to Firebase Functions host
    url.hostname = "us-central1-auto-pee.cloudfunctions.net";

    // Prepend /api to path (keep original path after your domain)
    url.pathname = `/api${url.pathname}`;

    // Forward the request with original method/headers/body
    return fetch(url.toString(), request);
  },
};
```

### Steps in Cloudflare Dashboard
1) Create a Worker (Module) and paste the script above.
2) Routes: set `https://api.yourdomain.com/*` (or your desired host/path) to this Worker.
3) DNS: create CNAME `api` -> `us-central1-auto-pee.cloudfunctions.net` (orange-cloud ON). The Worker route will capture and proxy.
4) In your client `.env`, set `VITE_API_BASE_URL=https://api.yourdomain.com`.

Optional:
- If you want to force HTTPS and strip query cache, leave as is—Worker just proxies.
- CORS is already `*` on the backend; no extra CORS handling needed in Worker.

