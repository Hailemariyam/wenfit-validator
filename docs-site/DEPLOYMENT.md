# Documentation Deployment Guide

This guide explains how to deploy the Wenfit Validator documentation to various platforms.

## 🚀 Quick Start (Local Development)

```bash
cd docs-site
npm install
npm run docs:dev
```

Visit http://localhost:5173 to see your documentation site.

## 📦 Build for Production

```bash
npm run docs:build
```

This creates a production build in `docs/.vitepress/dist/`

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

**Setup:**

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Source: GitHub Actions
4. The workflow file is already configured at `.github/workflows/deploy-docs.yml`
5. Push to `main` branch to trigger deployment

**URL:** `https://yourusername.github.io/wenfit-validator/`

**Pros:**
- ✅ Free
- ✅ Automatic deployment on push
- ✅ Custom domain support
- ✅ HTTPS included

### Option 2: Vercel (Easiest - Free)

**Setup:**

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects VitePress
4. Click Deploy

**Configuration:** Already set in `vercel.json`

**URL:** `https://wenfit-validator.vercel.app`

**Pros:**
- ✅ Free for personal projects
- ✅ Instant deployment
- ✅ Preview deployments for PRs
- ✅ Custom domain support
- ✅ Edge network (fast globally)

### Option 3: Netlify (Free)

**Setup:**

1. Go to [netlify.com](https://netlify.com)
2. Import your GitHub repository
3. Build command: `npm run docs:build`
4. Publish directory: `docs/.vitepress/dist`
5. Click Deploy

**Configuration:** Already set in `netlify.toml`

**URL:** `https://wenfit-validator.netlify.app`

**Pros:**
- ✅ Free for personal projects
- ✅ Automatic deployment
- ✅ Custom domain support
- ✅ Form handling and serverless functions

### Option 4: Cloudflare Pages (Free)

**Setup:**

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Build command: `npm run docs:build`
4. Build output directory: `docs/.vitepress/dist`
5. Click Deploy

**URL:** `https://wenfit-validator.pages.dev`

**Pros:**
- ✅ Free unlimited bandwidth
- ✅ Global CDN
- ✅ Fast deployment
- ✅ Custom domain support

### Option 5: Self-Hosted (VPS/Server)

**Setup:**

```bash
# Build the site
npm run docs:build

# Copy dist folder to your server
scp -r docs/.vitepress/dist/* user@yourserver:/var/www/docs/

# Configure nginx
server {
    listen 80;
    server_name docs.yoursite.com;
    root /var/www/docs;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🎨 Customization

### Update Site Config

Edit `docs/.vitepress/config.js`:

```js
export default defineConfig({
  title: 'Your Title',
  description: 'Your Description',
  base: '/your-base-path/', // For GitHub Pages subdirectory

  themeConfig: {
    logo: '/logo.svg',
    // ... more config
  }
})
```

### Add Custom Domain

**GitHub Pages:**
1. Add `CNAME` file with your domain
2. Configure DNS: `CNAME` record pointing to `yourusername.github.io`

**Vercel/Netlify:**
1. Go to project settings
2. Add custom domain
3. Follow DNS configuration instructions

## 📝 Content Updates

1. Edit markdown files in `docs/`
2. Commit and push to GitHub
3. Deployment happens automatically

## 🔍 SEO Optimization

Add to each markdown file:

```yaml
---
title: Page Title
description: Page description for SEO
head:
  - - meta
    - name: keywords
      content: validation, typescript, schema
---
```

## 🚦 Status Checks

After deployment, verify:

- ✅ Homepage loads
- ✅ Navigation works
- ✅ Search functionality works
- ✅ Code examples render correctly
- ✅ Links are not broken
- ✅ Mobile responsive

## 📊 Analytics (Optional)

### Google Analytics

Add to `docs/.vitepress/config.js`:

```js
export default defineConfig({
  head: [
    ['script', {
      async: true,
      src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'
    }],
    ['script', {}, `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    `]
  ]
})
```

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run docs:build
```

### 404 on Refresh

Make sure your hosting platform is configured for SPA routing:
- GitHub Pages: Handled by VitePress
- Vercel: Handled automatically
- Netlify: Check `netlify.toml` redirects
- Nginx: Use `try_files` directive

### Slow Build Times

```bash
# Use preview for faster development
npm run docs:preview
```

## 📚 Resources

- [VitePress Documentation](https://vitepress.dev)
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

## 🎯 Recommended Setup

For most projects, we recommend:

1. **Development**: Local with `npm run docs:dev`
2. **Deployment**: Vercel or GitHub Pages
3. **Custom Domain**: Add after initial deployment
4. **Analytics**: Add Google Analytics if needed

This gives you:
- Free hosting
- Automatic deployments
- Fast global CDN
- HTTPS by default
- Easy custom domain setup
