// Type inference utilities for extracting TypeScript types from schemas

import type { Schema } from '../core/schema.js';

/**
 * Extract the output type from a Schema
 * This is the primary type inference utility that developers will use
 *
 * @example
 * const userSchema = object({ name: string(), age: number() });
 * type User = Infer<typeof userSchema>; // { name: string; age: number }
 */
export type Infer<T extends Schema<any, any>> = T extends Schema<any, infer O> ? O : never;

/**
 * Extract the input type from a Schema
 * Useful for understanding what types are accepted before validation
 *
 * @example
 * const schema = string().transform(s => parseInt(s));
 * type Input = InferInput<typeof schema>; // string
 * type Output = Infer<typeof schema>; // number
 */
export type InferInput<T extends Schema<any, any>> = T extends Schema<infer I, any> ? I : never;

/**
 * Convert a union type to an intersection type
 * Used internally for intersection schemas
 *
 * @example
 * type Union = { a: string } | { b: number };
 * type Intersection = UnionToIntersection<Union>; // { a: string } & { b: number }
 */
export type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/**
 * Helper type for optional schemas
 * Adds undefined to the type
 *
 * @example
 * type OptionalString = Optional<string>; // string | undefined
 */
export type Optional<T> = T | undefined;

/**
 * Helper type for nullable schemas
 * Adds null to the type
 *
 * @example
 * type NullableString = Nullable<string>; // string | null
 */
export type Nullable<T> = T | null;

/**
 * Helper type for schemas that are both optional and nullable
 * Adds both undefined and null to the type
 *
 * @example
 * type OptionalNullableString = OptionalNullable<string>; // string | null | undefined
 */
export type OptionalNullable<T> = T | null | undefined;

/**
 * Helper type for default schemas
 * Removes undefined from the type since default values are applied
 *
 * @example
 * type WithDefault = WithDefaultValue<string | undefined>; // string
 */
export type WithDefaultValue<T> = Exclude<T, undefined>;

/**
 * Helper type for extracting the element type from an array schema
 *
 * @example
 * type ElementType = ArrayElement<string[]>; // string
 */
export type ArrayElement<T> = T extends (infer E)[] ? E : never;

/**
 * Helper type for object schema property types
 * Maps schema definitions to their inferred types
 *
 * @example
 * type Props = { name: StringSchema, age: NumberSchema };
 * type Inferred = InferObjectProps<Props>; // { name: string, age: number }
 */
export type InferObjectProps<T extends Record<string, Schema<any, any>>> = {
    [K in keyof T]: Infer<T[K]>;
};

/**
 * Helper type for making specific properties optional
 *
 * @example
 * type User = { name: string; age: number; email: string };
 * type PartialUser = MakeOptional<User, 'email'>; // { name: string; age: number; email?: string }
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Helper type for making specific properties nullable
 *
 * @example
 * type User = { name: string; age: number };
 * type UserWithNullableAge = MakeNullable<User, 'age'>; // { name: string; age: number | null }
 */
export type MakeNullable<T, K extends keyof T> = Omit<T, K> & {
    [P in K]: T[P] | null;
};
