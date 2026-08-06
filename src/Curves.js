const bigintCryptoUtils = require('bigint-crypto-utils')
const { Field2, Field12 } = require('alg-field')
const { Bn254Parameters } = require('./curveParameters')

const { Point, Point2 } = require('./Points')

class Curve {
    constructor(bn = Bn254Parameters) {
        this.bn = bn
        this.b = bn.b
        this.infinity = new Point(this)
        this.G = new Point(this, bn.Gx, bn.Gy)
    }

    static pointFactory = () =>
        this.G.multiply(
            bigintCryptoUtils.randBetween(2n ** 2n * this.bn.p.bitLength())
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

    static pointFactory = () =>
        this.Gt.multiply(
            bigintCryptoUtils.randBetween(2n ** 2n * this.bn.p.bitLength())
        )
}

module.exports = { Curve, Curve2 }
