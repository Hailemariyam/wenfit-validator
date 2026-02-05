import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        'adapters/react': 'src/adapters/react.ts',
        'adapters/vue': 'src/adapters/vue.ts',
        'adapters/angular': 'src/adapters/angular.ts',
        'adapters/express': 'src/adapters/express.ts',
        'adapters/nestjs': 'src/adapters/nestjs.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
    },
    minify: false,
    target: 'es2020',
    external: ['react', 'vue', '@angular/core', '@angular/forms', '@nestjs/common', '@nestjs/core', 'express', 'rxjs', 'zone.js', 'reflect-metadata'],
    platform: 'neutral',
    bundle: true,
    skipNodeModulesBundle: true,
});
