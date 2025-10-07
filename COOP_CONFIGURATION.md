# Cross-Origin-Opener-Policy Configuration for Production

## For Vite/Static Hosting (Netlify, Vercel, etc.)

### Netlify (_headers file in public/ directory):
```
/*
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Cross-Origin-Embedder-Policy: credentialless
```

### Vercel (vercel.json):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        },
        {
          "key": "Cross-Origin-Embedder-Policy", 
          "value": "credentialless"
        }
      ]
    }
  ]
}
```

### Apache (.htaccess):
```apache
Header always set Cross-Origin-Opener-Policy "same-origin-allow-popups"
Header always set Cross-Origin-Embedder-Policy "credentialless"
```

### Nginx:
```nginx
add_header Cross-Origin-Opener-Policy "same-origin-allow-popups";
add_header Cross-Origin-Embedder-Policy "credentialless";
```

## For Development (Vite)

You can configure Vite to set these headers during development by updating vite.config.js:

```javascript
export default {
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  }
}
```

## Note

These headers tell the browser to allow popups from the same origin (your app) while maintaining security. The warnings should disappear with proper configuration.