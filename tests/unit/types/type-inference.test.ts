// Unit tests for TypeScript type inference utilities
// These tests verify that types are correctly inferred from schemas

import { describe, test, expect, expectTypeOf } from 'vitest';
import { string, number, boolean, date, enumSchema, object, array, union, intersection } from '../../../src/core/index.js';
import type { Infer, InferInput, UnionToIntersection, Optional, Nullable, OptionalNullable, WithDefaultValue, ArrayElement, InferObjectProps } from '../../../src/types/index.js';

describe('Type Inference Utilities', () => {
    describe('Infer<T> - Extract output type from schema', () => {
        test('infers string type from StringSchema', () => {
            const schema = string();
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse('hello');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(typeof result.data).toBe('string');
            }

            expectTypeOf<Inferred>().toEqualTypeOf<string>();
        });

        test('infers number type from NumberSchema', () => {
            const schema = number();
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse(42);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(typeof result.data).toBe('number');
            }

            expectTypeOf<Inferred>().toEqualTypeOf<number>();
        });

        test('infers boolean type from BooleanSchema', () => {
            const schema = boolean();
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse(true);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(typeof result.data).toBe('boolean');
            }

            expectTypeOf<Inferred>().toEqualTypeOf<boolean>();
        });

        test('infers Date type from DateSchema', () => {
            const schema = date();
            type Inferred = Infer<typeof schema>;

            const testDate = new Date();
            const result = schema.safeParse(testDate);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeInstanceOf(Date);
            }

            expectTypeOf<Inferred>().toEqualTypeOf<Date>();
        });

        test('infers enum type from EnumSchema', () => {
            const schema = enumSchema(['red', 'green', 'blue'] as const);
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse('red');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('red');
            }

            expectTypeOf<Inferred>().toEqualTypeOf<'red' | 'green' | 'blue'>();
        });

        test('infers object type from ObjectSchema', () => {
            const schema = object({
                name: string(),
                age: number(),
                active: boolean(),
            });
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse({ name: 'Alice', age: 30, active: true });
            expect(result.success).toBe(true);

            expectTypeOf<Inferred>().toMatchTypeOf<{
                name: string;
                age: number;
                active: boolean;
            }>();
        });

        test('infers array type from ArraySchema', () => {
            const schema = array(string());
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse(['a', 'b', 'c']);
            expect(result.success).toBe(true);

            expectTypeOf<Inferred>().toEqualTypeOf<string[]>();
        });

        test('infers union type from UnionSchema', () => {
            const schema = union([string(), number()]);
            type Inferred = Infer<typeof schema>;

            const result1 = schema.safeParse('hello');
            expect(result1.success).toBe(true);
            const result2 = schema.safeParse(42);
            expect(result2.success).toBe(true);

            expectTypeOf<Inferred>().toEqualTypeOf<string | number>();
        });

        test('infers intersection type from IntersectionSchema', () => {
            const schema = intersection([
                object({ name: string() }),
                object({ age: number() }),
            ]);
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse({ name: 'Bob', age: 25 });
            expect(result.success).toBe(true);

            expectTypeOf<Inferred>().toMatchTypeOf<{ name: string; age: number }>();
        });
    });

    describe('InferInput<T> - Extract input type from schema', () => {
        test('infers input type for basic schema', () => {
            const schema = string();
            type Input = InferInput<typeof schema>;

            expectTypeOf<Input>().toEqualTypeOf<string>();
        });

        test('infers input type for transformed schema', () => {
            const schema = string().transform(s => parseInt(s, 10));
            type Input = InferInput<typeof schema>;
            type Output = Infer<typeof schema>;

            const result = schema.safeParse('42');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(42);
                expect(typeof result.data).toBe('number');
            }

            expectTypeOf<Input>().toEqualTypeOf<string>();
            expectTypeOf<Output>().toEqualTypeOf<number>();
        });
    });

    describe('Nested schema type inference', () => {
        test('infers deeply nested object types', () => {
            const schema = object({
                user: object({
                    profile: object({
                        name: string(),
                        age: number(),
                    }),
                    settings: object({
                        theme: enumSchema(['light', 'dark'] as const),
                        notifications: boolean(),
                    }),
                }),
            });
            type Inferred = Infer<typeof schema>;

            const testData = {
                user: {
                    profile: { name: 'Charlie', age: 35 },
                    settings: { theme: 'dark' as const, notifications: true },
                },
            };
            const result = schema.safeParse(testData);
            expect(result.success).toBe(true);

            expectTypeOf<Inferred>().toMatchTypeOf<{
                user: {
                    profile: {
                        name: string;
                        age: number;
                    };
                    settings: {
                        theme: 'light' | 'dark';
                        notifications: boolean;
                    };
                };
            }>();
        });

        test('infers nested array types', () => {
            const schema = array(array(number()));
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse([[1, 2], [3, 4]]);
            expect(result.success).toBe(true);

            expectTypeOf<Inferred>().toEqualTypeOf<number[][]>();
        });

        test('infers array of objects', () => {
            const schema = array(object({
                id: number(),
                name: string(),
            }));
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse([
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
            ]);
            expect(result.success).toBe(true);

            expectTypeOf<Inferred>().toMatchTypeOf<Array<{ id: number; name: string }>>();
        });
    });

    describe('Optional and Nullable type inference', () => {
        test('infers optional type', () => {
            const schema = string().optional();
            type Inferred = Infer<typeof schema>;

            const result1 = schema.safeParse('hello');
            expect(result1.success).toBe(true);
            const result2 = schema.safeParse(undefined);
            expect(result2.success).toBe(true);

            expectTypeOf<Inferred>().toEqualTypeOf<string | undefined>();
        });

        test('infers nullable type', () => {
            const schema = number().nullable();
            type Inferred = Infer<typeof schema>;

            const result1 = schema.safeParse(42);
            expect(result1.success).toBe(true);
            const result2 = schema.safeParse(null);
            expect(result2.success).toBe(true);

            expectTypeOf<Inferred>().toEqualTypeOf<number | null>();
        });

        test('infers optional nullable type', () => {
            const schema = boolean().optional().nullable();
            type Inferred = Infer<typeof schema>;

            const result1 = schema.safeParse(true);
            expect(result1.success).toBe(true);
            const result2 = schema.safeParse(null);
            expect(result2.success).toBe(true);
            const result3 = schema.safeParse(undefined);
            expect(result3.success).toBe(true);

            expectTypeOf<Inferred>().toEqualTypeOf<boolean | null | undefined>();
        });

        test('infers optional object properties', () => {
            const schema = object({
                required: string(),
                optional: number().optional(),
            });
            type Inferred = Infer<typeof schema>;

            // Test with optional property present
            const result1 = schema.safeParse({ required: 'test', optional: 42 });
            expect(result1.success).toBe(true);

            // Test with optional property as undefined
            const result2 = schema.safeParse({ required: 'test', optional: undefined });
            expect(result2.success).toBe(true);

            expectTypeOf<Inferred>().toMatchTypeOf<{
                required: string;
                optional: number | undefined;
            }>();
        });
    });

    describe('Default value type inference', () => {
        test('infers type with default value', () => {
            const schema = string().default('default');
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse(undefined);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('default');
            }

            expectTypeOf<Inferred>().toEqualTypeOf<string>();
        });

        test('infers type with default for optional schema', () => {
            const schema = number().optional().default(0);
            type Inferred = Infer<typeof schema>;

            const result = schema.safeParse(undefined);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(0);
            }

            expectTypeOf<Inferred>().toEqualTypeOf<number>();
        });
    });

    describe('Helper type utilities', () => {
        test('UnionToIntersection converts union to intersection', () => {
            type Union = { a: string } | { b: number };
            type Intersection = UnionToIntersection<Union>;

            expectTypeOf<Intersection>().toMatchTypeOf<{ a: string; b: number }>();
        });

        test('Optional adds undefined', () => {
            type OptionalString = Optional<string>;

            expectTypeOf<OptionalString>().toEqualTypeOf<string | undefined>();
        });

        test('Nullable adds null', () => {
            type NullableNumber = Nullable<number>;

            expectTypeOf<NullableNumber>().toEqualTypeOf<number | null>();
        });

        test('OptionalNullable adds both', () => {
            type OptionalNullableBoolean = OptionalNullable<boolean>;

            expectTypeOf<OptionalNullableBoolean>().toEqualTypeOf<boolean | null | undefined>();
        });

        test('WithDefaultValue removes undefined', () => {
            type WithDefault = WithDefaultValue<string | undefined>;

            expectTypeOf<WithDefault>().toEqualTypeOf<string>();
        });

        test('ArrayElement extracts element type', () => {
            type Element = ArrayElement<string[]>;

            expectTypeOf<Element>().toEqualTypeOf<string>();
        });

        test('InferObjectProps maps schema props to types', () => {
            type Props = {
                name: ReturnType<typeof string>;
                age: ReturnType<typeof number>;
            };
            type Inferred = InferObjectProps<Props>;

            expectTypeOf<Inferred>().toMatchTypeOf<{
                name: string;
                age: number;
            }>();
        });
    });
});
