// Property tests for JSON Schema export
// Feature: wenfit-validator, Property 28: JSON Schema conversion preserves structure
// Validates: Requirements 20.2, 20.3, 20.4, 20.5, 20.6

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { boolean } from '../../src/core/primitives/boolean.js';
import { date } from '../../src/core/primitives/date.js';
import { enumSchema } from '../../src/core/primitives/enum.js';
import { object } from '../../src/core/object.js';
import { array } from '../../src/core/array.js';
import { union } from '../../src/core/union.js';
import { intersection } from '../../src/core/intersection.js';

describe('JSON Schema Export Property Tests', () => {
    // Property 28: JSON Schema conversion preserves structure (primitives)
    test('Property 28: string schema converts to valid JSON Schema with constraints', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 50 }),
                fc.integer({ min: 51, max: 100 }),
                (min, max) => {
                    const schema = string().min(min).max(max);
                    const jsonSchema = schema.toJSONSchema();

                    // Should have correct type
                    expect(jsonSchema.type).toBe('string');

                    // Should preserve constraints
                    expect(jsonSchema.minLength).toBe(min);
                    expect(jsonSchema.maxLength).toBe(max);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 28: string schema with email format converts correctly', () => {
        const schema = string().email();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('string');
        expect(jsonSchema.format).toBe('email');
    });

    test('Property 28: string schema with url format converts correctly', () => {
        const schema = string().url();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('string');
        expect(jsonSchema.format).toBe('uri');
    });

    test('Property 28: string schema with pattern converts correctly', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(/^\d+$/, /^[a-z]+$/, /^[A-Z]+$/, /^\w+$/),
                (pattern) => {
                    const schema = string().pattern(pattern);
                    const jsonSchema = schema.toJSONSchema();

                    expect(jsonSchema.type).toBe('string');
                    expect(jsonSchema.pattern).toBe(pattern.source);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 28: number schema converts to valid JSON Schema with constraints
    test('Property 28: number schema converts to valid JSON Schema with constraints', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -100, max: 0 }),
                fc.integer({ min: 1, max: 100 }),
                (min, max) => {
                    const schema = number().min(min).max(max);
                    const jsonSchema = schema.toJSONSchema();

                    // Should have correct type
                    expect(jsonSchema.type).toBe('number');

                    // Should preserve constraints
                    expect(jsonSchema.minimum).toBe(min);
                    expect(jsonSchema.maximum).toBe(max);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 28: integer schema converts to JSON Schema with integer type', () => {
        const schema = number().int();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('integer');
    });

    test('Property 28: integer schema with constraints preserves both type and constraints', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }),
                (min) => {
                    const schema = number().int().min(min);
                    const jsonSchema = schema.toJSONSchema();

                    expect(jsonSchema.type).toBe('integer');
                    expect(jsonSchema.minimum).toBe(min);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 28: boolean schema converts correctly
    test('Property 28: boolean schema converts to valid JSON Schema', () => {
        const schema = boolean();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('boolean');
    });

    // Property 28: date schema converts correctly
    test('Property 28: date schema converts to valid JSON Schema', () => {
        const schema = date();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('string');
        expect(jsonSchema.format).toBe('date-time');
    });

    test('Property 28: date schema with constraints converts correctly', () => {
        fc.assert(
            fc.property(
                fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
                fc.date({ min: new Date('2026-01-01'), max: new Date('2030-12-31') }),
                (minDate, maxDate) => {
                    const schema = date().min(minDate).max(maxDate);
                    const jsonSchema = schema.toJSONSchema();

                    expect(jsonSchema.type).toBe('string');
                    expect(jsonSchema.format).toBe('date-time');
                    expect(jsonSchema.formatMinimum).toBe(minDate.toISOString());
                    expect(jsonSchema.formatMaximum).toBe(maxDate.toISOString());
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 28: enum schema converts correctly
    test('Property 28: enum schema converts to valid JSON Schema', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    ['red', 'green', 'blue'] as const,
                    ['small', 'medium', 'large'] as const,
                    [1, 2, 3] as const,
                    [10, 20, 30, 40] as const
                ),
                (values) => {
                    const schema = enumSchema(values);
                    const jsonSchema = schema.toJSONSchema();

                    expect(jsonSchema.enum).toEqual([...values]);

                    // Check type hint
                    const allStrings = values.every(v => typeof v === 'string');
                    const allNumbers = values.every(v => typeof v === 'number');

                    if (allStrings) {
                        expect(jsonSchema.type).toBe('string');
                    } else if (allNumbers) {
                        expect(jsonSchema.type).toBe('number');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 28: object schema converts to valid JSON Schema
    test('Property 28: object schema converts to valid JSON Schema with properties', () => {
        const schema = object({
            name: string(),
            age: number(),
            active: boolean(),
        });
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('object');
        expect(jsonSchema.properties).toBeDefined();
        expect(jsonSchema.properties.name).toEqual({ type: 'string' });
        expect(jsonSchema.properties.age).toEqual({ type: 'number' });
        expect(jsonSchema.properties.active).toEqual({ type: 'boolean' });
        expect(jsonSchema.required).toEqual(['name', 'age', 'active']);
    });

    test('Property 28: nested object schema preserves structure', () => {
        const schema = object({
            user: object({
                name: string(),
                email: string().email(),
            }),
            count: number().int(),
        });
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('object');
        expect(jsonSchema.properties.user).toBeDefined();
        expect(jsonSchema.properties.user.type).toBe('object');
        expect(jsonSchema.properties.user.properties.name).toEqual({ type: 'string' });
        expect(jsonSchema.properties.user.properties.email).toEqual({ type: 'string', format: 'email' });
        expect(jsonSchema.properties.count).toEqual({ type: 'integer' });
    });

    test('Property 28: object schema in strict mode sets additionalProperties to false', () => {
        const schema = object({
            name: string(),
        }).strict();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('object');
        expect(jsonSchema.additionalProperties).toBe(false);
    });

    test('Property 28: object schema in passthrough mode sets additionalProperties to true', () => {
        const schema = object({
            name: string(),
        }).passthrough();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('object');
        expect(jsonSchema.additionalProperties).toBe(true);
    });

    // Property 28: array schema converts to valid JSON Schema
    test('Property 28: array schema converts to valid JSON Schema with items', () => {
        const schema = array(string());
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('array');
        expect(jsonSchema.items).toEqual({ type: 'string' });
    });

    test('Property 28: array schema with constraints preserves constraints', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                fc.integer({ min: 11, max: 50 }),
                (min, max) => {
                    const schema = array(number()).min(min).max(max);
                    const jsonSchema = schema.toJSONSchema();

                    expect(jsonSchema.type).toBe('array');
                    expect(jsonSchema.items).toEqual({ type: 'number' });
                    expect(jsonSchema.minItems).toBe(min);
                    expect(jsonSchema.maxItems).toBe(max);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 28: array of objects preserves nested structure', () => {
        const schema = array(object({
            id: number(),
            name: string(),
        }));
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('array');
        expect(jsonSchema.items.type).toBe('object');
        expect(jsonSchema.items.properties.id).toEqual({ type: 'number' });
        expect(jsonSchema.items.properties.name).toEqual({ type: 'string' });
    });

    // Property 28: union schema converts to valid JSON Schema
    test('Property 28: union schema converts to anyOf', () => {
        const schema = union([string(), number()]);
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.anyOf).toBeDefined();
        expect(jsonSchema.anyOf).toHaveLength(2);
        expect(jsonSchema.anyOf[0]).toEqual({ type: 'string' });
        expect(jsonSchema.anyOf[1]).toEqual({ type: 'number' });
    });

    test('Property 28: union with complex types preserves structure', () => {
        const schema = union([
            object({ type: string(), value: string() }),
            object({ type: string(), value: number() }),
        ]);
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.anyOf).toBeDefined();
        expect(jsonSchema.anyOf).toHaveLength(2);
        expect(jsonSchema.anyOf[0].type).toBe('object');
        expect(jsonSchema.anyOf[1].type).toBe('object');
    });

    // Property 28: intersection schema converts to valid JSON Schema
    test('Property 28: intersection schema converts to allOf', () => {
        const schema = intersection([
            object({ name: string() }),
            object({ age: number() }),
        ]);
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.allOf).toBeDefined();
        expect(jsonSchema.allOf).toHaveLength(2);
        expect(jsonSchema.allOf[0].type).toBe('object');
        expect(jsonSchema.allOf[1].type).toBe('object');
    });

    // Property 28: optional schema preserves inner schema
    test('Property 28: optional schema preserves inner schema structure', () => {
        const schema = string().min(5).optional();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.type).toBe('string');
        expect(jsonSchema.minLength).toBe(5);
    });

    // Property 28: nullable schema uses anyOf with null
    test('Property 28: nullable schema uses anyOf with null type', () => {
        const schema = string().nullable();
        const jsonSchema = schema.toJSONSchema();

        expect(jsonSchema.anyOf).toBeDefined();
        expect(jsonSchema.anyOf).toHaveLength(2);
        expect(jsonSchema.anyOf[0]).toEqual({ type: 'string' });
        expect(jsonSchema.anyOf[1]).toEqual({ type: 'null' });
    });

    // Property 28: default schema includes default value
    test('Property 28: default schema includes default value', () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.string(), fc.integer(), fc.boolean()),
                (defaultValue) => {
                    let schema;
                    if (typeof defaultValue === 'string') {
                        schema = string().default(defaultValue);
                    } else if (typeof defaultValue === 'number') {
                        schema = number().default(defaultValue);
                    } else {
                        schema = boolean().default(defaultValue);
                    }

                    const jsonSchema = schema.toJSONSchema();
                    expect(jsonSchema.default).toBe(defaultValue);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 28: complex nested schema preserves full structure
    test('Property 28: complex nested schema preserves full structure', () => {
        const schema = object({
            users: array(object({
                name: string().min(1),
                email: string().email(),
                age: number().int().min(0),
                roles: array(enumSchema(['admin', 'user', 'guest'] as const)),
            })),
            metadata: object({
                created: date(),
                updated: date(),
            }),
        });

        const jsonSchema = schema.toJSONSchema();

        // Verify top-level structure
        expect(jsonSchema.type).toBe('object');
        expect(jsonSchema.properties.users).toBeDefined();
        expect(jsonSchema.properties.metadata).toBeDefined();

        // Verify users array structure
        expect(jsonSchema.properties.users.type).toBe('array');
        expect(jsonSchema.properties.users.items.type).toBe('object');
        expect(jsonSchema.properties.users.items.properties.name.minLength).toBe(1);
        expect(jsonSchema.properties.users.items.properties.email.format).toBe('email');
        expect(jsonSchema.properties.users.items.properties.age.type).toBe('integer');
        expect(jsonSchema.properties.users.items.properties.age.minimum).toBe(0);

        // Verify roles enum
        expect(jsonSchema.properties.users.items.properties.roles.type).toBe('array');
        expect(jsonSchema.properties.users.items.properties.roles.items.enum).toEqual(['admin', 'user', 'guest']);

        // Verify metadata structure
        expect(jsonSchema.properties.metadata.type).toBe('object');
        expect(jsonSchema.properties.metadata.properties.created.format).toBe('date-time');
        expect(jsonSchema.properties.metadata.properties.updated.format).toBe('date-time');
    });
});
