// Property tests for plugin system
// Feature: wenfit-validator

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { Schema } from '../../src/core/schema.js';
import { ParseContext } from '../../src/core/parse-context.js';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { pluginRegistry, Plugin } from '../../src/plugins/plugin.js';
import type { ParseResult } from '../../src/types/validation-result.js';

// Test schema that always succeeds
class AlwaysSucceedSchema extends Schema<any, any> {
    _parse(input: unknown, ctx: ParseContext): ParseResult<any> {
        return input;
    }
}

describe('Plugin System Property Tests', () => {
    // Clear plugin registry before and after each test
    beforeEach(() => {
        pluginRegistry.clear();
    });

    afterEach(() => {
        pluginRegistry.clear();
    });

    // Property 24: Plugins affect all schemas
    // Feature: wenfit-validator, Property 24: Plugins affect all schemas
    // Validates: Requirements 18.2
    test('Property 24: plugins affect all schemas created after registration', () => {
        fc.assert(
            fc.property(
                fc.string(),
                fc.integer({ min: 1, max: 100 }),
                (pluginName, minLength) => {
                    // Clear registry for this test
                    pluginRegistry.clear();

                    // Create a plugin that validates minimum length
                    const plugin: Plugin = {
                        name: pluginName,
                        install: (validator) => {
                            validator.addGlobalRule({
                                name: 'minLength',
                                validate: (schema, input) => {
                                    if (typeof input === 'string') {
                                        return input.length >= minLength;
                                    }
                                    return true; // Don't validate non-strings
                                },
                                message: `String must be at least ${minLength} characters`,
                                code: 'plugin.minLength',
                            });
                        },
                    };

                    // Register the plugin
                    pluginRegistry.register(plugin);

                    // Create schemas AFTER plugin registration
                    const stringSchema = string();
                    const numberSchema = number();
                    const customSchema = new AlwaysSucceedSchema();

                    // Test with string shorter than minLength
                    const shortString = 'a'.repeat(Math.max(0, minLength - 1));
                    const stringResult = stringSchema.safeParse(shortString);

                    // Should fail due to plugin rule
                    if (minLength > 0) {
                        expect(stringResult.success).toBe(false);
                        if (!stringResult.success) {
                            const pluginError = stringResult.errors.find(
                                (e) => e.code === 'plugin.minLength'
                            );
                            expect(pluginError).toBeDefined();
                        }
                    }

                    // Test with string equal to or longer than minLength
                    const longString = 'a'.repeat(minLength);
                    const longStringResult = stringSchema.safeParse(longString);
                    expect(longStringResult.success).toBe(true);

                    // Test that plugin affects other schema types
                    const customResult = customSchema.safeParse(shortString);
                    if (minLength > 0) {
                        expect(customResult.success).toBe(false);
                    }

                    // Test that plugin doesn't affect non-string inputs
                    const numberResult = numberSchema.safeParse(42);
                    expect(numberResult.success).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 25: Plugin rules execute in registration order
    // Feature: wenfit-validator, Property 25: Plugin rules execute in registration order
    // Validates: Requirements 18.5
    test('Property 25: plugin rules execute in registration order', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string(), { minLength: 2, maxLength: 5 }),
                (pluginNames) => {
                    // Ensure unique plugin names
                    const uniqueNames = Array.from(new Set(pluginNames));
                    if (uniqueNames.length < 2) return; // Skip if not enough unique names

                    // Clear registry for this test
                    pluginRegistry.clear();

                    // Track execution order
                    const executionOrder: string[] = [];

                    // Register multiple plugins
                    for (const name of uniqueNames) {
                        const plugin: Plugin = {
                            name,
                            install: (validator) => {
                                validator.addGlobalRule({
                                    name: `rule-${name}`,
                                    validate: (schema, input) => {
                                        executionOrder.push(name);
                                        return true; // Always pass
                                    },
                                    message: `Rule ${name}`,
                                    code: `plugin.${name}`,
                                });
                            },
                        };
                        pluginRegistry.register(plugin);
                    }

                    // Create a schema and validate
                    const schema = new AlwaysSucceedSchema();
                    executionOrder.length = 0; // Clear execution order
                    schema.safeParse('test');

                    // Verify execution order matches registration order
                    expect(executionOrder).toEqual(uniqueNames);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Multiple plugins can be registered
    test('multiple plugins can be registered and all execute', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
                (pluginNames) => {
                    // Ensure unique plugin names
                    const uniqueNames = Array.from(new Set(pluginNames));

                    // Clear registry for this test
                    pluginRegistry.clear();

                    // Track which plugins executed
                    const executed = new Set<string>();

                    // Register plugins
                    for (const name of uniqueNames) {
                        const plugin: Plugin = {
                            name,
                            install: (validator) => {
                                validator.addGlobalRule({
                                    name: `rule-${name}`,
                                    validate: (schema, input) => {
                                        executed.add(name);
                                        return true;
                                    },
                                    message: `Rule ${name}`,
                                });
                            },
                        };
                        pluginRegistry.register(plugin);
                    }

                    // Validate that all plugins are registered
                    expect(pluginRegistry.getAll()).toHaveLength(uniqueNames.length);

                    // Create a schema and validate
                    const schema = new AlwaysSucceedSchema();
                    schema.safeParse('test');

                    // Verify all plugins executed
                    expect(executed.size).toBe(uniqueNames.length);
                    for (const name of uniqueNames) {
                        expect(executed.has(name)).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Plugin validation failures produce errors
    test('plugin validation failures produce appropriate errors', () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (pluginName, errorMessage) => {
                // Clear registry for this test
                pluginRegistry.clear();

                // Create a plugin that always fails
                const plugin: Plugin = {
                    name: pluginName,
                    install: (validator) => {
                        validator.addGlobalRule({
                            name: 'alwaysFail',
                            validate: () => false,
                            message: errorMessage,
                            code: 'plugin.fail',
                        });
                    },
                };

                pluginRegistry.register(plugin);

                // Create a schema and validate
                const schema = new AlwaysSucceedSchema();
                const result = schema.safeParse('test');

                // Should fail due to plugin
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.errors).toHaveLength(1);
                    expect(result.errors[0].message).toBe(errorMessage);
                    expect(result.errors[0].code).toBe('plugin.fail');
                }
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: Plugins don't execute if schema validation fails
    test('plugins do not execute if schema validation fails', () => {
        fc.assert(
            fc.property(fc.string(), (pluginName) => {
                // Clear registry for this test
                pluginRegistry.clear();

                let pluginExecuted = false;

                // Create a plugin
                const plugin: Plugin = {
                    name: pluginName,
                    install: (validator) => {
                        validator.addGlobalRule({
                            name: 'trackExecution',
                            validate: () => {
                                pluginExecuted = true;
                                return true;
                            },
                            message: 'Plugin rule',
                        });
                    },
                };

                pluginRegistry.register(plugin);

                // Create a string schema with constraints that will fail
                const schema = string().min(100);

                // Validate with a short string (will fail schema validation)
                pluginExecuted = false;
                const result = schema.safeParse('short');

                // Schema validation should fail
                expect(result.success).toBe(false);

                // Plugin should NOT have executed (because schema validation failed first)
                expect(pluginExecuted).toBe(false);
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: Plugin registry prevents duplicate names
    test('plugin registry prevents duplicate plugin names', () => {
        fc.assert(
            fc.property(fc.string(), (pluginName) => {
                // Clear registry for this test
                pluginRegistry.clear();

                const plugin1: Plugin = {
                    name: pluginName,
                    install: () => { },
                };

                const plugin2: Plugin = {
                    name: pluginName,
                    install: () => { },
                };

                // First registration should succeed
                pluginRegistry.register(plugin1);

                // Second registration with same name should throw
                expect(() => pluginRegistry.register(plugin2)).toThrow();
            }),
            { numRuns: 100 }
        );
    });
});
