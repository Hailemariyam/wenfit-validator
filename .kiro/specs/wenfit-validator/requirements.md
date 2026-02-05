# Requirements Document

## Introduction

The Wenfit Validator is a universal validation library that provides type-safe, secure, and robust data validation for both frontend and backend environments. The system enables developers to define validation schemas once and use them across React, Vue, Angular, Node.js, Express, and NestJS applications. The validator supports synchronous and asynchronous validation, nested schemas, data transformers, composable rules, internationalization-ready errors, and a plugin system for extensibility.

## Glossary

- **Validator**: The complete validation system including core engine, adapters, and utilities
- **Schema**: A declarative definition of validation rules for a specific data type
- **Validation_Result**: An object containing either successful parsed data or validation errors
- **Validation_Error**: A structured error object with path, message, code, and optional metadata
- **Transformer**: A function that modifies data after successful validation
- **Adapter**: Framework-specific integration layer that connects the core engine to frontend/backend frameworks
- **Primitive_Schema**: Schema for basic types (string, number, boolean, date, enum)
- **Object_Schema**: Schema for validating object structures with nested properties
- **Array_Schema**: Schema for validating arrays with element type constraints
- **Async_Validation**: Validation rules that require asynchronous operations (e.g., database checks)
- **Type_Inference**: Automatic TypeScript type derivation from schema definitions
- **Error_Code**: Standardized identifier for validation error types (e.g., "string.email")
- **Path**: Array of property names indicating the location of a validation error in nested structures

## Requirements

### Requirement 1: Core Schema System

**User Story:** As a developer, I want to define validation schemas using a fluent API, so that I can declaratively specify data validation rules.

#### Acceptance Criteria

1. THE Validator SHALL provide a base Schema class with parse and safeParse methods
2. WHEN parse is called with invalid data, THE Validator SHALL throw a validation error
3. WHEN safeParse is called, THE Validator SHALL return a Validation_Result object without throwing
4. THE Validator SHALL support primitive schemas for string, number, boolean, date, and enum types
5. THE Validator SHALL support object schemas with nested property validation
6. THE Validator SHALL support array schemas with element type validation
7. THE Validator SHALL support union schemas for multiple possible types
8. THE Validator SHALL enable schema composition through refine and transform methods

### Requirement 2: String Validation

**User Story:** As a developer, I want to validate string inputs with common constraints, so that I can ensure data quality and format compliance.

#### Acceptance Criteria

1. WHEN a string schema is created, THE Validator SHALL validate that input is of type string
2. THE Validator SHALL provide min and max length constraints for strings
3. THE Validator SHALL provide pattern/regex validation for strings
4. THE Validator SHALL provide built-in email validation
5. THE Validator SHALL provide built-in URL validation
6. THE Validator SHALL support optional and nullable string modifiers
7. THE Validator SHALL support default values for strings
8. WHEN validation fails, THE Validator SHALL return an error with code "string.min", "string.max", "string.email", or "string.url" as appropriate

### Requirement 3: Number Validation

**User Story:** As a developer, I want to validate numeric inputs with range constraints, so that I can ensure values are within acceptable bounds.

#### Acceptance Criteria

1. WHEN a number schema is created, THE Validator SHALL validate that input is of type number
2. THE Validator SHALL provide min and max value constraints for numbers
3. THE Validator SHALL support integer validation
4. THE Validator SHALL support positive and negative number constraints
5. THE Validator SHALL support optional and nullable number modifiers
6. THE Validator SHALL support default values for numbers
7. WHEN validation fails, THE Validator SHALL return an error with code "number.min", "number.max", or "number.type" as appropriate

### Requirement 4: Boolean and Date Validation

**User Story:** As a developer, I want to validate boolean and date inputs, so that I can handle these common data types correctly.

#### Acceptance Criteria

1. WHEN a boolean schema is created, THE Validator SHALL validate that input is of type boolean
2. WHEN a date schema is created, THE Validator SHALL validate that input is a valid date
3. THE Validator SHALL support min and max date constraints
4. THE Validator SHALL support optional and nullable modifiers for boolean and date types
5. THE Validator SHALL support default values for boolean and date types

### Requirement 5: Enum Validation

**User Story:** As a developer, I want to validate that values match a predefined set of options, so that I can enforce controlled vocabularies.

#### Acceptance Criteria

1. WHEN an enum schema is created with allowed values, THE Validator SHALL validate that input matches one of the allowed values
2. THE Validator SHALL support string enums
3. THE Validator SHALL support number enums
4. WHEN validation fails, THE Validator SHALL return an error with code "enum.invalid" and include allowed values in metadata

### Requirement 6: Object Schema Validation

**User Story:** As a developer, I want to validate complex object structures with nested properties, so that I can ensure data integrity for structured data.

#### Acceptance Criteria

1. WHEN an object schema is defined with property schemas, THE Validator SHALL validate each property according to its schema
2. THE Validator SHALL track validation error paths for nested properties
3. THE Validator SHALL support optional properties in object schemas
4. THE Validator SHALL support deeply nested object validation
5. WHEN a required property is missing, THE Validator SHALL return an error with the property path
6. THE Validator SHALL support strict mode to reject unknown properties
7. THE Validator SHALL support passthrough mode to allow unknown properties

### Requirement 7: Array Schema Validation

**User Story:** As a developer, I want to validate arrays with element type constraints and length requirements, so that I can ensure collection data quality.

#### Acceptance Criteria

1. WHEN an array schema is defined with an element schema, THE Validator SHALL validate each element according to the element schema
2. THE Validator SHALL provide min and max length constraints for arrays
3. THE Validator SHALL track validation error paths for array elements using indices
4. WHEN array validation fails, THE Validator SHALL return errors with paths like ["items", "0", "name"]
5. THE Validator SHALL support arrays of primitive types
6. THE Validator SHALL support arrays of object types
7. THE Validator SHALL support nested arrays

### Requirement 8: Union and Intersection Schemas

**User Story:** As a developer, I want to validate data that can match multiple possible schemas, so that I can handle polymorphic data structures.

#### Acceptance Criteria

1. WHEN a union schema is defined, THE Validator SHALL accept input matching any of the union member schemas
2. WHEN a union validation fails, THE Validator SHALL return errors from all attempted schema validations
3. THE Validator SHALL support intersection schemas that require input to satisfy all member schemas
4. THE Validator SHALL support discriminated unions with a discriminator field

### Requirement 9: Asynchronous Validation

**User Story:** As a developer, I want to perform asynchronous validation checks, so that I can validate data against external systems like databases or APIs.

#### Acceptance Criteria

1. WHEN a schema includes async validation rules, THE Validator SHALL return a Promise from safeParse
2. THE Validator SHALL support async refine methods with predicates returning Promises
3. WHEN async validation fails, THE Validator SHALL include the custom error message in the result
4. THE Validator SHALL execute async validations after synchronous validations pass
5. THE Validator SHALL support multiple async validation rules on a single schema

### Requirement 10: Data Transformers

**User Story:** As a developer, I want to transform validated data automatically, so that I can normalize and clean input data consistently.

#### Acceptance Criteria

1. WHEN a schema includes transform methods, THE Validator SHALL apply transformations after successful validation
2. THE Validator SHALL support string transformers like trim, toLowerCase, and toUpperCase
3. THE Validator SHALL support number transformers like parseInt and parseFloat
4. THE Validator SHALL support custom transform functions
5. THE Validator SHALL apply transformers in the order they are defined
6. THE Validator SHALL include transformed data in successful Validation_Result objects

### Requirement 11: Custom Validation Rules

**User Story:** As a developer, I want to add custom validation rules to schemas, so that I can implement domain-specific validation logic.

#### Acceptance Criteria

1. WHEN refine is called with a predicate function and message, THE Validator SHALL add the custom rule to the schema
2. WHEN the predicate returns false, THE Validator SHALL include the custom error message in validation errors
3. THE Validator SHALL support synchronous refine predicates
4. THE Validator SHALL support asynchronous refine predicates
5. THE Validator SHALL execute custom rules after built-in validation rules pass

### Requirement 12: Validation Error Structure

**User Story:** As a developer, I want structured validation errors with paths and codes, so that I can provide meaningful feedback to users.

#### Acceptance Criteria

1. WHEN validation fails, THE Validator SHALL return Validation_Error objects with path, message, code, and optional meta fields
2. THE Validator SHALL use dot-notation error codes like "string.email" and "number.min"
3. THE Validator SHALL track error paths as arrays of property names and indices
4. THE Validator SHALL include relevant metadata in errors (e.g., min/max values for range errors)
5. WHEN multiple validations fail, THE Validator SHALL return all validation errors
6. THE Validator SHALL provide human-readable error messages in English by default

### Requirement 13: TypeScript Type Inference

**User Story:** As a TypeScript developer, I want automatic type inference from schemas, so that I don't need to manually define duplicate types.

#### Acceptance Criteria

1. THE Validator SHALL provide an Infer utility type that extracts TypeScript types from schemas
2. WHEN a schema is defined, THE Validator SHALL enable TypeScript to infer the validated data type
3. THE Validator SHALL infer correct types for nested object schemas
4. THE Validator SHALL infer correct types for array schemas
5. THE Validator SHALL infer correct types for union schemas
6. THE Validator SHALL infer correct types for optional and nullable fields
7. THE Validator SHALL infer correct types after transformers are applied

### Requirement 14: React Adapter

**User Story:** As a React developer, I want a hook for form validation, so that I can easily integrate validation into React components.

#### Acceptance Criteria

1. THE Validator SHALL provide a useValidator hook that accepts a schema
2. WHEN useValidator is called, THE Validator SHALL return validation functions and error state
3. THE Validator SHALL update error state reactively when validation is performed
4. THE Validator SHALL support async validation in the React hook
5. THE Validator SHALL provide field-level error access by path
6. THE Validator SHALL integrate with React form libraries without requiring specific dependencies

### Requirement 15: Vue Adapter

**User Story:** As a Vue developer, I want a composable for form validation, so that I can easily integrate validation into Vue components.

#### Acceptance Criteria

1. THE Validator SHALL provide a useValidation composable that accepts a schema
2. WHEN useValidation is called, THE Validator SHALL return reactive validation functions and error state
3. THE Validator SHALL update error state reactively when validation is performed
4. THE Validator SHALL support async validation in the Vue composable
5. THE Validator SHALL provide field-level error access by path

### Requirement 16: Angular Adapter

**User Story:** As an Angular developer, I want an injectable validation service, so that I can integrate validation into Angular forms.

#### Acceptance Criteria

1. THE Validator SHALL provide an injectable ValidationService for Angular
2. THE Validator SHALL integrate with Angular reactive forms
3. THE Validator SHALL provide validators compatible with Angular's form validation system
4. THE Validator SHALL support async validators for Angular forms

### Requirement 17: Express/NestJS Adapter

**User Story:** As a backend developer, I want middleware for request validation, so that I can validate incoming HTTP requests automatically.

#### Acceptance Criteria

1. THE Validator SHALL provide Express middleware that validates request bodies against schemas
2. WHEN validation fails in middleware, THE Validator SHALL return a 400 status with validation errors
3. WHEN validation succeeds in middleware, THE Validator SHALL attach validated data to the request object
4. THE Validator SHALL provide NestJS decorators for request validation
5. THE Validator SHALL support validation of request body, query parameters, and route parameters

### Requirement 18: Plugin System

**User Story:** As a developer, I want to extend the validator with custom rules globally, so that I can add domain-specific validation logic across all schemas.

#### Acceptance Criteria

1. THE Validator SHALL provide a plugin registration mechanism
2. WHEN a plugin is registered, THE Validator SHALL make custom validation rules available to all schemas
3. THE Validator SHALL support plugins that add new schema types
4. THE Validator SHALL support plugins that add new validation methods
5. THE Validator SHALL execute plugin validation rules in registration order

### Requirement 19: Internationalization Support

**User Story:** As a developer building international applications, I want to customize error messages for different locales, so that I can provide localized validation feedback.

#### Acceptance Criteria

1. THE Validator SHALL use standardized error codes for all validation errors
2. THE Validator SHALL provide a mechanism to register custom error message templates
3. WHEN custom message templates are registered, THE Validator SHALL use them instead of default messages
4. THE Validator SHALL support message templates with placeholders for dynamic values
5. THE Validator SHALL allow error message customization per schema instance

### Requirement 20: JSON Schema Export

**User Story:** As a developer working with OpenAPI/Swagger, I want to export schemas as JSON Schema, so that I can generate API documentation automatically.

#### Acceptance Criteria

1. THE Validator SHALL provide a toJSONSchema method on schema objects
2. WHEN toJSONSchema is called, THE Validator SHALL return a valid JSON Schema representation
3. THE Validator SHALL convert primitive schemas to JSON Schema types
4. THE Validator SHALL convert object schemas to JSON Schema objects with properties
5. THE Validator SHALL convert array schemas to JSON Schema arrays
6. THE Validator SHALL include validation constraints (min, max, pattern) in JSON Schema output

### Requirement 21: Optional and Nullable Handling

**User Story:** As a developer, I want to distinguish between optional and nullable fields, so that I can model data requirements accurately.

#### Acceptance Criteria

1. WHEN optional is called on a schema, THE Validator SHALL accept undefined values
2. WHEN nullable is called on a schema, THE Validator SHALL accept null values
3. THE Validator SHALL support schemas that are both optional and nullable
4. WHEN a required field is missing, THE Validator SHALL return an error with code "required"
5. THE Validator SHALL infer correct TypeScript types for optional and nullable fields

### Requirement 22: Default Values

**User Story:** As a developer, I want to specify default values for optional fields, so that I can ensure consistent data structures.

#### Acceptance Criteria

1. WHEN default is called on a schema with a value, THE Validator SHALL use the default when input is undefined
2. THE Validator SHALL not apply defaults when input is explicitly null
3. THE Validator SHALL apply defaults before running validation rules
4. THE Validator SHALL support default values for all primitive types
5. THE Validator SHALL support default values for object and array types

### Requirement 23: Performance Optimization

**User Story:** As a developer, I want the validator to have minimal bundle size and fast execution, so that it doesn't negatively impact application performance.

#### Acceptance Criteria

1. THE Validator SHALL provide tree-shakeable exports for unused features
2. THE Validator SHALL compile to both ESM and CommonJS formats
3. THE Validator SHALL have a core bundle size under 10KB gzipped
4. THE Validator SHALL execute synchronous validation in under 1ms for simple schemas
5. THE Validator SHALL optimize nested validation to avoid redundant checks

### Requirement 24: Error Handling and Safety

**User Story:** As a developer, I want the validator to handle edge cases gracefully, so that my application doesn't crash on unexpected input.

#### Acceptance Criteria

1. WHEN parse receives invalid input, THE Validator SHALL throw a structured error with all validation failures
2. WHEN safeParse receives invalid input, THE Validator SHALL never throw and always return a result object
3. THE Validator SHALL handle circular references in object validation without infinite loops
4. THE Validator SHALL handle extremely large arrays without stack overflow
5. THE Validator SHALL handle malformed input types gracefully
6. WHEN async validation throws an exception, THE Validator SHALL catch it and return a validation error

### Requirement 25: Schema Composition and Reusability

**User Story:** As a developer, I want to compose schemas from smaller reusable pieces, so that I can maintain consistent validation logic across my application.

#### Acceptance Criteria

1. THE Validator SHALL allow schemas to be used as building blocks in other schemas
2. THE Validator SHALL support extending object schemas with additional properties
3. THE Validator SHALL support merging object schemas
4. THE Validator SHALL support picking specific properties from object schemas
5. THE Validator SHALL support omitting specific properties from object schemas
6. THE Validator SHALL maintain type inference through schema composition operations
