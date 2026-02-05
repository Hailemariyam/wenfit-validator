// Unit tests for ObjectSchema composition methods

import { describe, test, expect } from 'vitest';
import { object } from '../../../src/core/object.js';
import { string } from '../../../src/core/primitives/string.js';
import { number } from '../../../src/core/primitives/number.js';
import { boolean } from '../../../src/core/primitives/boolean.js';
import { ErrorCodes } from '../../../src/errors/error-codes.js';

describe('ObjectSchema - strict mode', () => {
    test('rejects unknown properties in strict mode', () => {
        const schema = object({
            name: string(),
            age: number(),
        }).strict();

        const result = schema.safeParse({
            name: 'John',
            age: 30,
            extra: 'not allowed',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const unknownError = result.errors.find(e => e.code === ErrorCodes.UNKNOWN_KEYS);
            expect(unknownError).toBeDefined();
            expect(unknownError?.meta?.unknownKeys).toContain('extra');
        }
    });

    test('accepts objects without unknown properties in strict mode', () => {
        const schema = object({
            name: string(),
            age: number(),
        }).strict();

        const result = schema.safeParse({
            name: 'John',
            age: 30,
        });

        expect(result.success).toBe(true);
    });
});

describe('ObjectSchema - passthrough mode', () => {
    test('allows unknown properties in passthrough mode', () => {
        const schema = object({
            name: string(),
        }).passthrough();

        const result = schema.safeParse({
            name: 'John',
            extra: 'allowed',
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.extra).toBe('allowed');
        }
    });
});

describe('ObjectSchema - pick method', () => {
    test('picks specific properties from schema', () => {
        const schema = object({
            name: string(),
            age: number(),
            email: string(),
        });

        const pickedSchema = schema.pick(['name', 'email']);

        const result = pickedSchema.safeParse({
            name: 'John',
            email: 'john@example.com',
        });

        expect(result.success).toBe(true);
    });

    test('picked schema rejects missing picked properties', () => {
        const schema = object({
            name: string(),
            age: number(),
        });

        const pickedSchema = schema.pick(['name', 'age']);

        const result = pickedSchema.safeParse({
            name: 'John',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const requiredError = result.errors.find(e =>
                e.code === ErrorCodes.REQUIRED && e.path.includes('age')
            );
            expect(requiredError).toBeDefined();
        }
    });
});

describe('ObjectSchema - omit method', () => {
    test('omits specific properties from schema', () => {
        const schema = object({
            name: string(),
            age: number(),
            email: string(),
        });

        const omittedSchema = schema.omit(['age']);

        const result = omittedSchema.safeParse({
            name: 'John',
            email: 'john@example.com',
        });

        expect(result.success).toBe(true);
    });

    test('omitted schema still requires non-omitted properties', () => {
        const schema = object({
            name: string(),
            age: number(),
        });

        const omittedSchema = schema.omit(['age']);

        const result = omittedSchema.safeParse({});

        expect(result.success).toBe(false);
        if (!result.success) {
            const requiredError = result.errors.find(e =>
                e.code === ErrorCodes.REQUIRED && e.path.includes('name')
            );
            expect(requiredError).toBeDefined();
        }
    });
});

describe('ObjectSchema - extend method', () => {
    test('extends schema with additional properties', () => {
        const baseSchema = object({
            name: string(),
        });

        const extendedSchema = baseSchema.extend({
            email: string(),
        });

        const result = extendedSchema.safeParse({
            name: 'John',
            email: 'john@example.com',
        });

        expect(result.success).toBe(true);
    });

    test('extended schema requires all properties', () => {
        const baseSchema = object({
            name: string(),
        });

        const extendedSchema = baseSchema.extend({
            email: string(),
        });

        const result = extendedSchema.safeParse({
            name: 'John',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const requiredError = result.errors.find(e =>
                e.code === ErrorCodes.REQUIRED && e.path.includes('email')
            );
            expect(requiredError).toBeDefined();
        }
    });
});

describe('ObjectSchema - merge method', () => {
    test('merges two object schemas', () => {
        const schema1 = object({
            name: string(),
        });

        const schema2 = object({
            email: string(),
        });

        const mergedSchema = schema1.merge(schema2);

        const result = mergedSchema.safeParse({
            name: 'John',
            email: 'john@example.com',
        });

        expect(result.success).toBe(true);
    });

    test('merged schema requires all properties from both schemas', () => {
        const schema1 = object({
            name: string(),
        });

        const schema2 = object({
            email: string(),
        });

        const mergedSchema = schema1.merge(schema2);

        const result = mergedSchema.safeParse({
            name: 'John',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const requiredError = result.errors.find(e =>
                e.code === ErrorCodes.REQUIRED && e.path.includes('email')
            );
            expect(requiredError).toBeDefined();
        }
    });
});
