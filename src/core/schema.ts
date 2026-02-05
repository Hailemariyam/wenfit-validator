// Base Schema class - foundation of all validation schemas

import { ParseContext } from './parse-context.js';
import { ValidationError } from '../errors/validation-error.js';
import type { ValidationResult, ParseResult } from '../types/validation-result.js';
import { pluginRegistry } from '../plugins/plugin.js';

/**
 * Base abstract class for all schemas
 * TInput: The input type before validation
 * TOutput: The output type after validation (may differ due to transformers)
 */
export abstract class Schema<TInput = any, TOutput = TInput> {
    /**
     * Internal parse method - must be implemented by subclasses
     * Returns the parsed value, a Promise, or INVALID symbol
     */
    abstract _parse(input: unknown, ctx: ParseContext): ParseResult<TOutput>;

    /**
     * Parse input and throw ValidationError on failure
     * Use this when you want exceptions for invalid data (e.g., server-side)
     * Returns Promise<TOutput> if async validation is detected
     */
    parse(input: unknown): TOutput | Promise<TOutput> {
        const result = this.safeParse(input);

        // Handle async validation
        if (result instanceof Promise) {
            return result.then(r => {
                if (!r.success) {
                    throw new ValidationError(r.errors);
                }
                return r.data;
            });
        }

        // Sync validation
        if (!result.success) {
            throw new ValidationError(result.errors);
        }
        return result.data;
    }

    /**
     * Parse input and return ValidationResult without throwing
     * Use this when you want to handle errors gracefully (e.g., client-side)
     * Returns Promise<ValidationResult> if async validation is detected
     */
    safeParse(input: unknown): ValidationResult<TOutput> | Promise<ValidationResult<TOutput>> {
        const ctx = new ParseContext();
        const result = this._parse(input, ctx);

        // Apply global plugin rules after schema validation
        const globalRules = pluginRegistry.getGlobalRules();

        // If there are global rules and no errors yet, apply them
        if (globalRules.length > 0 && !ctx.hasErrors()) {
            // Check if any rule is async
            let hasAsyncRule = false;
            const ruleResults: (boolean | Promise<boolean>)[] = [];

            for (const rule of globalRules) {
                try {
                    const ruleResult = rule.validate(this, input);
                    ruleResults.push(ruleResult);

                    if (ruleResult instanceof Promise) {
                        hasAsyncRule = true;
                        ctx.markAsync();
                    }
                } catch (error) {
                    // If rule throws, treat as validation failure
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: error instanceof Error ? error.message : rule.message,
                        code: rule.code || 'plugin.error',
                    });
                }
            }

            // If any rule is async, handle async validation
            if (hasAsyncRule) {
                return this._handleAsyncPluginRules(result, ctx, globalRules, ruleResults);
            }

            // Process synchronous rule results
            for (let i = 0; i < ruleResults.length; i++) {
                const ruleResult = ruleResults[i];
                if (ruleResult === false) {
                    const rule = globalRules[i];
                    if (rule) {
                        ctx.addError({
                            path: ctx.getCurrentPath(),
                            message: rule.message,
                            code: rule.code || 'plugin.error',
                        });
                    }
                }
            }
        }

        // Handle async validation
        if (result instanceof Promise || ctx.isAsyncValidation()) {
            return this._handleAsyncParse(result, ctx);
        }

        // Check if validation failed
        if (ctx.hasErrors()) {
            return {
                success: false,
                errors: ctx.getErrors(),
            };
        }

        // Validation succeeded
        return {
            success: true,
            data: result as TOutput,
        };
    }

    /**
     * Internal method to handle async validation
     */
    private async _handleAsyncParse(
        result: ParseResult<TOutput>,
        ctx: ParseContext
    ): Promise<ValidationResult<TOutput>> {
        try {
            // Await the result if it's a Promise
            const resolvedResult = result instanceof Promise ? await result : result;

            // Check if validation failed
            if (ctx.hasErrors()) {
                return {
                    success: false,
                    errors: ctx.getErrors(),
                };
            }

            // Validation succeeded
            return {
                success: true,
                data: resolvedResult as TOutput,
            };
        } catch (error) {
            // If promise rejects, add error
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: error instanceof Error ? error.message : 'Async validation failed',
                code: 'async.error',
            });

            return {
                success: false,
                errors: ctx.getErrors(),
            };
        }
    }

    /**
     * Internal method to handle async plugin rules
     */
    private async _handleAsyncPluginRules(
        result: ParseResult<TOutput>,
        ctx: ParseContext,
        globalRules: any[],
        ruleResults: (boolean | Promise<boolean>)[]
    ): Promise<ValidationResult<TOutput>> {
        // Wait for all rule results to resolve
        const resolvedResults = await Promise.all(
            ruleResults.map(r => Promise.resolve(r).catch(() => false))
        );

        // Check each rule result
        for (let i = 0; i < resolvedResults.length; i++) {
            if (resolvedResults[i] === false) {
                const rule = globalRules[i];
                ctx.addError({
                    path: ctx.getCurrentPath(),
                    message: rule.message,
                    code: rule.code || 'plugin.error',
                });
            }
        }

        // Now handle the main async parse
        return this._handleAsyncParse(result, ctx);
    }

    /**
     * Make this schema optional (accepts undefined)
     */
    optional(): OptionalSchema<TInput, TOutput> {
        return new OptionalSchema(this);
    }

    /**
     * Make this schema nullable (accepts null)
     */
    nullable(): NullableSchema<TInput, TOutput> {
        return new NullableSchema(this);
    }

    /**
     * Provide a default value when input is undefined
     * Note: Does NOT apply when input is null (only undefined)
     * Default is applied BEFORE validation
     */
    default(value: TOutput): DefaultSchema<TInput, TOutput> {
        return new DefaultSchema(this, value);
    }

    /**
     * Transform the output after successful validation
     * Transformations are applied after validation passes
     */
    transform<U>(fn: (value: TOutput) => U): TransformSchema<TInput, TOutput, U> {
        return new TransformSchema(this, fn);
    }

    /**
     * Add custom validation rule with a predicate function
     * Custom rules execute AFTER built-in validation passes
     * Supports both synchronous and asynchronous predicates
     */
    refine(
        predicate: (value: TOutput) => boolean | Promise<boolean>,
        message: string | { message: string; code?: string }
    ): RefineSchema<TInput, TOutput> {
        return new RefineSchema(this, predicate, message);
    }

    /**
     * Convert schema to JSON Schema format
     * Override in subclasses to provide specific JSON Schema representations
     */
    toJSONSchema(): Record<string, any> {
        // Default implementation - subclasses should override
        return {};
    }
}

/**
 * Schema wrapper that makes a schema optional (accepts undefined)
 */
export class OptionalSchema<TInput, TOutput> extends Schema<TInput | undefined, TOutput | undefined> {
    constructor(private innerSchema: Schema<TInput, TOutput>) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<TOutput | undefined> {
        // Accept undefined values
        if (input === undefined) {
            return undefined;
        }

        // Otherwise, validate with the inner schema
        return this.innerSchema._parse(input, ctx);
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        // Optional schemas can be represented by allowing the inner schema or undefined
        // In JSON Schema, this is typically done with anyOf or by not including in required
        return this.innerSchema.toJSONSchema();
    }
}

/**
 * Schema wrapper that makes a schema nullable (accepts null)
 */
export class NullableSchema<TInput, TOutput> extends Schema<TInput | null, TOutput | null> {
    constructor(private innerSchema: Schema<TInput, TOutput>) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<TOutput | null> {
        // Accept null values
        if (input === null) {
            return null;
        }

        // Otherwise, validate with the inner schema
        return this.innerSchema._parse(input, ctx);
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        const innerSchema = this.innerSchema.toJSONSchema();
        // Nullable schemas can accept null or the inner type
        return {
            anyOf: [
                innerSchema,
                { type: 'null' }
            ]
        };
    }
}

/**
 * Schema wrapper that applies a default value when input is undefined
 * Note: Does NOT apply default when input is null (only undefined)
 * Default is applied BEFORE validation
 */
export class DefaultSchema<TInput, TOutput> extends Schema<TInput | undefined, TOutput> {
    constructor(
        private innerSchema: Schema<TInput, TOutput>,
        private defaultValue: TOutput
    ) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<TOutput> {
        // Apply default value when input is undefined (but NOT when null)
        if (input === undefined) {
            input = this.defaultValue;
        }

        // Validate with the inner schema (default is applied before validation)
        return this.innerSchema._parse(input, ctx);
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        const innerSchema = this.innerSchema.toJSONSchema();
        // Add default value to the schema
        return {
            ...innerSchema,
            default: this.defaultValue
        };
    }
}

/**
 * Schema wrapper that applies a transformation after successful validation
 * Transformations are applied AFTER validation passes
 */
export class TransformSchema<TInput, TValidated, TOutput> extends Schema<TInput, TOutput> {
    constructor(
        private innerSchema: Schema<TInput, TValidated>,
        private transformer: (value: TValidated) => TOutput
    ) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<TOutput> {
        // First validate with the inner schema
        const result = this.innerSchema._parse(input, ctx);

        // If validation failed, return INVALID
        if (ctx.hasErrors()) {
            return result as any; // Type doesn't matter since there are errors
        }

        // Apply transformation to the validated result
        try {
            const transformed = this.transformer(result as TValidated);
            return transformed;
        } catch (error) {
            // If transformation throws, add an error
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: error instanceof Error ? error.message : 'Transformation failed',
                code: 'transform.error',
            });
            return result as any; // Return original, but errors will prevent success
        }
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        // Transform schemas use the inner schema's JSON Schema
        // Note: JSON Schema doesn't have a way to represent transformations
        return this.innerSchema.toJSONSchema();
    }
}

/**
 * Schema wrapper that adds custom validation rules
 * Custom rules execute AFTER built-in validation passes
 * Supports both synchronous and asynchronous predicates
 */
export class RefineSchema<TInput, TOutput> extends Schema<TInput, TOutput> {
    private errorMessage: string;
    private errorCode: string;

    constructor(
        private innerSchema: Schema<TInput, TOutput>,
        private predicate: (value: TOutput) => boolean | Promise<boolean>,
        message: string | { message: string; code?: string }
    ) {
        super();

        // Parse message parameter
        if (typeof message === 'string') {
            this.errorMessage = message;
            this.errorCode = 'custom';
        } else {
            this.errorMessage = message.message;
            this.errorCode = message.code || 'custom';
        }
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<TOutput> {
        // First validate with the inner schema (built-in validation)
        const result = this.innerSchema._parse(input, ctx);

        // If built-in validation failed, don't run custom rules
        if (ctx.hasErrors()) {
            return result;
        }

        // Now run the custom predicate
        try {
            const predicateResult = this.predicate(result as TOutput);

            // Handle async predicates
            if (predicateResult instanceof Promise) {
                ctx.markAsync();
                return this._handleAsyncPredicate(predicateResult, result as TOutput, ctx);
            }

            // Check if predicate passed (synchronous)
            if (!predicateResult) {
                // Predicate failed, add custom error
                ctx.addError({
                    path: ctx.getCurrentPath(),
                    message: this.errorMessage,
                    code: this.errorCode,
                });
            }

            return result;
        } catch (error) {
            // If predicate throws (synchronous exception), add an error
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: error instanceof Error ? error.message : 'Custom validation failed',
                code: this.errorCode,
            });
            return result as any;
        }
    }

    /**
     * Handle async predicate validation
     */
    private async _handleAsyncPredicate(
        predicatePromise: Promise<boolean>,
        value: TOutput,
        ctx: ParseContext
    ): Promise<TOutput> {
        try {
            // Await the predicate result
            const predicateResult = await predicatePromise;

            // Check if predicate passed
            if (!predicateResult) {
                // Predicate failed, add custom error
                ctx.addError({
                    path: ctx.getCurrentPath(),
                    message: this.errorMessage,
                    code: this.errorCode,
                });
            }

            return value;
        } catch (error) {
            // If async predicate throws an exception, convert to validation error
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: error instanceof Error ? error.message : 'Async validation failed',
                code: this.errorCode,
            });
            return value;
        }
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        // Refine schemas use the inner schema's JSON Schema
        // Note: JSON Schema doesn't have a way to represent custom validation predicates
        return this.innerSchema.toJSONSchema();
    }
}
