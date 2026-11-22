# Helmet Package Guide

## Installation
```bash
npm install helmet
```

## Basic Usage

### Simple (Default settings)
```javascript
const helmet = require('helmet');
app.use(helmet());
```

This sets all default security headers with sensible defaults.

## Example in Your App

Here's how to add it to your `app.js`:

```javascript
const express = require('express');
const helmet = require('helmet');
const app = express();

// Use helmet with default settings
app.use(helmet());

// Or customize it
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Set to false if you use CDNs
}));
```

## Customization Example for Your Language App

Since your app uses Bootstrap CDN and has inline scripts, here's a customized helmet config:

```javascript
const helmet = require('helmet');

app.use(helmet({
  // Content Security Policy - controls what resources can be loaded
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",  // Needed for inline styles in your HTML
        "https://cdn.jsdelivr.net"  // Bootstrap CDN
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",  // Needed for your inline scripts
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],  // For your /api/dictionary endpoint
    }
  },
  
  // Remove X-Powered-By header (hides that you're using Express)
  hidePoweredBy: true,
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Prevent MIME sniffing
  noSniff: true,
  
  // XSS Protection (for older browsers)
  xssFilter: true,
  
  // Force HTTPS in production (only if using HTTPS)
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
  }
}));
```

## What Headers Look Like

Before helmet:
```
X-Powered-By: Express
```

After helmet:
```
X-Powered-By: (removed)
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Important Notes for Your App

1. **Inline Scripts**: Your `index.html` has inline JavaScript. You'll need `'unsafe-inline'` in CSP or move scripts to separate files.

2. **Bootstrap CDN**: You're loading Bootstrap from CDN, so you need to allow `https://cdn.jsdelivr.net` in your CSP.

3. **API Endpoints**: Your `/api/dictionary` endpoint needs to be allowed in `connectSrc`.

## Recommended Minimal Config for Your App

```javascript
// Add after: const app = express();
const helmet = require('helmet');

if (process.env.NODE_ENV === 'production') {
  // Strict security in production
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      }
    }
  }));
} else {
  // Less strict for development
  app.use(helmet({
    contentSecurityPolicy: false  // Disable CSP in dev for easier debugging
  }));
}
```

## Benefits

✅ **Protection against XSS attacks** - Prevents malicious scripts from executing  
✅ **Prevents clickjacking** - Stops your site from being embedded in malicious frames  
✅ **Hides server info** - Removes X-Powered-By header  
✅ **Enforces HTTPS** - Forces secure connections in production  
✅ **MIME sniffing protection** - Prevents browsers from guessing file types incorrectly  

## Testing

After installing helmet, test your app to ensure:
1. Your Bootstrap styles still load correctly
2. Your inline scripts still work
3. Your API endpoints are accessible
4. Images load properly

If something breaks, you can temporarily disable specific helmet features:
```javascript
app.use(helmet({
  contentSecurityPolicy: false  // Disable CSP
}));
```
