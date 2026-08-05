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

A second, affine-coordinate point representation built on `Field2`/`Field12`
from `alg-field` rather than `Field`/`Fp2`. Unlike `BN128Fp`/
`BN128Fp2`, `.eq()` here compares canonical affine coordinates directly, so
points computed via different code paths (e.g. `.multiply()` vs. repeated
`.add()`) compare equal without any extra normalization step.

```js
const { Curve } = require('alg-bn')
const { Parameters } = require('alg-field')

const curve = new Curve({ p: Parameters.p })
const G = curve.G
curve.contains(G) // true
G.multiply(3n).eq(G.add(G.double())) // true
```

- `Curve` — the base curve `y² = x³ + 3` over `Fp`. `new Curve(bn)` takes a
  `bn` object with at least `{ p }` (the field modulus); it exposes `.G` (the
  generator, a `Point`), `.infinity` (the identity `Point`), and
  `.contains(P)`.
- `Curve2` — the sextic twist curve (`extends Curve`). `new Curve2(E)` takes
  a base `Curve` instance; `E.bn` additionally needs `Fp2_0`, `Fp2_1`, `Fp2_i`
  (`Field2` instances), and `m` (set `m: 256` to use the hardcoded BN254
  twist generator — the only path this package exercises, since the generic
  fallback calls `Field2.sqrt()`, which has an unrelated bug in
  `alg-field`'s current release). Exposes `.Gt` (the twist
  generator, a `Point2`) and `.Fp12_1` (the `Field12` multiplicative
  identity, used to build the `Point12` identity).
- `Point` — a point on `Curve`, in affine `(x, y)` `Field2` coordinates.
  `.add()`, `.double()`, `.multiply(n)` (accepts a `bigint` or coercible
  value), `.neg()`, `.twice(n)`, `.toF12()` (embeds into the `Point12`
  pairing target group), `.eq()`, `.toString()`.
- `Point2` — a point on `Curve2` (`extends Point`); the 3-argument
  constructor validates curve membership via `Curve2.contains()` and throws
  `pointNotOnCurve` otherwise.
- `Point12` — a point over `Fp12` (`extends Point2`), in `Field12`
  coordinates.

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
