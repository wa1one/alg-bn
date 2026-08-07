const { Fp2, Field2, Field12 } = require('alg-field')

class Point {
    constructor(E, x, y) {
        this.preComp = null
        if (x === undefined && y === undefined) {
            const { Curve } = require('./Curves')
            if (E instanceof Curve) {
                this.E = E
                this.x = new Fp2(0n, 0n, E.bn.fp2Params)
                this.y = new Fp2(0n, 0n, E.bn.fp2Params)
                this.inf = true
            }

            if (E instanceof Point) {
                const Q = E
                this.E = Q.E
                this.x = Q.x
                this.y = Q.y
                this.inf = Q.inf
            }
        } else {
            if (x instanceof Fp2 && y instanceof Fp2) {
                this.E = E
                this.x = x
                this.y = y
                this.inf = false
            }
        }
    }

    zero = () => this.inf

    eq(Q) {
        if (!(Q instanceof Point && this.same(Q))) return false
        return this.x.eq(Q.x) && this.y.eq(Q.y)
    }

    same = (Q) => this.E.bn === Q.E.bn

    neg = () =>
        this.y.isZero()
            ? new Point(this.E, this.x, this.y)
            : new Point(this.E, this.x, this.y.negate())

    add(Q) {
        if (this.zero()) return Q
        if (Q.zero()) return this

        const X1 = this.x,
            Y1 = this.y
        const X2 = Q.x,
            Y2 = Q.y

        if (X1.eq(X2) && Y1.eq(Y2)) {
            return this.double(Q)
        }
        if (X1.eq(X2)) {
            return this.E.infinity
        }

        const m = Y2.subtract(Y1).divide(X2.subtract(X1))

        const nx = m.exp(2n).subtract(X1).subtract(X2)
        const ny = m.negate().multiply(nx).add(m.multiply(X1)).subtract(Y1)
        return new Point(this.E, nx, ny)
    }

    subtract = (Q) => this.add(Q.neg())

    double() {
        if (this.zero()) return this

        const X = this.x
        const Y = this.y

        const _2 = new Fp2(2n, 0n, this.E.bn.fp2Params)
        const _3 = new Fp2(3n, 0n, this.E.bn.fp2Params)

        const m = _3.multiply(X).multiply(X).divide(_2.multiply(Y))

        const newx = m.exp(2).subtract(_2.multiply(X))
        const newy = m.negate().multiply(newx).add(m.multiply(X)).subtract(Y)

        return new Point(this.E, newx, newy)
    }

    twice(n) {
        if (this.zero()) return this
        let P = new Point(this.E, this.x, this.y)

        for (let i = 0; i < n; i++) {
            P = P.double()
        }

        return P
    }

    multiply(n) {
        if (typeof n !== 'bigint') {
            n = BigInt(n)
        }

        if (n === 0n) {
            return this.E.infinity
        }
        if (this.zero()) {
            return this
        }

        let res = this.E.infinity

        for (let i = n.bitLength() - 1; i >= 0; i--) {
            res = res.double()

            if (n.testBit(i)) {
                res = res.add(this)
            }
        }

        return res
    }

    toF12() {
        if (this.eq(this.E.infinity)) {
            return this.E.infinity
        }

        const nx = new Field12(this.E.bn, [
            new Field2(this.E.bn.p, this.x.a.v, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
        ])

        const ny = new Field12(this.E.bn, [
            new Field2(this.E.bn.p, this.y.a.v, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
        ])

        return new Point12(this.E, nx, ny)
    }

    toString = () => '(' + this.x.toString() + ',' + this.y.toString() + ')'
}

class Point2 extends Point {
    constructor(E, x, y) {
        super(E, x, y)

        if (x === undefined && y === undefined) {
            if (E instanceof Point2) {
                const Q = E
                this.E = Q.E
                this.x = Q.x
                this.y = Q.y
                this.inf = Q.inf
            }
        } else {
            if (x instanceof Fp2 && y instanceof Fp2) {
                this.E = E
                this.x = x
                this.y = y
                this.inf = false

                if (!E.contains(this)) {
                    throw new Error('pointNotOnCurve')
                }
            }
        }
    }

    add(Q) {
        if (this.zero()) return Q
        if (Q.zero()) return this

        const X1 = this.x,
            Y1 = this.y
        const X2 = Q.x,
            Y2 = Q.y

        if (X1.eq(X2) && Y1.eq(Y2)) {
            return this.double(Q)
        }
        if (X1.eq(X2)) {
            return this.E.infinity
        }

        const m = Y2.subtract(Y1).divide(X2.subtract(X1))

        const nx = m.exp(2).subtract(X1).subtract(X2)
        const ny = m.negate().multiply(nx).add(m.multiply(X1)).subtract(Y1)
        return new Point2(this.E, nx, ny)
    }

    twice(n) {
        if (this.zero()) return this
        let P = new Point2(this.E, this.x, this.y)

        for (let i = 0; i < n; i++) {
            P = P.double()
        }

        return P
    }

    double() {
        if (this.zero()) return this

        const X = this.x
        const Y = this.y

        const _2 = new Fp2(2n, 0n, this.E.bn.fp2Params)
        const _3 = new Fp2(3n, 0n, this.E.bn.fp2Params)

        const m = _3.multiply(X).multiply(X).divide(_2.multiply(Y))

        const newx = m.exp(2).subtract(_2.multiply(X))
        const newy = m.negate().multiply(newx).add(m.multiply(X)).subtract(Y)

        return new Point2(this.E, newx, newy)
    }

    toF12() {
        if (this.E.bn.xiRe === undefined || this.E.bn.twistType === undefined) {
            throw new Error(
                "toF12() needs bn.xiRe (the real part of the curve's Fp6 sextic non-residue, xiRe + u) and bn.twistType ('D' or 'M') to untwist a G2 point into Fp12"
            )
        }

        if (this.eq(this.E.infinity)) {
            return this.E.infinity
        }

        const _x = this.x
        const _y = this.y
        const xiRe = new Field2(this.E.bn.p, this.E.bn.xiRe)

        const xre = new Field2(this.E.bn.p, _x.a.v)
        const yre = new Field2(this.E.bn.p, _y.a.v)
        const xim = new Field2(this.E.bn.p, _x.b.v)
        const yim = new Field2(this.E.bn.p, _y.b.v)

        const xcoeffs = xre.subtract(xim.multiply(xiRe))
        const ycoeffs = yre.subtract(yim.multiply(xiRe))

        const w = new Field12(this.E.bn, [
            new Field2(this.E.bn.p, 0, BigInt(1), false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
        ])

        let nx = new Field12(this.E.bn, [
            new Field2(this.E.bn.p, xcoeffs.re, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, _x.b.v, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
        ])

        let ny = new Field12(this.E.bn, [
            new Field2(this.E.bn.p, ycoeffs.re, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, _y.b.v, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
            new Field2(this.E.bn.p, 0, 0, false),
        ])

        // D-twist (G2b = b / xi, e.g. BN254): untwist by multiplying by w^2/w^3.
        // M-twist (G2b = b * xi, e.g. BLS12-381): untwist by dividing by w^2/w^3 instead.
        if (this.E.bn.twistType === 'D') {
            nx = nx.multiply(w).multiply(w)
            ny = ny.multiply(w).multiply(w).multiply(w)
        } else if (this.E.bn.twistType === 'M') {
            nx = nx.divide(w).divide(w)
            ny = ny.divide(w).divide(w).divide(w)
        } else {
            throw new Error(
                `toF12() does not know how to untwist bn.twistType ${JSON.stringify(this.E.bn.twistType)} - expected 'D' or 'M'`
            )
        }

        return new Point12(this.E, nx, ny)
    }

    toString() {
        return '(' + this.x.toString() + ',' + this.y.toString() + ')'
    }
}

class Point12 extends Point2 {
    constructor(E, x, y) {
        super(E, x, y)

        if (x === undefined && y === undefined) {
            const { Curve2 } = require('./Curves')
            if (E instanceof Curve2) {
                this.E = E
                this.x = E.Fp12_1
                this.y = E.Fp12_1
                this.inf = true
            }

            if (E instanceof Point2) {
                const Q = E
                this.E = Q.E
                this.x = Q.x
                this.y = Q.y
                this.inf = Q.inf
            }
        } else {
            if (x instanceof Field12 && y instanceof Field12) {
                this.E = E
                this.x = x
                this.y = y
                this.inf = false
            }
        }
    }

    add(Q) {
        if (this.zero()) return Q
        if (Q.zero()) return this

        const X1 = this.x,
            Y1 = this.y
        const X2 = Q.x,
            Y2 = Q.y

        if (X1.eq(X2) && Y1.eq(Y2)) {
            return this.double(Q)
        }
        if (X1.eq(X2)) {
            return this.E.infinity
        }

        const m = Y2.subtract(Y1).divide(X2.subtract(X1))

        const nx = m.multiply(m).subtract(X1).subtract(X2)
        const ny = m.neg().multiply(nx).add(m.multiply(X1)).subtract(Y1)
        return new Point12(this.E, nx, ny)
    }

    twice(n) {
        if (this.zero()) return this
        let P = new Point12(this.E, this.x, this.y)

        for (let i = 0; i < n; i++) {
            P = P.double()
        }

        return P
    }

    double() {
        if (this.zero()) return this

        const X = this.x
        const Y = this.y

        const _3 = new Field12(this.E.bn, 3)
        const _2 = new Field12(this.E.bn, 2)

        const m = _3.multiply(X).multiply(X).divide(_2.multiply(Y))

        const newx = m.multiply(m).subtract(_2.multiply(X))
        const newy = m.neg().multiply(newx).add(m.multiply(X)).subtract(Y)

        return new Point12(this.E, newx, newy)
    }

    toString = () => '(' + this.x.toString() + ', ' + this.y.toString() + ')'
}

module.exports = { Point, Point2, Point12 }
