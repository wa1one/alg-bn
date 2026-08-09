const { Fp2 } = require('alg-field')
const { Point, Point2 } = require('./Points')

// Jacobian-coordinate G1/G2 points: an additive, backward-compatible
// alternative to Point/Point2 (src/Points.js), which are affine and pay a
// full field inversion (.divide()) on every single add()/double(). Jacobian
// coordinates need no inversion at all until you actually want the affine
// x/y back (toAffine()), which is normally only once, at the very end of a
// scalar multiplication -- so multiply() below does its ~2*bitLength(n)
// doublings/additions inversion-free, then normalizes once.
//
// The add()/twice() formulas are a direct port of zk-snark's own Point2
// (github.com/wa1one/zk-snark, src/pairing/Points.js), translated from
// alg-field's direct-representation Field2 API to the Fp2 tower API used
// throughout this package's own Point/Point2 (mainly: no .twice(k) or
// instance .one() on Fp2, so those become .multiply(2n)/.multiply(8n) and
// .eq(Fp2.one(params)) respectively). That formula is exercised by
// zk-snark's full trusted-setup/proving pipeline, not just unit tests, so
// this port is checked here against Point/Point2's independent (if slower)
// affine implementation across randomized scalars, plus the standard group
// axioms, rather than trusted on translation alone.

function fp2One(params) {
    return Fp2.one(params)
}

function fp2Zero(params) {
    return Fp2.zero(params)
}

class JacobianPoint {
    constructor(E, x, y, z) {
        this.E = E
        const params = E.bn.fp2Params
        if (x === undefined) {
            this.x = fp2One(params)
            this.y = fp2One(params)
            this.z = fp2Zero(params)
        } else {
            this.x = x
            this.y = y
            this.z = z === undefined ? fp2One(params) : z
        }
    }

    static fromAffine(E, P) {
        if (P.zero()) return new JacobianPoint(E)
        return new JacobianPoint(E, P.x, P.y)
    }

    zero = () => this.z.isZero()

    same = (Q) => this.E.bn === Q.E.bn

    toAffine() {
        if (this.zero()) return new Point(this.E)
        if (this.z.eq(fp2One(this.E.bn.fp2Params))) {
            return new Point(this.E, this.x, this.y)
        }
        const zInv = this.z.inverse()
        const zInv2 = zInv.multiply(zInv)
        const zInv3 = zInv2.multiply(zInv)
        return new Point(
            this.E,
            this.x.multiply(zInv2),
            this.y.multiply(zInv3)
        )
    }

    eq(Q) {
        if (!(Q instanceof JacobianPoint) || !this.same(Q)) return false
        if (this.zero() || Q.zero()) return this.zero() === Q.zero()
        const z2 = this.z.multiply(this.z)
        const z3 = this.z.multiply(z2)
        const qz2 = Q.z.multiply(Q.z)
        const qz3 = Q.z.multiply(qz2)
        return (
            this.x.multiply(qz2).eq(Q.x.multiply(z2)) &&
            this.y.multiply(qz3).eq(Q.y.multiply(z3))
        )
    }

    neg = () => new JacobianPoint(this.E, this.x, this.y.negate(), this.z)

    double() {
        return this.twice(1)
    }

    twice(n) {
        if (this.zero()) return this

        let X = this.x,
            Y = this.y,
            Z = this.z
        while (n-- > 0) {
            const A = X.multiply(X)
            const B = Y.multiply(Y)
            const C = B.multiply(B)
            const S = X.add(B)
                .multiply(X.add(B))
                .subtract(A)
                .subtract(C)
                .multiply(2n)
            const M = A.multiply(3n)
            const newX = M.multiply(M).subtract(S.multiply(2n))
            const newZ = Y.multiply(Z).multiply(2n)
            const newY = M.multiply(S.subtract(newX)).subtract(C.multiply(8n))
            X = newX
            Y = newY
            Z = newZ
        }
        return new JacobianPoint(this.E, X, Y, Z)
    }

    add(Q) {
        if (this.zero()) return Q
        if (Q.zero()) return this

        const params = this.E.bn.fp2Params
        const one = fp2One(params)
        const X1 = this.x,
            Y1 = this.y,
            Z1 = this.z
        const X2 = Q.x,
            Y2 = Q.y,
            Z2 = Q.z
        const Z1is1 = Z1.eq(one)
        const Z2is1 = Z2.eq(one)

        let Z1Z1 = one,
            Z2Z2 = one
        let U1 = X1,
            U2 = X2
        let S1 = Y1,
            S2 = Y2
        if (!Z1is1) {
            Z1Z1 = Z1.multiply(Z1)
            U2 = X2.multiply(Z1Z1)
            S2 = Y2.multiply(Z1).multiply(Z1Z1)
        }
        if (!Z2is1) {
            Z2Z2 = Z2.multiply(Z2)
            U1 = X1.multiply(Z2Z2)
            S1 = Y1.multiply(Z2).multiply(Z2Z2)
        }

        if (U1.eq(U2)) {
            if (S1.eq(S2)) return this.double()
            return new JacobianPoint(this.E)
        }

        const H = U2.subtract(U1)
        const I = H.multiply(2n).multiply(H.multiply(2n))
        const J = H.multiply(I)
        const R = S2.subtract(S1).multiply(2n)
        const V = U1.multiply(I)
        const X3 = R.multiply(R).subtract(J).subtract(V.multiply(2n))
        const Y3 = R.multiply(V.subtract(X3)).subtract(
            S1.multiply(J).multiply(2n)
        )

        let Z3
        if (Z2is1) {
            Z3 = Z1is1 ? H.multiply(2n) : Z1.multiply(H).multiply(2n)
        } else if (Z1is1) {
            Z3 = Z2.multiply(H).multiply(2n)
        } else {
            Z3 = Z1.add(Z2)
                .multiply(Z1.add(Z2))
                .subtract(Z1Z1)
                .subtract(Z2Z2)
                .multiply(H)
        }
        return new JacobianPoint(this.E, X3, Y3, Z3)
    }

    subtract = (Q) => this.add(Q.neg())

    multiply(n) {
        if (typeof n !== 'bigint') n = BigInt(n)
        if (n < 0n) return this.neg().multiply(-n)
        if (n === 0n || this.zero()) return new JacobianPoint(this.E)

        let result = new JacobianPoint(this.E)
        let base = this
        while (n > 0n) {
            if (n & 1n) result = result.add(base)
            n >>= 1n
            if (n > 0n) base = base.double()
        }
        return result
    }

    toString = () => this.toAffine().toString()

    toF12 = () => this.toAffine().toF12()
}

class JacobianPoint2 extends JacobianPoint {
    constructor(E, x, y, z) {
        super(E, x, y, z)
        // Only the fresh, Z-defaults-to-1 (E, x, y) form needs validating --
        // it's then equivalent to an affine point, so Curve2.contains() (the
        // same check Point2 itself uses) applies directly. Intermediate
        // Jacobian coordinates from add()/twice() (the (E, x, y, z) form)
        // don't satisfy the affine curve equation directly and don't need
        // re-validating: the algebra guarantees they're on the curve if the
        // inputs were.
        if (x instanceof Fp2 && y instanceof Fp2 && z === undefined) {
            if (!E.contains(this)) {
                throw new Error('pointNotOnCurve')
            }
        }
    }

    static fromAffine(E, P) {
        if (P.zero()) return new JacobianPoint2(E)
        return new JacobianPoint2(E, P.x, P.y)
    }

    toAffine() {
        if (this.zero()) return new Point2(this.E)
        if (this.z.eq(fp2One(this.E.bn.fp2Params))) {
            return new Point2(this.E, this.x, this.y)
        }
        const zInv = this.z.inverse()
        const zInv2 = zInv.multiply(zInv)
        const zInv3 = zInv2.multiply(zInv)
        return new Point2(
            this.E,
            this.x.multiply(zInv2),
            this.y.multiply(zInv3)
        )
    }

    neg = () => new JacobianPoint2(this.E, this.x, this.y.negate(), this.z)

    double() {
        return this.twice(1)
    }

    twice(n) {
        if (this.zero()) return this
        const P = JacobianPoint.prototype.twice.call(this, n)
        return new JacobianPoint2(this.E, P.x, P.y, P.z)
    }

    add(Q) {
        if (this.zero()) return Q
        if (Q.zero()) return this
        const P = JacobianPoint.prototype.add.call(this, Q)
        if (P.zero()) return new JacobianPoint2(this.E)
        return new JacobianPoint2(this.E, P.x, P.y, P.z)
    }

    subtract = (Q) => this.add(Q.neg())

    multiply(n) {
        if (typeof n !== 'bigint') n = BigInt(n)
        if (n < 0n) return this.neg().multiply(-n)
        if (n === 0n || this.zero()) return new JacobianPoint2(this.E)

        let result = new JacobianPoint2(this.E)
        let base = this
        while (n > 0n) {
            if (n & 1n) result = result.add(base)
            n >>= 1n
            if (n > 0n) base = base.double()
        }
        return result
    }
}

module.exports = { JacobianPoint, JacobianPoint2 }
