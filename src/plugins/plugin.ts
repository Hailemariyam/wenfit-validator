// Plugin system for extending the validator with custom rules

import type { Schema } from '../core/schema.js';

/**
 * Plugin interface for extending the validator
 * Plugins can add validation rules globally to all schemas
 */
export interface Plugin {
    /**
     * Unique name for the plugin
     */
    name: string;

    /**
     * Install method called when plugin is registered
     * Receives the validator instance to extend
     */
    install(validator: ValidatorInstance): void;
}

/**
 * Validator instance interface for plugin installation
 * Provides access to schema types and registration methods
 */
export interface ValidatorInstance {
    /**
     * Register a global validation rule that applies to all schemas
     */
    addGlobalRule(rule: GlobalValidationRule): void;

    /**
     * Get all registered global rules
     */
    getGlobalRules(): GlobalValidationRule[];
}

/**
 * Global validation rule that can be applied to any schema
 */
export interface GlobalValidationRule {
    /**
     * Unique name for the rule
     */
    name: string;

    /**
     * Validation function that receives the schema and input
     * Returns true if validation passes, false otherwise
     */
    validate: (schema: Schema<any, any>, input: unknown) => boolean | Promise<boolean>;

    /**
     * Error message when validation fails
     */
    message: string;

    /**
     * Error code for the validation failure
     */
    code?: string;
}

/**
 * Plugin registry for managing registered plugins
 */
export class PluginRegistry {
    private plugins: Map<string, Plugin> = new Map();
    private globalRules: GlobalValidationRule[] = [];

    /**
     * Register a plugin
     * Throws if a plugin with the same name is already registered
     */
    register(plugin: Plugin): void {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin "${plugin.name}" is already registered`);
        }

        // Store the plugin
        this.plugins.set(plugin.name, plugin);

        // Create validator instance for plugin installation
        const validatorInstance: ValidatorInstance = {
            addGlobalRule: (rule: GlobalValidationRule) => {
                this.globalRules.push(rule);
            },
            getGlobalRules: () => {
                return [...this.globalRules];
            },
        };

        // Install the plugin
        plugin.install(validatorInstance);
    }

    /**
     * Get a registered plugin by name
     */
    get(name: string): Plugin | undefined {
        return this.plugins.get(name);
    }

    /**
     * Check if a plugin is registered
     */
    has(name: string): boolean {
        return this.plugins.has(name);
    }

    /**
     * Get all registered plugins
     */
    getAll(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get all global validation rules (in registration order)
     */
    getGlobalRules(): GlobalValidationRule[] {
        return [...this.globalRules];
    }

    /**
     * Clear all plugins and rules (useful for testing)
     */
    clear(): void {
        this.plugins.clear();
        this.globalRules = [];
    }
}

/**
 * Global plugin registry instance
 */
export const pluginRegistry = new PluginRegistry();
