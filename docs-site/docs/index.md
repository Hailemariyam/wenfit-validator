---
layout: home

hero:
  name: Wenfit Validator
  text: Type-Safe Validation Made Simple
  tagline: Universal validation library for TypeScript/JavaScript - Framework-agnostic, blazingly fast, and developer-friendly
  image:
    src: /logo.svg
    alt: Wenfit Validator
  actions:
    - theme: brand
      text: Get Started →
      link: /introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/Hailemariyam/wenfit-validator
    - theme: alt
      text: npm Package
      link: https://www.npmjs.com/package/wenfit-validator

features:
  - icon: 🎯
    title: Type-Safe by Design
    details: Full TypeScript support with automatic type inference. Get compile-time safety and IntelliSense autocomplete out of the box.
    link: /concepts/schemas
    linkText: Learn about schemas

  - icon: ⚡
    title: Blazingly Fast
    details: Optimized for performance with zero dependencies. Validate thousands of objects per second without breaking a sweat.
    link: /api
    linkText: View benchmarks

  - icon: 🔌
    title: Framework Agnostic
    details: Works seamlessly with React, Vue, Angular, Express, and more. One API to rule them all.
    link: /adapters
    linkText: Explore adapters

  - icon: 🎨
    title: Composable Schemas
    details: Build complex validation logic with simple, reusable schema compositions. DRY principle at its finest.
    link: /concepts/schemas#composition
    linkText: See examples

  - icon: 🛡️
    title: Robust Error Handling
    details: Detailed, customizable error messages with full path tracking. Know exactly what went wrong and where.
    link: /concepts/errors
    linkText: Error handling guide

  - icon: 🔄
    title: Transform & Refine
    details: Transform data on the fly and add custom validation logic. Powerful preprocessing and postprocessing capabilities.
    link: /api#transformers
    linkText: View transformers

  - icon: 📦
    title: Tree-Shakeable
    details: Import only what you need. Optimized bundle size with ES modules and tree-shaking support.
    link: /introduction#installation
    linkText: Installation guide

  - icon: 🧩
    title: Extensible Plugin System
    details: Extend functionality with custom plugins. Add your own validators, transformers, and error formatters.
    link: /api#plugins
    linkText: Plugin API

  - icon: 📚
    title: Comprehensive Docs
    details: Detailed documentation with real-world examples. Get up and running in minutes, master it in hours.
    link: /introduction
    linkText: Read the docs
---

<style>
.VPHome {
  padding-bottom: 96px;
}
</style>

## Quick Example

```typescript
import { string, number, object, array } from 'wenfit-validator';

// Define your schema
const userSchema = object({
  name: string().min(2).max(50),
  email: string().email(),
  age: number().min(18).max(120),
  tags: array(string()).min(1).max(5)
});

// Validate data
const result = userSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  tags: ['developer', 'typescript']
});

// TypeScript knows the exact type!
// result: { name: string; email: string; age: number; tags: string[] }
```

## Why Wenfit Validator?

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin: 48px 0;">

<div style="padding: 24px; border-radius: 12px; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider);">
  <h3>🚀 Developer Experience</h3>
  <p>Intuitive API that feels natural. Write validation logic that reads like plain English.</p>
</div>

<div style="padding: 24px; border-radius: 12px; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider);">
  <h3>🎯 Production Ready</h3>
  <p>Battle-tested in production environments. Trusted by developers worldwide.</p>
</div>

<div style="padding: 24px; border-radius: 12px; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider);">
  <h3>🌍 Universal</h3>
  <p>Works in Node.js, browsers, and edge runtimes. One library for all your validation needs.</p>
</div>

</div>

## Trusted By Developers

<div style="text-align: center; margin: 48px 0;">
  <p style="font-size: 18px; opacity: 0.8;">Join thousands of developers building better applications with Wenfit Validator</p>
  <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px; flex-wrap: wrap;">
    <a href="https://github.com/Hailemariyam/wenfit-validator" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 8px; background: var(--vp-c-brand-soft); text-decoration: none; font-weight: 600;">
      <span>⭐</span> Star on GitHub
    </a>
    <a href="https://www.npmjs.com/package/wenfit-validator" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 8px; background: var(--vp-c-brand-soft); text-decoration: none; font-weight: 600;">
      <span>📦</span> View on npm
    </a>
  </div>
</div>
