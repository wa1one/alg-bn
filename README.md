# alg-bn

Baretto-Naehrig (BN) curve arithmetic, defaulting to the alt_bn128 (BN254) curve
used by Ethereum precompiles. Built on top of [`alg-field`](https://www.npmjs.com/package/alg-field).

- **Package:** https://www.npmjs.com/package/alg-bn
- **Scoped mirror:** https://www.npmjs.com/package/@wa1one/alg-bn

## Install

```
npm install alg-bn
```

## Usage

```js
const { BN128Fp, BN128Fp2 } = require('alg-bn')

const G = BN128Fp.create(1n, 2n)
G.double().eq(G.add(G)) // true
G.isOnCurve() // true
```

## API

### `BN128Fp`

A point on the base curve `y² = x³ + 3` over `Fp`, held in Jacobian
coordinates `(x, y, z)`.

- `new BN128Fp(x, y, z)` — `x`/`y`/`z` must be `Field` instances (from
  `alg-field`); otherwise the point is left uninitialized.
- `static n` — the curve order (`bigint`).
- `static B` — the curve coefficient, `Field(3n)`.
- `static ZERO` — the point at infinity, `(0, 0, 0)`.
- `static create(x, y)` — builds a point from raw `bigint` affine coordinates
  with `z = 1`. Returns `BN128Fp.ZERO` for `(0, 0)`, `null` if the coordinates
  aren't on the curve, or the point otherwise.
- `.add(o)` — Jacobian point addition.
- `.double()` — Jacobian point doubling.
- `.multiply(s)` — scalar multiplication by a `bigint`.
- `.neg()` — the additive inverse (negates `y`).
- `.isZero()` — `true` if `z` is `0` (point at infinity).
- `.isOnCurve()` — checks `y² = x³ + b·z⁶`.
- `.isValid()` — `true` if the coordinates are `Field` instances and the
  point is on the curve.
- `.toAffine()` — normalizes `z` to `1` (or `(0, 1, 0)` for the point at
  infinity).
- `.toEthNotation()` — like `.toAffine()`, but encodes the point at infinity
  as `(0, 0, 0)` instead of `(0, 1, 0)`.
- `.eq(o)` — compares `x`, `y`, `z` directly (not affine-normalized); two
  Jacobian representations of the same affine point can compare unequal
  unless you call `.toAffine()` first.
- `.toString()` — `"x, y, z"`.

### `BN128Fp2`

A point on the sextic twist curve over `Fp2`, mirroring `BN128Fp` but with
`Fp2` coordinates. Same Jacobian-coordinate caveats apply to `.eq()`.

- `new BN128Fp2(x, y, z)` — `x`/`y`/`z` must be `Fp2` instances.
- `static n` — the curve order (`bigint`).
- `static ZERO` — the point at infinity, `(0, 0, 0)`.
- `static TWIST` — the twist parameter, `Fp2(9n, 1n)`.
- `static B_Fp2` — the twisted curve coefficient.
- `static create(a, b, c, d)` — builds a point from raw `bigint` affine
  coordinates `x = a + b·u`, `y = c + d·u`, with `z = 1`. Returns
  `BN128Fp2.ZERO` for all-zero input, `null` if not on the curve, or the
  point otherwise.
- `.add(o)` — Jacobian point addition.
- `.double()` — Jacobian point doubling.
- `.multiply(s)` — scalar multiplication; `s` is coerced to `bigint` if it
  isn't one already.
- `.isZero()` — `true` if `z` is `0`.
- `.isOnCurve()` — checks `y² = x³ + B_Fp2·z⁶`.
- `.isValid()` — `true` if the coordinates are `Fp2` instances and the point
  is on the curve.
- `.toAffine()` — normalizes `z` to `1` (or `(0, 1, 0)` for the point at
  infinity).
- `.toEthNotation()` — like `.toAffine()`, but encodes the point at infinity
  as `(0, 0, 0)`.
- `.mulByP()` — applies the Frobenius twist (used when pairing with the
  base-field group).
- `.eq(o)` — compares `x`, `y`, `z` directly; see the `BN128Fp` note above.
- `.toString()` — `"[x, y, z]"`, where each coordinate is itself `"a, b"`.

### `Curve`, `Curve2`, `Point`, `Point2`, `Point12`

A second, affine-coordinate point representation, built on `alg-field`'s
tunable `Fp2` tower rather than `Field`/`Fp2` directly. Unlike `BN128Fp`/
`BN128Fp2`, `.eq()` here compares canonical affine coordinates directly, so
points computed via different code paths (e.g. `.multiply()` vs. repeated
`.add()`) compare equal without any extra normalization step. This is the
family to use if you need a curve other than the BN254 default — nothing is
hardcoded inside `Curve`/`Curve2`; every curve-specific constant (generator,
`b` coefficient) comes from the params object you pass in.

```js
const { Curve, Curve2, Bls12381Parameters } = require('alg-bn')

const curve = new Curve() // defaults to BN254 (Bn254Parameters)
curve.contains(curve.G) // true
curve.G.multiply(3n).eq(curve.G.add(curve.G.double())) // true

// Any curve with a matching params shape works, e.g. the bundled BLS12-381:
const blsCurve = new Curve(Bls12381Parameters)
const blsCurve2 = new Curve2(blsCurve)
blsCurve2.contains(blsCurve2.Gt) // true
```

- `Bn254Parameters`, `Bls12381Parameters` — ready-made params objects for
  `Curve`/`Curve2`, each bundling `{ p, n, fp2Params, xiRe, twistType, b, Gx,
Gy, G2b, G2x, G2y }`: the field modulus and subgroup order, the derived
  `Fp2` tower params every `Fp2` value on that curve must share, the real
  part of the curve's Fp6 sextic non-residue and its twist type (`'D'` for
  BN254, `'M'` for BLS12-381 — see the `Point12` note below), and the base
  (G1) and twisted (G2) curve coefficients/generators. Named distinctly from
  `alg-field`'s own `Parameters`/`Bls12381Parameters` (which are field-only,
  `{ p, n }`) to avoid a collision when both packages are required together.
  To use a curve that isn't bundled, build an object with this same shape —
  `fp2Params` comes from `alg-field`'s `deriveFp2Params(p)`.
- `Curve` — the base curve `y² = x³ + b` over `Fp`. `new Curve(bn =
Bn254Parameters)` exposes `.G` (the generator, a `Point`), `.infinity` (the
  identity `Point`), and `.contains(P)`.
- `Curve2` — the sextic twist curve (`extends Curve`). `new Curve2(E = new
Curve())` takes a base `Curve` instance and reads its twist coefficient and
  generator directly from `E.bn.G2b`/`G2x`/`G2y` — no curve-specific branching
  or derivation happens here. Exposes `.Gt` (the twist generator, a `Point2`)
  and `.Fp12_1` (the `Field12` multiplicative identity, used to build the
  `Point12` identity).
- `Point` — a point on `Curve`, in affine `(x, y)` `Fp2` coordinates (base-
  curve points use `im = 0`). `.add()`, `.double()`, `.multiply(n)` (accepts
  a `bigint` or coercible value), `.neg()`, `.twice(n)`, `.eq()`,
  `.toString()`.
- `Point2` — a point on `Curve2` (`extends Point`); the 3-argument
  constructor validates curve membership via `Curve2.contains()` and throws
  `pointNotOnCurve` otherwise.
- `Point12`, `.toF12()` (on `Point`/`Point2`) — embeds a G1 or G2 point into
  the `Fp12` pairing target group, in `Field12` coordinates. Works for any
  curve whose params object supplies `xiRe`/`twistType` (both bundled
  parameters do) — `alg-field`'s `Field12` (`>= 0.3.0`) derives its degree-12
  modulus polynomial from `bn.p` automatically, and `Point2.toF12()`'s
  untwist map branches on `twistType` to match whichever convention that
  curve's `G2b` was built with (`G2b = b / xi` for a D-twist, `G2b = b * xi`
  for an M-twist — these aren't a free choice, they're a real per-curve-family
  convention, so a curve you add yourself needs to get this right for its own
  `G2b`). `alg-bn` still has no complete Miller-loop pairing implementation
  for any curve — `toF12()`/`Point12` are the embedding building block, not a
  full pairing.

## Development

### To run tests

```
npm test
```

### To lint

```
npm run lint
```

### To build

```
npm run build
```
