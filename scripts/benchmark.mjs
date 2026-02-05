import { string, number, object, array, boolean } from '../dist/index.js';

function benchmark(name, fn, iterations = 10000) {
  for (let i = 0; i < 100; i++) fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();
  const totalTime = end - start;
  return { name, iterations, totalTime, avgTime: totalTime / iterations, opsPerSecond: (iterations / totalTime) * 1000 };
}

function formatResult(r) {
  console.log(`\n${r.name}`);
  console.log(`  Iterations:     ${r.iterations.toLocaleString()}`);
  console.log(`  Total time:     ${r.totalTime.toFixed(2)} ms`);
  console.log(`  Average time:   ${r.avgTime.toFixed(4)} ms`);
  console.log(`  Ops/second:     ${Math.round(r.opsPerSecond).toLocaleString()}`);
}

console.log('\n🚀 Performance Benchmarks\n' + '═'.repeat(60));

const r1 = benchmark('1. Simple String', () => string().min(3).max(50).safeParse('hello'), 10000);
formatResult(r1);

const r2 = benchmark('2. Simple Number', () => number().min(0).max(100).safeParse(42), 10000);
formatResult(r2);

const r3 = benchmark('3. Simple Object', () => object({ name: string(), age: number(), active: boolean() }).safeParse({ name: 'John', age: 30, active: true }), 10000);
formatResult(r3);

const nestedSchema = object({
  user: object({
    profile: object({ name: string().min(1), email: string().email(), age: number().min(0).max(150) }),
    settings: object({ notifications: boolean(), theme: string() })
  }),
  metadata: object({ createdAt: string(), updatedAt: string() })
});
const nestedData = { user: { profile: { name: 'Jane', email: 'jane@example.com', age: 28 }, settings: { notifications: true, theme: 'dark' } }, metadata: { createdAt: '2024-01-01', updatedAt: '2024-01-15' } };
const r4 = benchmark('4. Nested Object (3 levels)', () => nestedSchema.safeParse(nestedData), 10000);
formatResult(r4);

const arrSchema = array(object({ id: number(), name: string(), active: boolean() })).min(1).max(100);
const arrData = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}`, active: i % 2 === 0 }));
const r5 = benchmark('5. Array (10 items)', () => arrSchema.safeParse(arrData), 10000);
formatResult(r5);

const largeData = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}`, active: i % 2 === 0 }));
const r6 = benchmark('6. Large Array (100 items)', () => arrSchema.safeParse(largeData), 1000);
formatResult(r6);

const complexSchema = object({
  email: string().email().transform(s => s.toLowerCase().trim()),
  age: number().int().positive(),
  tags: array(string().transform(s => s.trim().toLowerCase())).min(1)
});
const complexData = { email: '  USER@EXAMPLE.COM  ', age: 25, tags: ['  JS  ', '  TS  '] };
const r7 = benchmark('7. Complex with Transformers', () => complexSchema.safeParse(complexData), 10000);
formatResult(r7);

const asyncSchema = string().refine(async (v) => { await new Promise(r => setTimeout(r, 0)); return v.length > 0; }, 'Not empty');
const iterations = 1000;
const start = performance.now();
for (let i = 0; i < iterations; i++) await asyncSchema.safeParse('test');
const end = performance.now();
const totalTime = end - start;
formatResult({ name: '8. Async Validation', iterations, totalTime, avgTime: totalTime / iterations, opsPerSecond: (iterations / totalTime) * 1000 });

console.log('\n' + '═'.repeat(60) + '\n\n📊 Summary\n');
const results = [r1, r2, r3, r4, r5, r6, r7];
const avgSync = results.reduce((s, r) => s + r.avgTime, 0) / results.length;
const simpleAvg = (r1.avgTime + r2.avgTime + r3.avgTime) / 3;
console.log(`Average sync validation time:    ${avgSync.toFixed(4)} ms`);
console.log(`Simple schema average:           ${simpleAvg.toFixed(4)} ms`);
if (simpleAvg < 1.0) {
  console.log(`\n✅ Requirement met: Simple schemas validate in under 1ms (${simpleAvg.toFixed(4)} ms)\n`);
} else {
  console.log(`\n⚠️  Warning: Simple schemas exceed 1ms target (${simpleAvg.toFixed(4)} ms)\n`);
}
