# Contributing to Wenfit Validator

Thank you for your interest in contributing to Wenfit Validator! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- TypeScript knowledge
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/wenfit-validator.git
   cd wenfit-validator
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🏗️ Development

### Project Structure

```
wenfit-validator/
├── src/
│   ├── core/           # Core validation engine
│   ├── adapters/       # Framework adapters
│   ├── errors/         # Error handling
│   ├── types/          # TypeScript types
│   └── index.ts        # Main exports
├── tests/
│   ├── unit/           # Unit tests
│   ├── property/       # Property-based tests
│   └── integration/    # Integration tests
├── docs/               # Documentation
└── examples/           # Usage examples
```

### Available Scripts

```bash
# Development
npm run build          # Build the library
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report

# Code Quality
npm run lint           # Lint code
npm run lint:fix       # Fix linting issues
npm run format         # Format code with Prettier
npm run typecheck      # Type check without emitting

# Performance
npm run benchmark      # Run performance benchmarks
npm run build:check    # Check bundle size
```

## ✅ Testing

We use a comprehensive testing strategy:

### Unit Tests

Write unit tests for specific functionality:

```typescript
// tests/unit/primitives/string.test.ts
import { describe, test, expect } from 'vitest';
import { string } from '../../../src';

describe('StringSchema', () => {
  test('validates email format', () => {
    const schema = string().email();
    expect(schema.safeParse('test@example.com').success).toBe(true);
    expect(schema.safeParse('invalid').success).toBe(false);
  });
});
```

### Property-Based Tests

Use fast-check for property-based testing:

```typescript
// tests/property/string-schema.test.ts
import fc from 'fast-check';
import { string } from '../../../src';

test('string schema accepts all strings', () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const result = string().safeParse(str);
      expect(result.success).toBe(true);
    }),
    { numRuns: 100 }
  );
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test string-schema.test.ts

# Run with coverage
npm run test:coverage
```

## 📝 Code Style

We use ESLint and Prettier for code formatting:

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

### Example

```typescript
/**
 * Creates a string schema with validation rules
 * @returns A new StringSchema instance
 * @example
 * ```typescript
 * const schema = string().min(2).max(50);
 * ```
 */
export function string(): StringSchema {
  return new StringSchema();
}
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Reproduction**: Minimal code to reproduce
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: Node version, TypeScript version, etc.

### Example Bug Report

```markdown
## Bug: Email validation fails for valid emails

**Description**
The email validator rejects valid email addresses with plus signs.

**Reproduction**
```typescript
const schema = string().email();
const result = schema.safeParse('user+tag@example.com');
console.log(result.success); // false (should be true)
```

**Expected**: Should accept emails with plus signs
**Actual**: Rejects valid emails
**Environment**: Node 18.0.0, TypeScript 5.3.2
```

## ✨ Feature Requests

For feature requests, please:

1. Check if it already exists in issues
2. Describe the use case
3. Provide examples of the API you envision
4. Explain why it's valuable

## 🔄 Pull Request Process

1. **Update tests**: Add/update tests for your changes
2. **Update docs**: Update documentation if needed
3. **Run checks**: Ensure all tests pass and code is formatted
4. **Write clear commits**: Use conventional commit messages
5. **Create PR**: Provide a clear description of changes

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(core): add support for tuple schemas
fix(adapters): resolve React hook dependency issue
docs(readme): update installation instructions
```

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code is formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] Types are correct (`npm run typecheck`)
- [ ] Documentation is updated
- [ ] Examples are added/updated if needed
- [ ] Commit messages follow convention

## 📚 Documentation

When adding features:

1. Update API documentation in `docs/API.md`
2. Add examples in `examples/`
3. Update integration guides if needed
4. Add JSDoc comments to public APIs

## 🎯 Areas for Contribution

We especially welcome contributions in:

- **New validators**: Additional validation rules
- **Framework adapters**: Support for more frameworks
- **Performance**: Optimization improvements
- **Documentation**: Better examples and guides
- **Tests**: More comprehensive test coverage
- **Bug fixes**: Fixing reported issues

## 💬 Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/wenfit-validator/discussions)
- Join our [Discord community](https://discord.gg/wenfit)
- Check existing [issues](https://github.com/yourusername/wenfit-validator/issues)

## 📜 Code of Conduct

Please be respectful and constructive in all interactions. We're here to build great software together!

## 🙏 Thank You!

Your contributions make Wenfit Validator better for everyone. We appreciate your time and effort!
