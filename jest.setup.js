// Jest 26 predates Node's global `crypto` (added in Node 19) and doesn't copy it into its
// sandboxed test global scope even when running under a newer Node - only the test environment
// is missing it, real Node 19+/browsers have it natively. Shimming it here keeps the test suite
// exercising the exact same globalThis.crypto.getRandomValues() path src/Curves.js uses.
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = require('crypto').webcrypto
}
