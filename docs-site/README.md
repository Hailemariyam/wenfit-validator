# Wenfit Validator Documentation Site

This directory contains the deployable documentation website for Wenfit Validator, built with VitePress.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

## 📁 Structure

```
docs-site/
├── docs/                      # Documentation content
│   ├── .vitepress/           # VitePress configuration
│   │   └── config.js         # Site configuration
│   ├── index.md              # Homepage
│   ├── introduction.md       # Getting started
│   ├── api.md                # API reference
│   ├── concepts/             # Core concepts
│   │   ├── schemas.md
│   │   └── errors.md
│   └── integration/          # Framework guides
│       ├── react.md
│       ├── vue.md
│       ├── angular.md
│       └── express.md
├── .github/workflows/        # GitHub Actions
│   └── deploy-docs.yml       # Auto-deployment
├── package.json              # Dependencies
├── vercel.json               # Vercel config
├── netlify.toml              # Netlify config
└── DEPLOYMENT.md             # Deployment guide
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

**GitHub Pages:**
- Push to GitHub
- Enable GitHub Pages in repository settings
- Automatic deployment via GitHub Actions

## 🎨 Customization

### Update Site Info

Edit `docs/.vitepress/config.js`:

```js
export default defineConfig({
  title: 'Your Title',
  description: 'Your Description',
  // ... more options
})
```

### Add New Pages

1. Create markdown file in `docs/`
2. Add to sidebar in `config.js`
3. Content updates automatically

### Styling

VitePress uses Vue 3 and supports:
- Custom CSS in `.vitepress/theme/`
- Component overrides
- Custom layouts

## 📝 Writing Documentation

### Frontmatter

```yaml
---
title: Page Title
description: Page description
---
```

### Code Blocks

\`\`\`typescript
const schema = string().email();
\`\`\`

### Custom Containers

```markdown
::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a danger message
:::
```

## 🔍 Search

Local search is enabled by default. Users can press `/` to search.

## 📊 Analytics

To add Google Analytics, edit `docs/.vitepress/config.js`:

```js
head: [
  ['script', { src: 'https://www.googletagmanager.com/gtag/js?id=GA_ID' }]
]
```

## 🐛 Troubleshooting

**Port already in use:**
```bash
npm run docs:dev -- --port 5174
```

**Build errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Cache issues:**
```bash
rm -rf docs/.vitepress/cache
```

## 📚 Resources

- [VitePress Documentation](https://vitepress.dev)
- [Markdown Extensions](https://vitepress.dev/guide/markdown)
- [Theme Configuration](https://vitepress.dev/reference/default-theme-config)

## 🤝 Contributing

1. Edit markdown files in `docs/`
2. Test locally with `npm run docs:dev`
3. Build with `npm run docs:build`
4. Submit PR

## 📄 License

MIT
