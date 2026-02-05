# 📦 Publishing Guide for Wenfit Validator

This guide walks you through publishing Wenfit Validator to NPM.

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **NPM CLI**: Ensure you have npm installed
3. **Authentication**: Log in to NPM

```bash
npm login
```

## Pre-Publication Checklist

Before publishing, ensure everything is ready:

### ✅ 1. Version Check

Update version in `package.json`:
- First release: `1.0.0`
- Patch: `1.0.1` (bug fixes)
- Minor: `1.1.0` (new features, backward compatible)
- Major: `2.0.0` (breaking changes)

```bash
# Update version
npm version 1.0.0
```

### ✅ 2. Build the Package

```bash
# Clean build
rm -rf dist/
npm run build
```

Verify build output:
```bash
ls -lh dist/
```

Should see:
- `index.js` and `index.cjs` (core)
- `adapters/` folder with framework adapters
- `.d.ts` type definition files
- Source maps

### ✅ 3. Run All Tests

```bash
npm test
```

Ensure all tests pass (279 tests should pass).

### ✅ 4. Check Bundle Size

```bash
npm run build:check
```

Verify:
- Core bundle < 10KB gzipped ✅
- All adapters are small

### ✅ 5. Run Benchmarks

```bash
npm run benchmark
```

Verify performance meets requirements.

### ✅ 6. Lint and Format

```bash
npm run lint
npm run format:check
npm run typecheck
```

### ✅ 7. Test Package Locally

Test the package before publishing:

```bash
# Pack the package
npm pack

# This creates wenfit-validator-1.0.0.tgz
# Install it in a test project
cd /path/to/test-project
npm install /path/to/wenfit-validator/wenfit-validator-1.0.0.tgz

# Test imports
node -e "const { string } = require('wenfit-validator'); console.log(string())"
```

### ✅ 8. Update Documentation

Ensure these files are up to date:
- [ ] `README.md` - Installation, examples, features
- [ ] `CHANGELOG.md` - Version history
- [ ] `docs/` - API documentation
- [ ] `examples/` - Working examples

### ✅ 9. Git Status

Commit all changes:

```bash
git add .
git commit -m "chore: prepare v1.0.0 release"
git tag v1.0.0
git push origin main --tags
```

## Publishing to NPM

### Option 1: Standard Publishing

```bash
# Publish to NPM
npm publish
```

### Option 2: Dry Run First

Test what will be published without actually publishing:

```bash
npm publish --dry-run
```

Review the output to ensure only necessary files are included.

### Option 3: Scoped Package

If publishing under a scope (e.g., `@yourorg/wenfit-validator`):

```bash
# Public scoped package
npm publish --access public

# Private scoped package (requires paid NPM account)
npm publish --access restricted
```

## Post-Publication

### 1. Verify Publication

Check that the package is live:

```bash
npm view wenfit-validator
```

Visit: https://www.npmjs.com/package/wenfit-validator

### 2. Test Installation

In a new directory:

```bash
mkdir test-install
cd test-install
npm init -y
npm install wenfit-validator

# Test it works
node -e "const { string, object } = require('wenfit-validator'); console.log('✅ Package works!')"
```

### 3. Create GitHub Release

1. Go to GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: Copy from `CHANGELOG.md`
6. Attach the `.tgz` file
7. Publish release

### 4. Announce

Share the release:
- [ ] Twitter/X
- [ ] Reddit (r/typescript, r/javascript)
- [ ] Dev.to blog post
- [ ] Hacker News
- [ ] Discord/Slack communities

### 5. Update Documentation Site

If you have a documentation site:

```bash
cd docs-site
npm run build
npm run deploy
```

## Troubleshooting

### "Package name already exists"

The name `wenfit-validator` might be taken. Options:
1. Choose a different name (update `package.json`)
2. Use a scoped package: `@yourorg/wenfit-validator`

### "You must be logged in"

```bash
npm login
# Enter your credentials
```

### "403 Forbidden"

You don't have permission. Ensure:
- You're logged in to the correct account
- The package name isn't taken
- You have 2FA enabled if required

### "Files not included"

Check `.npmignore` and `package.json` `files` field.

## Version Management

### Patch Release (1.0.1)

For bug fixes:

```bash
npm version patch
npm publish
git push --tags
```

### Minor Release (1.1.0)

For new features (backward compatible):

```bash
npm version minor
npm publish
git push --tags
```

### Major Release (2.0.0)

For breaking changes:

```bash
npm version major
npm publish
git push --tags
```

## Beta/Alpha Releases

For pre-releases:

```bash
# Alpha
npm version 1.1.0-alpha.0
npm publish --tag alpha

# Beta
npm version 1.1.0-beta.0
npm publish --tag beta

# Install with
npm install wenfit-validator@alpha
npm install wenfit-validator@beta
```

## Unpublishing

⚠️ **Warning**: Only unpublish within 72 hours of publishing!

```bash
# Unpublish specific version
npm unpublish wenfit-validator@1.0.0

# Unpublish entire package (use with extreme caution!)
npm unpublish wenfit-validator --force
```

## Continuous Deployment

For automated publishing with GitHub Actions, create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add `NPM_TOKEN` to GitHub repository secrets.

## Support

After publishing:
- Monitor GitHub issues
- Respond to questions
- Fix bugs promptly
- Release patches as needed

## Checklist Summary

Before running `npm publish`:

- [ ] All tests pass
- [ ] Bundle size verified
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Git committed and tagged
- [ ] Dry run successful
- [ ] Ready to publish! 🚀

---

**Ready to publish?**

```bash
npm publish
```

🎉 **Congratulations on publishing Wenfit Validator!**
