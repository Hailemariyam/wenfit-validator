// Type utilities and inference helpers exports

export type { ValidationResult, ParseResult } from './validation-result.js';
export { INVALID } from './validation-result.js';

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
} from './inference.js';
