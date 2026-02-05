# Implementation Plan: Wenfit Validator

## Overview

This implementation plan breaks down the Wenfit Validator into incremental, testable steps. The approach follows a bottom-up strategy: build the core validation engine first, then add advanced features, and finally create framework adapters. Each task builds on previous work, with property-based tests integrated throughout to catch errors early.

## Tasks

- [x] 1. Project setup and core infrastructure
  - Initialize TypeScript project with strict mode enabled
  - Configure build tools (tsup for ESM/CJS output)
  - Set up Vitest test runner and fast-check for property testing
  - Create basic project structure (src/core, src/errors, src/types, tests/)
  - Configure linting (ESLint) and formatting (Prettier)
  - _Requirements: 23.2_

- [x] 2. Implement base schema class and validation context
  - [x] 2.1 Create ParseContext class for tracking validation state
    - Implement path tracking (pushPath, popPath, getCurrentPath)
    - Implement error accumulation (addError)
    - Implement async detection (markAsync)
    - _Requirements: 6.2, 7.3, 12.3_

  - [x] 2.2 Create ValidationError class and error types
    - Define ValidationError interface with path, message, code, meta
    - Implement ValidationError class with format() and flatten() methods
    - Define ErrorCodes constants
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 2.3 Implement base Schema<TInput, TOutput> abstract class
    - Define abstract _parse method
    - Implement parse method (throws on failure)
    - Implement safeParse method (returns ValidationResult)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.4 Write property tests for base schema behavior
    - **Property 1: Parse throws on invalid input**
    - **Property 2: SafeParse never throws**
    - **Validates: Requirements 1.2, 1.3, 24.1**

- [x] 3. Implement primitive schemas (string, number, boolean)
  - [x] 3.1 Implement StringSchema with basic validation
    - Create StringSchema class extending Schema<string, string>
    - Implement type checking in _parse
    - Add min, max, length constraint methods
    - Add pattern/regex validation
    - Add email and url validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Write property tests for StringSchema
    - **Property 3: Type validation rejects wrong types (string)**
    - **Property 4: Error codes match constraint violations (string)**
    - **Validates: Requirements 2.1, 2.8**

  - [x] 3.3 Implement NumberSchema with constraints
    - Create NumberSchema class extending Schema<number, number>
    - Implement type checking in _parse
    - Add min, max, int, positive, negative, finite methods
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.4 Write property tests for NumberSchema
    - **Property 3: Type validation rejects wrong types (number)**
    - **Property 4: Error codes match constraint violations (number)**
    - **Validates: Requirements 3.1, 3.7**

  - [x] 3.5 Implement BooleanSchema
    - Create BooleanSchema class extending Schema<boolean, boolean>
    - Implement type checking in _parse
    - _Requirements: 4.1_

  - [x] 3.6 Write property tests for BooleanSchema
    - **Property 3: Type validation rejects wrong types (boolean)**
    - **Validates: Requirements 4.1**

- [x] 4. Implement date and enum schemas
  - [x] 4.1 Implement DateSchema with constraints
    - Create DateSchema class extending Schema<Date, Date>
    - Implement date validation in _parse
    - Add min and max date constraints
    - _Requirements: 4.2, 4.3_

  - [x] 4.2 Write property tests for DateSchema
    - **Property 3: Type validation rejects wrong types (date)**
    - **Validates: Requirements 4.2**

  - [x] 4.3 Implement EnumSchema
    - Create EnumSchema class extending Schema
    - Implement enum value checking in _parse
    - Include allowed values in error metadata
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 4.4 Write property tests for EnumSchema
    - **Property 5: Enum validation accepts only allowed values**
    - **Property 6: Enum errors include metadata**
    - **Validates: Requirements 5.1, 5.4**

- [x] 5. Checkpoint - Ensure all primitive schema tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement object schema validation
  - [x] 6.1 Create ObjectSchema class
    - Implement ObjectSchema<T> extending Schema
    - Implement _parse to validate each property
    - Track error paths for nested properties
    - Handle required vs optional properties
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 6.2 Write property tests for ObjectSchema
    - **Property 7: Object schemas validate all properties**
    - **Property 8: Error paths track nested locations**
    - **Property 9: Missing required properties produce errors**
    - **Validates: Requirements 6.1, 6.2, 6.5**

  - [x] 6.3 Add object schema methods (strict, passthrough, pick, omit, extend, merge)
    - Implement strict mode to reject unknown properties
    - Implement passthrough mode to allow unknown properties
    - Implement pick, omit, extend, merge for schema composition
    - _Requirements: 6.6, 6.7, 25.2, 25.3, 25.4, 25.5_

  - [x] 6.4 Write unit tests for object schema composition methods
    - Test pick, omit, extend, merge operations
    - Test strict and passthrough modes
    - _Requirements: 6.6, 6.7, 25.2, 25.3, 25.4, 25.5_

- [x] 7. Implement array schema validation
  - [x] 7.1 Create ArraySchema class
    - Implement ArraySchema<T> extending Schema
    - Implement _parse to validate each element
    - Track error paths with array indices
    - Add min, max, length, nonempty constraint methods
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Write property tests for ArraySchema
    - **Property 10: Array schemas validate all elements**
    - **Property 8: Error paths track nested locations (arrays)**
    - **Validates: Requirements 7.1, 7.3**

- [x] 8. Implement union and intersection schemas
  - [x] 8.1 Create UnionSchema class
    - Implement UnionSchema extending Schema
    - Try each union member schema in order
    - Collect errors from all failed attempts
    - _Requirements: 8.1, 8.2_

  - [x] 8.2 Write property tests for UnionSchema
    - **Property 11: Union accepts any matching member**
    - **Property 12: Union errors include all member failures**
    - **Validates: Requirements 8.1, 8.2**

  - [x] 8.3 Create IntersectionSchema class
    - Implement IntersectionSchema extending Schema
    - Validate input against all member schemas
    - Require all members to pass
    - _Requirements: 8.3_

  - [x] 8.4 Write property tests for IntersectionSchema
    - **Property 13: Intersection requires all members**
    - **Validates: Requirements 8.3**

- [x] 9. Checkpoint - Ensure all complex schema tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement optional, nullable, and default modifiers
  - [x] 10.1 Add optional() method to base Schema class
    - Create OptionalSchema wrapper
    - Accept undefined values
    - _Requirements: 21.1_

  - [x] 10.2 Add nullable() method to base Schema class
    - Create NullableSchema wrapper
    - Accept null values
    - _Requirements: 21.2_

  - [x] 10.3 Add default() method to base Schema class
    - Create DefaultSchema wrapper
    - Apply default value when input is undefined
    - Don't apply default when input is null
    - Apply default before validation
    - _Requirements: 22.1, 22.2, 22.3_

  - [x] 10.4 Write property tests for modifiers
    - **Property 29: Optional schemas accept undefined**
    - **Property 30: Nullable schemas accept null**
    - **Property 31: Optional nullable schemas accept both**
    - **Property 32: Missing required fields have correct error code**
    - **Property 33: Default values apply for undefined**
    - **Property 34: Default values don't apply for null**
    - **Property 35: Defaults apply before validation**
    - **Validates: Requirements 21.1, 21.2, 21.3, 21.4, 22.1, 22.2, 22.3**

- [x] 11. Implement transformer pipeline
  - [x] 11.1 Create Transformer interface and TransformerPipeline class
    - Define Transformer<TInput, TOutput> interface
    - Implement TransformerPipeline to chain transformers
    - _Requirements: 10.1_

  - [x] 11.2 Add transform() method to base Schema class
    - Create TransformSchema wrapper
    - Apply transformations after successful validation
    - Update output type correctly
    - _Requirements: 10.1, 10.6_

  - [x] 11.3 Add built-in string transformers
    - Implement trim(), toLowerCase(), toUpperCase() on StringSchema
    - _Requirements: 10.2_

  - [x] 11.4 Add built-in number transformers
    - Implement parseInt(), parseFloat() on NumberSchema
    - _Requirements: 10.3_

  - [x] 11.5 Write property tests for transformers
    - **Property 17: Transformers apply after validation**
    - **Property 18: Transformers execute in order**
    - **Property 19: Transformed data appears in results**
    - **Validates: Requirements 10.1, 10.5, 10.6**

- [x] 12. Implement custom validation with refine
  - [x] 12.1 Add refine() method to base Schema class
    - Create RefineSchema wrapper
    - Support synchronous predicates
    - Include custom error messages
    - Execute refine rules after built-in validation
    - _Requirements: 11.1, 11.2, 11.5_

  - [x] 12.2 Write property tests for refine
    - **Property 20: Custom refine errors include messages**
    - **Property 21: Custom rules run after built-in rules**
    - **Validates: Requirements 11.2, 11.5**

- [x] 13. Implement asynchronous validation
  - [x] 13.1 Add async support to ParseContext
    - Track async validation state
    - Return Promise<ValidationResult> when async detected
    - _Requirements: 9.1_

  - [x] 13.2 Add async refine support
    - Support predicates returning Promise<boolean>
    - Catch exceptions and convert to validation errors
    - Execute async validation after sync validation passes
    - _Requirements: 9.2, 9.3, 9.4, 24.6_

  - [x] 13.3 Write property tests for async validation
    - **Property 14: Async schemas return promises**
    - **Property 15: Async validation errors include custom messages**
    - **Property 16: Async validation runs after sync validation**
    - **Property 37: Async exceptions become validation errors**
    - **Validates: Requirements 9.1, 9.3, 9.4, 24.6**

- [x] 14. Checkpoint - Ensure all advanced feature tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement error handling and edge cases
  - [x] 15.1 Add circular reference detection
    - Use WeakSet to track visited objects
    - Prevent infinite loops in object validation
    - _Requirements: 24.3_

  - [x] 15.2 Add large array handling
    - Use iteration instead of recursion for arrays
    - Prevent stack overflow
    - _Requirements: 24.4_

  - [x] 15.3 Add graceful error handling for malformed input
    - Handle unexpected types gracefully
    - Provide clear error messages
    - _Requirements: 24.5_

  - [x] 15.4 Write property tests for error handling
    - **Property 22: Validation errors have complete structure**
    - **Property 23: All validation errors are returned**
    - **Property 36: Malformed input handled gracefully**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 24.5**

- [x] 16. Implement error message customization and i18n
  - [x] 16.1 Create error message template system
    - Implement global message template registration
    - Support placeholder substitution
    - _Requirements: 19.2, 19.4_

  - [x] 16.2 Add per-schema message customization
    - Allow custom messages in constraint methods
    - Override global templates per schema
    - _Requirements: 19.5_

  - [x] 16.3 Write property tests for message customization
    - **Property 26: Custom message templates are used**
    - **Property 27: Message templates substitute placeholders**
    - **Validates: Requirements 19.3, 19.4**

- [x] 17. Implement plugin system
  - [x] 17.1 Create Plugin interface and PluginRegistry
    - Define Plugin interface with name and install method
    - Implement PluginRegistry for registration
    - _Requirements: 18.1_

  - [x] 17.2 Add plugin support to validator
    - Allow plugins to add validation rules globally
    - Execute plugin rules in registration order
    - _Requirements: 18.2, 18.5_

  - [x] 17.3 Write property tests for plugin system
    - **Property 24: Plugins affect all schemas**
    - **Property 25: Plugin rules execute in registration order**
    - **Validates: Requirements 18.2, 18.5**

- [x] 18. Implement JSON Schema export
  - [x] 18.1 Add toJSONSchema() method to all schema classes
    - Implement for primitive schemas (string, number, boolean, date, enum)
    - Implement for object schemas
    - Implement for array schemas
    - Include validation constraints in output
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 18.2 Write property tests for JSON Schema export
    - **Property 28: JSON Schema conversion preserves structure**
    - **Validates: Requirements 20.2, 20.3, 20.4, 20.5, 20.6**

- [x] 19. Implement TypeScript type inference utilities
  - [x] 19.1 Create Infer<T> utility type
    - Extract output type from Schema<TInput, TOutput>
    - _Requirements: 13.1, 13.2_

  - [x] 19.2 Create helper types for complex schemas
    - UnionToIntersection for intersection schemas
    - Type helpers for optional, nullable, default
    - _Requirements: 13.3, 13.4, 13.5, 13.6, 13.7_

  - [x] 19.3 Write unit tests for type inference
    - Test type inference with TypeScript compiler
    - Verify correct types for nested, optional, nullable schemas
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 20. Checkpoint - Ensure all core features are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Implement React adapter
  - [x] 21.1 Create useValidator hook
    - Accept schema and validation mode options
    - Return validate function, errors, isValidating state
    - Provide getFieldError helper for path-based error access
    - Support async validation
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 21.2 Write unit tests for React adapter
    - Test validation state updates
    - Test async validation handling
    - Test field-level error access
    - _Requirements: 14.3_

- [x] 22. Implement Vue adapter
  - [x] 22.1 Create useValidation composable
    - Accept schema and return reactive validation state
    - Provide validate function and error state
    - Support async validation
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 22.2 Write unit tests for Vue adapter
    - Test reactive state updates
    - Test async validation handling
    - _Requirements: 15.3_

- [x] 23. Implement Angular adapter
  - [x] 23.1 Create ValidationService
    - Create injectable service for Angular
    - Provide validators compatible with Angular forms
    - Support async validators
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 23.2 Write unit tests for Angular adapter
    - Test integration with Angular reactive forms
    - Test async validator support
    - _Requirements: 16.2, 16.4_

- [x] 24. Implement Express/NestJS adapter
  - [x] 24.1 Create Express middleware
    - Accept schema and validation source (body, query, params)
    - Return 400 with errors on validation failure
    - Attach validated data to request on success
    - _Requirements: 17.1, 17.2, 17.3_

  - [x] 24.2 Write unit tests for Express middleware
    - Test validation failure returns 400
    - Test validation success attaches data
    - _Requirements: 17.2, 17.3_

  - [x] 24.3 Create NestJS decorators
    - Provide decorators for request validation
    - Support body, query, and params validation
    - _Requirements: 17.4, 17.5_

  - [x] 24.4 Write unit tests for NestJS decorators
    - Test decorator validation behavior
    - _Requirements: 17.4, 17.5_

- [x] 25. Create public API exports
  - [x] 25.1 Create main index.ts with all exports
    - Export factory functions: string(), number(), boolean(), date(), enum()
    - Export object(), array(), union(), intersection()
    - Export Schema base class and type utilities
    - Export error types and codes
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

  - [x] 25.2 Create adapter-specific exports
    - Export React adapter from adapters/react
    - Export Vue adapter from adapters/vue
    - Export Angular adapter from adapters/angular
    - Export Express/NestJS adapters from adapters/express
    - _Requirements: 14.1, 15.1, 16.1, 17.1_

- [x] 26. Final integration testing and documentation
  - [x] 26.1 Write end-to-end integration tests
    - Test complete validation workflows
    - Test frontend + backend schema sharing
    - Test all framework adapters
    - _Requirements: All_

  - [x] 26.2 Create usage examples
    - Create example for React form validation
    - Create example for Express API validation
    - Create example for shared schema usage
    - _Requirements: All_

  - [x] 26.3 Write API documentation
    - Document all schema types and methods
    - Document error handling
    - Document framework adapters
    - Document plugin system
    - _Requirements: All_

- [x] 27. Build and package for distribution
  - [x] 27.1 Configure build for ESM and CommonJS
    - Set up tsup to output both formats
    - Configure tree-shaking for optimal bundle size
    - _Requirements: 23.1, 23.2_

  - [x] 27.2 Optimize bundle size
    - Verify core bundle is under 10KB gzipped
    - Ensure adapters are separately importable
    - _Requirements: 23.3_

  - [x] 27.3 Run performance benchmarks
    - Benchmark validation speed for simple schemas
    - Benchmark nested object validation
    - Benchmark async validation
    - _Requirements: 23.4_

- [x] 28. Final checkpoint - Complete validation
  - Run all tests (unit + property + integration)
  - Verify bundle size and performance targets
  - Ensure all requirements are met
  - Prepare for NPM publication

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and framework integrations
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows a bottom-up approach: core engine → advanced features → adapters
