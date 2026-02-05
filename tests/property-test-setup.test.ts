import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('Property-Based Testing Setup', () => {
    it('should have fast-check available', () => {
        fc.assert(
            fc.property(fc.integer(), (n) => {
                return n + 0 === n;
            }),
            { numRuns: 100 }
        );
    });
});
