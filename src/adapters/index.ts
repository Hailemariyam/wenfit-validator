// Wenfit Validator - Framework Adapters
// This file exports all framework-specific adapters

// ============================================================================
// React Adapter
// ============================================================================

export {
    useValidator,
    type UseValidatorOptions,
    type UseValidatorReturn,
    type ValidationMode as ReactValidationMode,
} from './react.js';

// ============================================================================
// Vue Adapter
// ============================================================================

export {
    useValidation,
    type UseValidationOptions,
    type UseValidationReturn,
    type ValidationMode as VueValidationMode,
} from './vue.js';

// ============================================================================
// Angular Adapter
// ============================================================================

export { ValidationService } from './angular.js';

// ============================================================================
// Express/NestJS Adapter
// ============================================================================

export {
    validate,
    validateBody,
    validateQuery,
    validateParams,
    ValidationPipe,
    ValidateBody,
    ValidateQuery,
    ValidateParams,
    type ValidateOptions,
} from './express.js';
