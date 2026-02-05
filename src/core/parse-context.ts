// ParseContext tracks validation state during parsing
// Handles path tracking, error accumulation, and async detection

import { getMessageRegistry } from '../errors/message-registry.js';

export interface ValidationErrorData {
    path: (string | number)[];
    message: string;
    code: string;
    meta?: Record<string, any>;
}

export class ParseContext {
    private path: (string | number)[] = [];
    private errors: ValidationErrorData[] = [];
    private isAsync: boolean = false;
    private visited: WeakSet<object> = new WeakSet();

    /**
     * Add an error to the context
     */
    addError(error: ValidationErrorData): void {
        this.errors.push(error);
    }

    /**
     * Add an error with message template support
     * Uses global message registry to format the message if a template exists
     */
    addErrorWithTemplate(
        code: string,
        defaultMessage: string,
        meta?: Record<string, any>
    ): void {
        const registry = getMessageRegistry();
        const message = registry.formatMessage(code, defaultMessage, meta);

        this.errors.push({
            path: this.getCurrentPath(),
            message,
            code,
            meta,
        });
    }

    /**
     * Check if an object has been visited (for circular reference detection)
     */
    hasVisited(obj: object): boolean {
        return this.visited.has(obj);
    }

    /**
     * Mark an object as visited (for circular reference detection)
     */
    markVisited(obj: object): void {
        this.visited.add(obj);
    }

    /**
     * Unmark an object as visited (when leaving its scope)
     */
    unmarkVisited(obj: object): void {
        this.visited.delete(obj);
    }

    /**
     * Push a path segment (property name or array index)
     */
    pushPath(segment: string | number): void {
        this.path.push(segment);
    }

    /**
     * Pop the last path segment
     */
    popPath(): void {
        this.path.pop();
    }

    /**
     * Get the current path as an array
     */
    getCurrentPath(): (string | number)[] {
        return [...this.path];
    }

    /**
     * Mark this validation as async
     */
    markAsync(): void {
        this.isAsync = true;
    }

    /**
     * Check if validation is async
     */
    isAsyncValidation(): boolean {
        return this.isAsync;
    }

    /**
     * Get all accumulated errors
     */
    getErrors(): ValidationErrorData[] {
        return this.errors;
    }

    /**
     * Check if there are any errors
     */
    hasErrors(): boolean {
        return this.errors.length > 0;
    }
}
