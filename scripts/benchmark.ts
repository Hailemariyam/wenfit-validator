import { string, number, object, array, boolean } from '../src/index.js';

interface BenchmarkResult {
    name: string;
    iterations: number;
    totalTime: number;
    avgTime: number;
    opsPerSecond: number;
}

function benchmark(name: string, fn: () => void, iterations: number = 10000): BenchmarkResult {
    // Warm up
    for (let i = 0; i < 100; i++) {
        fn();
    }

    // Actual benchmark
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = performance.now();

    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSecond = (iterations / totalTime) * 1000;

    return {
        name,
        iterations,
        totalTime,
        avgTime,
        opsPerSecond,
    };
}

function formatResult(result: BenchmarkResult): void {
    console.log(`\n${result.name}`);
    console.log(`  Iterations:     ${result.iterations.toLocaleString()}`);
    console.log(`  Total time:     ${result.totalTime.toFixed(2)} ms`);
    console.log(`  Average time:   ${result.avgTime.toFixed(4)} ms`);
    console.log(`  Ops/second:     ${Math.round(result.opsPerSecond).toLocaleString()}`);
}

console.log('\n🚀 Performance Benchmarks\n');
console.log('═'.repeat(60));

// Benchmark 1: Simple string validation
const simpleStringSchema = string().min(3).max(50);
const simpleStringResult = benchmark(
    '1. Simple String Validation',
    () => {
        simpleStringSchema.safeParse('hello world');
    },
    10000
);
formatResult(simpleStringResult);

// Benchmark 2: Simple number validation
const simpleNumberSchema = number().min(0).max(100);
const simpleNumberResult = benchmark(
    '2. Simple Number Validation',
    () => {
        simpleNumberSchema.safeParse(42);
    },
    10000
);
formatResult(simpleNumberResult);

// Benchmark 3: Simple object validation
const simpleObjectSchema = object({
    name: string(),
    age: number(),
    active: boolean(),
});
const simpleObjectData = { name: 'John', age: 30, active: true };
const simpleObjectResult = benchmark(
    '3. Simple Object Validation',
    () => {
        simpleObjectSchema.safeParse(simpleObjectData);
    },
    10000
);
formatResult(simpleObjectResult);

// Benchmark 4: Nested object validation
const nestedObjectSchema = object({
    user: object({
        profile: object({
            name: string().min(1),
            email: string().email(),
            age: number().min(0).max(150),
        }),
        settings: object({
            notifications: boolean(),
            theme: string(),
        }),
    }),
    metadata: object({
        createdAt: string(),
        updatedAt: string(),
    }),
});

const nestedObjectData = {
    user: {
        profile: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 28,
        },
        settings: {
            notifications: true,
            theme: 'dark',
        },
    },
    metadata: {
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
    },
};

const nestedObjectResult = benchmark(
    '4. Nested Object Validation (3 levels)',
    () => {
        nestedObjectSchema.safeParse(nestedObjectData);
    },
    10000
);
formatResult(nestedObjectResult);

// Benchmark 5: Array validation
const arraySchema = array(
    object({
        id: number(),
        name: string(),
        active: boolean(),
    })
).min(1).max(100);

const arrayData = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    active: i % 2 === 0,
}));

const arrayResult = benchmark(
    '5. Array Validation (10 items)',
    () => {
        arraySchema.safeParse(arrayData);
    },
    10000
);
formatResult(arrayResult);

// Benchmark 6: Large array validation
const largeArrayData = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    active: i % 2 === 0,
}));

const largeArrayResult = benchmark(
    '6. Large Array Validation (100 items)',
    () => {
        arraySchema.safeParse(largeArrayData);
    },
    1000
);
formatResult(largeArrayResult);

// Benchmark 7: Complex schema with transformers
const complexSchema = object({
    email: string().email().transform((s) => s.toLowerCase().trim()),
    age: number().int().positive(),
    tags: array(string().transform((s) => s.trim().toLowerCase())).min(1),
});

const complexData = {
    email: '  USER@EXAMPLE.COM  ',
    age: 25,
    tags: ['  JavaScript  ', '  TypeScript  ', '  Node.js  '],
};

const complexResult = benchmark(
    '7. Complex Schema with Transformers',
    () => {
        complexSchema.safeParse(complexData);
    },
    10000
);
formatResult(complexResult);

// Benchmark 8: Async validation
const asyncSchema = string().refine(
    async (val) => {
        // Simulate async check (e.g., database lookup)
        await new Promise((resolve) => setTimeout(resolve, 0));
        return val.length > 0;
    },
    'Value must not be empty'
);

async function runAsyncBenchmark() {
    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        await asyncSchema.safeParse('test value');
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSecond = (iterations / totalTime) * 1000;

    const result: BenchmarkResult = {
        name: '8. Async Validation',
        iterations,
        totalTime,
        avgTime,
        opsPerSecond,
    };

    formatResult(result);
}

// Run async benchmark
await runAsyncBenchmark();

console.log('\n═'.repeat(60));

// Summary and requirements check
console.log('\n📊 Summary\n');

const syncResults = [
    simpleStringResult,
    simpleNumberResult,
    simpleObjectResult,
    nestedObjectResult,
    arrayResult,
    largeArrayResult,
    complexResult,
];

const avgSyncTime = syncResults.reduce((sum, r) => sum + r.avgTime, 0) / syncResults.length;
const simpleSchemaAvg = (simpleStringResult.avgTime + simpleNumberResult.avgTime + simpleObjectResult.avgTime) / 3;

console.log(`Average sync validation time:    ${avgSyncTime.toFixed(4)} ms`);
console.log(`Simple schema average:           ${simpleSchemaAvg.toFixed(4)} ms`);

// Check requirement: synchronous validation in under 1ms for simple schemas
if (simpleSchemaAvg < 1.0) {
    console.log(`\n✅ Requirement met: Simple schemas validate in under 1ms (${simpleSchemaAvg.toFixed(4)} ms)`);
} else {
    console.log(`\n⚠️  Warning: Simple schemas exceed 1ms target (${simpleSchemaAvg.toFixed(4)} ms)`);
}

console.log('\n');
