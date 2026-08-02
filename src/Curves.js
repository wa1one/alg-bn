const bigintCryptoUtils = require('bigint-crypto-utils')
const { Field2, Field12 } = require('@wa1one/alg-field')

const { Point, Point2 } = require('./Points')

class Curve {
    constructor(bn) {
        // 1 2 b=3
        this.bn = bn
        this.b = new Field2(bn.p, 3n)
        this.infinity = new Point(this)
        this.G = new Point(this, new Field2(bn.p, 1n), new Field2(bn.p, 2n))
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

        if (x instanceof Field12 && y instanceof Field12) {
            const b = new Field12(this.bn, [
                new Field2(this.bn.p, 3, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
                new Field2(this.bn.p, 0, 0, false),
            ])
            return y.square().eq(x.multiply(x).multiply(x).add(b))
        }

        return y.square().eq(x.multiply(x).multiply(x).add(this.b))
    }
}

class Curve2 extends Curve {
    constructor(E) {
        super(E.bn)
        if (E instanceof Curve) {
            this.E = E
            this.bn = E.bn
            this.Fp2_0 = E.bn.Fp2_0
            this.Fp2_1 = E.bn.Fp2_1
            this.Fp2_i = E.bn.Fp2_i
            this.infinity = new Point2(this)

            this.b = new Field2(E.bn.p, 3).mulV()

            if (E.bn.m == 256)
                this.b = new Field2(E.bn.p, 3n).divide(
                    new Field2(E.bn.p, 9n, 1n, false)
                )

            this.xt = new Field2(E.bn.p, 1n, 0n, false)
            this.yt = this.xt.cube().add(this.b).sqrt()

            if (E.bn.m == 256) {
                this.xt = new Field2(
                    E.bn.p,
                    10857046999023057135944570762232829481370756359578518086990519993285655852781n,
                    11559732032986387107991004021392285783925812861821192530917403151452391805634n,
                    false
                )
                this.yt = new Field2(
                    E.bn.p,
                    8495653923123431417604973247489272438418190587263600148770280649306958101930n,
                    4082367875863433681332203403145435568316851327593401208105741076214120093531n,
                    false
                )
            }

            this.Gt = new Point2(this, this.xt, this.yt)
        }
    }

    static pointFactory = () =>
        this.Gt.multiply(
            bigintCryptoUtils.randBetween(2n ** 2n * this.bn.p.bitLength())
        )
}

module.exports = { Curve, Curve2 }
