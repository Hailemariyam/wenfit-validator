// Global error message template registry
// Supports placeholder substitution for internationalization

export type MessageTemplate = string | ((meta?: Record<string, any>) => string);

/**
 * Global registry for error message templates
 * Allows customization of error messages for internationalization
 */
class MessageRegistry {
    private templates: Map<string, MessageTemplate> = new Map();

    /**
     * Register a custom message template for an error code
     * Template can be a string with {{placeholder}} syntax or a function
     */
    setTemplate(code: string, template: MessageTemplate): void {
        this.templates.set(code, template);
    }

    /**
     * Register multiple message templates at once
     */
    setTemplates(templates: Record<string, MessageTemplate>): void {
        for (const [code, template] of Object.entries(templates)) {
            this.setTemplate(code, template);
        }
    }

    /**
     * Get a message template for an error code
     * Returns undefined if no custom template is registered
     */
    getTemplate(code: string): MessageTemplate | undefined {
        return this.templates.get(code);
    }

    /**
     * Check if a custom template exists for an error code
     */
    hasTemplate(code: string): boolean {
        return this.templates.has(code);
    }

    /**
     * Format a message using a template and metadata
     * Supports {{placeholder}} syntax for string templates
     */
    formatMessage(code: string, defaultMessage: string, meta?: Record<string, any>): string {
        const template = this.templates.get(code);

        if (!template) {
            // No custom template, use default message
            return defaultMessage;
        }

        // If template is a function, call it with metadata
        if (typeof template === 'function') {
            return template(meta);
        }

        // If template is a string, substitute placeholders
        return this.substitutePlaceholders(template, meta);
    }

    /**
     * Substitute {{placeholder}} syntax in a template string
     * Example: "Must be at least {{min}}" with {min: 5} -> "Must be at least 5"
     */
    private substitutePlaceholders(template: string, meta?: Record<string, any>): string {
        if (!meta) {
            return template;
        }

        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = meta[key];
            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Clear all custom templates
     */
    clear(): void {
        this.templates.clear();
    }

    /**
     * Remove a specific template
     */
    removeTemplate(code: string): void {
        this.templates.delete(code);
    }
}

// Global singleton instance
const globalRegistry = new MessageRegistry();

/**
 * Set custom error message templates globally
 * These templates will be used for all schemas unless overridden per-schema
 */
export function setErrorMessages(templates: Record<string, MessageTemplate>): void {
    globalRegistry.setTemplates(templates);
}

/**
 * Set a single error message template globally
 */
export function setErrorMessage(code: string, template: MessageTemplate): void {
    globalRegistry.setTemplate(code, template);
}

/**
 * Get the global message registry instance
 * Used internally by schemas to format error messages
 */
export function getMessageRegistry(): MessageRegistry {
    return globalRegistry;
}

/**
 * Clear all custom error message templates
 */
export function clearErrorMessages(): void {
    globalRegistry.clear();
}
