// Wenfit Validator - Main Entry Point
// This file exports all public APIs for the validator

// ============================================================================
// Core Schema Classes and Factory Functions
// ============================================================================

// Base Schema class
export { Schema, OptionalSchema, NullableSchema, DefaultSchema, RefineSchema } from './core/schema.js';

// Primitive schema factory functions and classes
export { string, StringSchema } from './core/primitives/string.js';
export { number, NumberSchema } from './core/primitives/number.js';
export { boolean, BooleanSchema } from './core/primitives/boolean.js';
export { date, DateSchema } from './core/primitives/date.js';
export { enumSchema, EnumSchema } from './core/primitives/enum.js';

// Complex schema factory functions and classes
export { object, ObjectSchema } from './core/object.js';
export type { ObjectShape, InferObjectShape } from './core/object.js';
export { array, ArraySchema } from './core/array.js';
export type { InferArray } from './core/array.js';
export { union, UnionSchema } from './core/union.js';
export type { InferUnion } from './core/union.js';
export { intersection, IntersectionSchema } from './core/intersection.js';
export type { InferIntersection } from './core/intersection.js';

// ============================================================================
// Type Utilities and Inference
// ============================================================================

export type {
    Infer,
    InferInput,
    UnionToIntersection,
    Optional,
    Nullable,
    OptionalNullable,
    WithDefaultValue,
    ArrayElement,
    InferObjectProps,
    MakeOptional,
    MakeNullable,
} from './types/inference.js';

export type { ValidationResult, ParseResult } from './types/validation-result.js';
export { INVALID } from './types/validation-result.js';

// ============================================================================
// Error Types and Codes
// ============================================================================

export { ValidationError } from './errors/validation-error.js';
export type { ValidationErrorData } from './errors/validation-error.js';
export { ErrorCodes } from './errors/error-codes.js';
export type { ErrorCode } from './errors/error-codes.js';

// Error message customization
export {
    setErrorMessages,
    setErrorMessage,
    clearErrorMessages,
    getMessageRegistry,
} from './errors/message-registry.js';
export type { MessageTemplate } from './errors/message-registry.js';

// ============================================================================
// Transformers
// ============================================================================

export type { Transformer } from './transformers/index.js';
export { TransformerPipeline } from './transformers/index.js';

// ============================================================================
// Plugin System
// ============================================================================

export type {
    Plugin,
    ValidatorInstance,
    GlobalValidationRule,
} from './plugins/plugin.js';

export {
    PluginRegistry,
    pluginRegistry,
} from './plugins/plugin.js';

// ============================================================================
// Utilities
// ============================================================================

export { ParseContext } from './core/parse-context.js';
