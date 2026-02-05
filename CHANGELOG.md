# Changelog

All notable changes to Wenfit Validator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-05

### 🎉 Initial Release

The first stable release of Wenfit Validator - a universal, type-safe validation library for TypeScript/JavaScript.

### ✨ Features

#### Core Validation Engine
- **Primitive Schemas**: String, number, boolean, date, and enum validation
- **Complex Schemas**: Object, array, union, and intersection support
- **Type Inference**: Automatic TypeScript type derivation from schemas
- **Fluent API**: Chainable methods for building validation rules
- **Error Handling**: Structured errors with paths, codes, and metadata

#### Validation Rules
- **String**: min, max, length, pattern, email, url, trim, toLowerCase, toUpperCase
- **Number**: min, max, int, positive, negative, finite
- **Date**: min, max date constraints
- **Array**: min, max, length, nonempty
- **Object**: required/optional properties, nested validation, strict/passthrough modes

#### Advanced Features
- **Async Validation**: Support for asynchronous validation rules
- **Transformers**: Data transformation after successful validation
- **Custom Rules**: Add custom validation with `refine()`
- **Modifiers**: optional(), nullable(), default() support
- **Schema Composition**: extend, merge, pick, omit operations
- **Plugin System**: Extensible architecture for custom functionality
- **JSON Schema Export**: Convert schemas to JSON Schema format

#### Framework Adapters
- **React**: `useValidator` hook for form validation
- **Vue 3**: `useValidation` composable with reactive state
- **Angular**: `ValidationService` with reactive forms integration
- **Express/NestJS**: Middleware for request validation

#### Developer Experience
- **TypeScript-First**: Full type safety and IntelliSense support
- **Error Messages**: Customizable error messages with i18n support
- **Tree-Shakeable**: Import only what you need
- **Zero Dependencies**: Core has no external dependencies

### 📊 Performance
- Simple schema validation: < 0.01ms
- Nested object validation: < 0.01ms
- Large array validation (100 items): < 0.1ms

### 📦 Bundle Size
- Core (ESM): 7.69 KB gzipped
- Core (CJS): 7.82 KB gzipped
- React Adapter: 0.71 KB gzipped
- Vue Adapter: 0.62 KB gzipped
- Angular Adapter: 1.56 KB gzipped
- Express Adapter: 0.76 KB gzipped

### 🧪 Testing
- 279 passing tests
- Property-based testing with fast-check
- 97.9% test coverage
- Integration tests for all framework adapters

### 📚 Documentation
- Comprehensive API documentation
- Framework integration guides
- Working examples for all adapters
- Performance benchmarks

### 🎯 Requirements Met
All 25 requirements from the specification implemented:
- ✅ Core schema system
- ✅ Primitive validation (string, number, boolean, date, enum)
- ✅ Complex schemas (object, array, union, intersection)
- ✅ Async validation
- ✅ Transformers and custom rules
- ✅ Framework adapters (React, Vue, Angular, Express)
- ✅ Error handling and type inference
- ✅ Plugin system and JSON Schema export
- ✅ Performance optimization
- ✅ Schema composition and reusability

---

## Future Roadmap

### Planned for v1.1.0
- [ ] Svelte adapter
- [ ] Solid.js adapter
- [ ] More built-in validators (UUID, credit card, etc.)
- [ ] Improved error messages
- [ ] Performance optimizations

### Planned for v1.2.0
- [ ] Schema versioning support
- [ ] Migration helpers
- [ ] Advanced plugin API
- [ ] Custom error formatters

### Planned for v2.0.0
- [ ] Breaking changes (if needed)
- [ ] Major API improvements based on feedback
- [ ] Additional framework support

---

[1.0.0]: https://github.com/yourusername/wenfit-validator/releases/tag/v1.0.0
