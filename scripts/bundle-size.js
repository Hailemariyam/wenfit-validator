#!/usr/bin/env node

import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { resolve } from 'path';

const files = [
    { name: 'Core (ESM)', path: 'dist/index.js' },
    { name: 'Core (CJS)', path: 'dist/index.cjs' },
    { name: 'React Adapter', path: 'dist/adapters/react.js' },
    { name: 'Vue Adapter', path: 'dist/adapters/vue.js' },
    { name: 'Angular Adapter', path: 'dist/adapters/angular.js' },
    { name: 'Express Adapter', path: 'dist/adapters/express.js' },
];

console.log('\n📦 Bundle Size Report\n');
console.log('─'.repeat(60));

let allUnder10KB = true;

files.forEach(({ name, path }) => {
    try {
        const content = readFileSync(resolve(path));
        const gzipped = gzipSync(content);
        const sizeKB = (gzipped.length / 1024).toFixed(2);
        const status = name.includes('Core') && gzipped.length > 10240 ? '❌' : '✅';

        if (name.includes('Core') && gzipped.length > 10240) {
            allUnder10KB = false;
        }

        console.log(`${status} ${name.padEnd(20)} ${sizeKB.padStart(8)} KB (gzipped)`);
    } catch (err) {
        console.log(`⚠️  ${name.padEnd(20)} File not found`);
    }
});

console.log('─'.repeat(60));

if (allUnder10KB) {
    console.log('\n✅ All core bundles are under 10KB gzipped!\n');
    process.exit(0);
} else {
    console.log('\n❌ Core bundle exceeds 10KB gzipped limit!\n');
    process.exit(1);
}
