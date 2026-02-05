// Transformer interface and pipeline for data transformation after validation

/**
 * Transformer interface - defines a function that transforms data
 * TInput: The input type to the transformer
 * TOutput: The output type after transformation
 */
export interface Transformer<TInput, TOutput> {
    transform: (value: TInput) => TOutput;
}

/**
 * TransformerPipeline - chains multiple transformers together
 * Transformers are executed in the order they are added
 */
export class TransformerPipeline<TInput, TOutput> {
    private transformers: Transformer<any, any>[] = [];

    constructor(transformers: Transformer<any, any>[] = []) {
        this.transformers = transformers;
    }

    /**
     * Add a transformer to the pipeline
     * Returns a new pipeline with the added transformer
     */
    add<U>(transformer: Transformer<TOutput, U>): TransformerPipeline<TInput, U> {
        return new TransformerPipeline<TInput, U>([...this.transformers, transformer]);
    }

    /**
     * Execute all transformers in order
     * Each transformer receives the output of the previous one
     */
    execute(value: TInput): TOutput {
        let result: any = value;
        for (const transformer of this.transformers) {
            result = transformer.transform(result);
        }
        return result as TOutput;
    }

    /**
     * Check if the pipeline has any transformers
     */
    isEmpty(): boolean {
        return this.transformers.length === 0;
    }
}
