// Property tests for async validation
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { Schema } from '../../src/core/schema.js';
import { ParseContext } from '../../src/core/parse-context.js';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import type { ParseResult } from '../../src/types/validation-result.js';

// Test schema with async refine
class AsyncRefineSchema extends Schema<string, string> {
    constructor(
        private predicate: (value: string) => Promise<boolean>,
        private errorMessage: string
    ) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<string> {
        // First validate type
        if (typeof input !== 'string') {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Expected string',
                code: 'invalid_type',
            });
            return input as string;
        }

        // Mark as async and return promise
        ctx.markAsync();
        return this._handleAsync(input, ctx);
    }

    private async _handleAsync(value: string, ctx: ParseContext): Promise<string> {
        try {
            const result = await this.predicate(value);
            if (!result) {
                ctx.addError({
                    path: ctx.getCurrentPath(),
                    message: this.errorMessage,
                    code: 'custom',
                });
            }
            return value;
        } catch (error) {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: error instanceof Error ? error.message : 'Async validation failed',
                code: 'async.error',
            });
            return value;
        }
    }
}

describe('Async Validation Property Tests', () => {
    // Property 14: Async schemas return promises
    // Feature: wenfit-validator, Property 14: Async schemas return promises
    // Validates: Requirements 9.1
    test('Property 14: schemas with async validation return promises from safeParse', async () => {
        await fc.assert(
            fc.asyncProperty(fc.string(), async (input) => {
                // Create schema with async refine
                const schema = string().refine(
                    async (val) => {
                        // Simulate async check (e.g., database lookup)
                        await new Promise(resolve => setTimeout(resolve, 1));
                        return val.length > 0;
                    },
                    'String must not be empty'
                );

                // safeParse should return a Promise
                const result = schema.safeParse(input);
                expect(result).toBeInstanceOf(Promise);

                // Await the result
                const resolvedResult = await result;
                expect(resolvedResult).toHaveProperty('success');

                if (resolvedResult.success) {
                    expect(resolvedResult).toHaveProperty('data');
                } else {
                    expect(resolvedResult).toHaveProperty('errors');
                }
            }),
            { numRuns: 100 }
        );
    });

    // Property 15: Async validation errors include custom messages
    // Feature: wenfit-validator, Property 15: Async validation errors include custom messages
    // Validates: Requirements 9.3
    test('Property 15: async refine errors include custom messages', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(),
                fc.string().filter(msg => msg.length > 0),
                async (input, customMessage) => {
                    // Create schema with async refine that always fails
                    const schema = string().refine(
                        async () => {
                            await new Promise(resolve => setTimeout(resolve, 1));
                            return false; // Always fail
                        },
                        customMessage
                    );

                    const result = await schema.safeParse(input);

                    // Should fail
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should include custom message
                        expect(result.errors).toHaveLength(1);
                        expect(result.errors[0].message).toBe(customMessage);
                        expect(result.errors[0].code).toBe('custom');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 16: Async validation runs after sync validation
    // Feature: wenfit-validator, Property 16: Async validation runs after sync validation
    // Validates: Requirements 9.4
    test('Property 16: async validation only runs after sync validation passes', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.anything(),
                async (input) => {
                    let asyncRan = false;

                    // Create schema with sync validation (type check) and async refine
                    const schema = string().refine(
                        async (val) => {
                            asyncRan = true;
                            await new Promise(resolve => setTimeout(resolve, 1));
                            return val.length > 0;
                        },
                        'String must not be empty'
                    );

                    const result = await schema.safeParse(input);

                    // If input is not a string, sync validation fails
                    if (typeof input !== 'string') {
                        // Async validation should NOT have run
                        expect(asyncRan).toBe(false);
                        expect(result.success).toBe(false);
                    } else {
                        // Async validation should have run
                        expect(asyncRan).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 37: Async exceptions become validation errors
    // Feature: wenfit-validator, Property 37: Async exceptions become validation errors
    // Validates: Requirements 24.6
    test('Property 37: exceptions in async predicates are caught and converted to errors', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(),
                fc.string().filter(msg => msg.length > 0),
                async (input, errorMessage) => {
                    // Create schema with async refine that throws
                    const schema = string().refine(
                        async () => {
                            await new Promise(resolve => setTimeout(resolve, 1));
                            throw new Error(errorMessage);
                        },
                        'Should not see this message'
                    );

                    // Should not throw, should return error result
                    const result = await schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.errors).toHaveLength(1);
                        // Error message should be from the exception
                        expect(result.errors[0].message).toBe(errorMessage);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: parse also returns promises for async schemas
    test('parse returns promise for async schemas', async () => {
        await fc.assert(
            fc.asyncProperty(fc.string(), async (input) => {
                const schema = string().refine(
                    async (val) => {
                        await new Promise(resolve => setTimeout(resolve, 1));
                        return val.length > 0;
                    },
                    'String must not be empty'
                );

                const result = schema.parse(input);
                expect(result).toBeInstanceOf(Promise);

                if (input.length > 0) {
                    const resolved = await result;
                    expect(resolved).toBe(input);
                } else {
                    await expect(result).rejects.toThrow();
                }
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: multiple async refines execute in order
    test('multiple async refines execute in order', async () => {
        await fc.assert(
            fc.asyncProperty(fc.integer({ min: 0, max: 100 }), async (input) => {
                const executionOrder: number[] = [];

                const schema = number()
                    .refine(
                        async (val) => {
                            await new Promise(resolve => setTimeout(resolve, 1));
                            executionOrder.push(1);
                            return val >= 0;
                        },
                        'Must be non-negative'
                    )
                    .refine(
                        async (val) => {
                            await new Promise(resolve => setTimeout(resolve, 1));
                            executionOrder.push(2);
                            return val <= 100;
                        },
                        'Must be at most 100'
                    );

                await schema.safeParse(input);

                // Both should have executed in order
                expect(executionOrder).toEqual([1, 2]);
            }),
            { numRuns: 100 }
        );
    });
});
