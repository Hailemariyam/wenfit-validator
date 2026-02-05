// Error types and utilities exports

export { ValidationError } from './validation-error.js';
export type { ValidationErrorData } from './validation-error.js';
export { ErrorCodes } from './error-codes.js';
export type { ErrorCode } from './error-codes.js';
export {
    setErrorMessages,
    setErrorMessage,
    clearErrorMessages,
    getMessageRegistry,
} from './message-registry.js';
export type { MessageTemplate } from './message-registry.js';
