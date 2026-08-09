// Regression test for a real packaging bug: the Node build used to bundle
// its own private copy of alg-field (webpack.config.js's first entry had
// `externals: {}`), so a value built by dist/index.js's internal Curve/
// Point/JacobianPoint and a value built by a *consumer's own*
// `require('alg-field')` were instances of two different (structurally
// identical, but distinct) Fp2 classes. alg-field's own arithmetic
// (add/multiply/etc) uses `instanceof` to recognize same-level operands, so
// every operation mixing the two threw "Incorrect type argument" -- this
// surfaced downstream (github.com/wa1one/zk-snark) as exactly that error
// deep inside a Jacobian point doubling.
//
// This can only be caught by testing the *built* dist/index.js against a
// separately-required alg-field, which is why it lives here rather than in
// all.test.js (which requires ./src/... directly, and so never crosses the
// bundle boundary this bug was in). Run via `npm run test:dist` (after a
// build) or `npm run prepublishOnly`.
const path = require('path')
const fs = require('fs')

const distPath = path.join(__dirname, 'dist', 'index.js')

if (!fs.existsSync(distPath)) {
    test.skip('dist/index.js has not been built yet (run npm run build first)', () => {})
} else {
    const { Fp2 } = require('alg-field')
    const { Curve, Curve2, JacobianPoint } = require(distPath)

    describe('dist/index.js does not bundle a private alg-field copy', () => {
        test("a consumer's own alg-field Fp2 is recognized by the built package's classes", () => {
            const curve = new Curve()
            expect(curve.G.x).toBeInstanceOf(Fp2)

            const JG = JacobianPoint.fromAffine(curve, curve.G)
            // This specific call is what originally crashed: alg-field's
            // Fp2.multiply() rejects an operand that isn't `instanceof` its
            // own Fp2 class.
            expect(() => JG.double()).not.toThrow()
            expect(JG.double().toAffine().eq(curve.G.double())).toBe(true)
        })
    })

    // Second packaging bug, same "only visible after the build" shape:
    // preset-env had no targets, so it compiled down to ES5 and rewrote
    // `**` into Math.pow(). Math.pow rejects BigInt, so every pointFactory()
    // call on the *published* package threw "Cannot convert a BigInt value
    // to a number" -- while all.test.js passed, because it exercises src/
    // and never sees the transpiled output.
    describe('dist/index.js keeps BigInt exponentiation intact', () => {
        test('the bundle contains no Math.pow (which cannot take BigInt)', () => {
            expect(fs.readFileSync(distPath, 'utf8')).not.toContain('Math.pow')
        })

        test('pointFactory() works on the built bundle for both curves', () => {
            for (const CurveClass of [Curve, Curve2]) {
                const curve = new CurveClass()
                let point
                expect(() => {
                    point = curve.pointFactory()
                }).not.toThrow()
                expect(curve.contains(point)).toBe(true)
            }
        })
    })
}
