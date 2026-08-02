# alg-bn

Baretto-Naehrig (BN) curve arithmetic, defaulting to the alt_bn128 (BN254) curve
used by Ethereum precompiles. Built on top of [`@wa1one/alg-field`](https://www.npmjs.com/package/@wa1one/alg-field).

- **Current (scoped) package:** https://www.npmjs.com/package/@wa1one/alg-bn
- **Legacy package** (`alg-bn`, unscoped, no longer maintained under this account): https://www.npmjs.com/package/alg-bn

## Install

```
npm install @wa1one/alg-bn
```

## Usage

```js
const { BN128Fp, BN128Fp2 } = require('@wa1one/alg-bn')

const G = BN128Fp.create(1n, 2n)
G.double().eq(G.add(G)) // true
G.isOnCurve() // true
```

## API

### `BN128Fp`

A point on the base curve `y² = x³ + 3` over `Fp`, held in Jacobian
coordinates `(x, y, z)`.

- `new BN128Fp(x, y, z)` — `x`/`y`/`z` must be `Field` instances (from
  `@wa1one/alg-field`); otherwise the point is left uninitialized.
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

Exported but **not currently functional**. These build their coordinates via
`Field2`/`Field12` from `@wa1one/alg-field`, which that package's own README
documents as an unfinished port ("every method throws or returns a wrong
result as shipped"). `new Curve(bn)` throws immediately, and there's
presently no way to construct a valid `Field2`/`Field12` value to hand to
`Point`/`Point2`/`Point12`. They're kept only for backwards compatibility of
the export shape until `alg-field` ships working `Field2`/`Field12` classes;
use `BN128Fp`/`BN128Fp2` above instead.

- `Curve` — the base curve; wraps `Point` and computes `.contains(P)`.
- `Curve2` — the twisted curve (`extends Curve`); wraps `Point2` and holds
  the twist generator `Gt`.
- `Point` — a point on `Curve`, with `.add()`, `.double()`, `.multiply()`,
  `.neg()`, `.twice(n)`, `.toF12()`, `.eq()`, `.toString()`.
- `Point2` — a point on `Curve2` (`extends Point`); validates membership via
  `Curve2.contains()` on construction.
- `Point12` — a point over `Fp12` (`extends Point2`), the pairing target
  group.

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
