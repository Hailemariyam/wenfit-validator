// Standardized error codes for all validation failures

export const ErrorCodes = {
    // Type errors
    INVALID_TYPE: 'invalid_type',

    // String errors
    STRING_MIN: 'string.min',
    STRING_MAX: 'string.max',
    STRING_LENGTH: 'string.length',
    STRING_PATTERN: 'string.pattern',
    STRING_EMAIL: 'string.email',
    STRING_URL: 'string.url',

    // Number errors
    NUMBER_MIN: 'number.min',
    NUMBER_MAX: 'number.max',
    NUMBER_INT: 'number.int',
    NUMBER_POSITIVE: 'number.positive',
    NUMBER_NEGATIVE: 'number.negative',
    NUMBER_FINITE: 'number.finite',

    // Date errors
    DATE_MIN: 'date.min',
    DATE_MAX: 'date.max',

    // Array errors
    ARRAY_MIN: 'array.min',
    ARRAY_MAX: 'array.max',
    ARRAY_LENGTH: 'array.length',

    // Object errors
    REQUIRED: 'required',
    UNKNOWN_KEYS: 'unknown_keys',

    // Enum errors
    ENUM_INVALID: 'enum.invalid',

    // Union/Intersection errors
    UNION_INVALID: 'union.invalid',
    INTERSECTION_INVALID: 'intersection.invalid',

    // Custom errors
    CUSTOM: 'custom',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
