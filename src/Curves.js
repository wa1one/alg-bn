const { Field2, Field12 } = require('alg-field')
const { Bn254Parameters } = require('./curveParameters')

const { Point, Point2 } = require('./Points')

// Cryptographically secure random bigint in [min, max] (inclusive), via rejection sampling on
// a bit-length-matched buffer - the same approach, and the same [min, max] contract, as the
// bigint-crypto-utils dependency this replaces (its randBetween(max, min = 1n) used
// self.crypto.getRandomValues() internally too). Relies on the Web Crypto API
// (globalThis.crypto.getRandomValues), available in all modern browsers and Node 19+ - no
// Node-only `crypto` module dependency, so it works unchanged in both the node and web builds
// (see webpack.config.js).
function randomBigInt(max, min = 1n) {
    if (max <= min) {
        throw new RangeError('Arguments MUST be: max > min')
    }

    const interval = max - min
    const bitLen = interval.bitLength()
    const byteLen = Math.ceil(bitLen / 8)
    const excessBits = byteLen * 8 - bitLen

    let rnd
    do {
        const bytes = new Uint8Array(byteLen)
        globalThis.crypto.getRandomValues(bytes)

        if (excessBits > 0) {
            bytes[0] &= 0xff >> excessBits
        }

        rnd = 0n
        for (const byte of bytes) {
            rnd = (rnd << 8n) | BigInt(byte)
        }
    } while (rnd > interval)

    return rnd + min
}

class Curve {
    constructor(bn = Bn254Parameters) {
        this.bn = bn
        this.b = bn.b
        this.infinity = new Point(this)
        this.G = new Point(this, bn.Gx, bn.Gy)
    }

    pointFactory = () =>
        this.G.multiply(
            randomBigInt(2n ** (2n * BigInt(this.bn.p.bitLength())))
        )

    contains(P) {
        if (P.E !== this) {
            return false
        }

        const x = P.x
        const y = P.y

        // Point12 stays BN254-specific (see Points.js); this membership check for it is
        // unaffected by the curve-parameterization below.
        if (x instanceof Field12 && y instanceof Field12) {
            const b = new Field12(this.bn, [
                new Field2(this.bn.p, 3, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
            ])
            return y.multiply(y).eq(x.multiply(x).multiply(x).add(b))
        }

        return y.square().eq(x.multiply(x).multiply(x).add(this.b))
    }
}

class Curve2 extends Curve {
    constructor(E = new Curve()) {
        super(E.bn)
        if (E instanceof Curve) {
            this.E = E
            this.bn = E.bn
            this.Fp12_1 = new Field12(E.bn, 1n)
            this.infinity = new Point2(this)

            this.b = E.bn.G2b
            this.xt = E.bn.G2x
            this.yt = E.bn.G2y

            this.Gt = new Point2(this, this.xt, this.yt)
        }
    }

    pointFactory = () =>
        this.Gt.multiply(
            randomBigInt(2n ** (2n * BigInt(this.bn.p.bitLength())))
        )
}

module.exports = { Curve, Curve2 }
