// ValidationError class and error types

export interface ValidationErrorData {
    path: (string | number)[];
    message: string;
    code: string;
    meta?: Record<string, any>;
}

/**
 * ValidationError is thrown when parse() fails
 * Contains all validation errors that occurred
 */
export class ValidationError extends Error {
    constructor(public errors: ValidationErrorData[]) {
        super('Validation failed');
        this.name = 'ValidationError';

        // Maintain proper stack trace for where error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }

    /**
     * Format errors as a human-readable string
     */
    format(): string {
        return this.errors
            .map(e => {
                const pathStr = e.path.length > 0 ? e.path.join('.') : 'root';
                return `${pathStr}: ${e.message}`;
            })
            .join('\n');
    }

    /**
     * Flatten errors into a record keyed by path
     */
    flatten(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        for (const error of this.errors) {
            const key = error.path.length > 0 ? error.path.join('.') : 'root';
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push(error.message);
        }
        return result;
    }
}
