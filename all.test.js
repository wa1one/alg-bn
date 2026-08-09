const { BN128Fp, BN128Fp2 } = require('./src')
const { Curve, Curve2 } = require('./src/Curves')
const { Point, Point2, Point12 } = require('./src/Points')
const { JacobianPoint, JacobianPoint2 } = require('./src/JacobianPoints')
const { Bn254Parameters, Bls12381Parameters } = require('./src/curveParameters')
const { Field, Fp2 } = require('alg-field')

function randomBigIntForTest(bits) {
    let r = 0n
    for (let i = 0; i < bits; i++) {
        r = (r << 1n) | BigInt(Math.random() < 0.5 ? 0 : 1)
    }
    return r
}

const G2_COORDS = [
    10857046999023057135944570762232829481370756359578518086990519993285655852781n,
    11559732032986387107991004021392285783925812861821192530917403151452391805634n,
    8495653923123431417604973247489272438418190587263600148770280649306958101930n,
    4082367875863433681332203403145435568316851327593401208105741076214120093531n,
]

describe('BN128Fp', () => {
    const G = BN128Fp.create(1n, 2n)

    test('create() returns a valid point for coordinates on the curve', () => {
        expect(G).not.toBeNull()
        expect(G.isOnCurve()).toBeTruthy()
        expect(G.isValid()).toBeTruthy()
    })

    test('create() returns the point at infinity for (0, 0)', () => {
        expect(BN128Fp.create(0n, 0n)).toBe(BN128Fp.ZERO)
    })

    test('create() returns null for coordinates not on the curve', () => {
        expect(BN128Fp.create(1n, 3n)).toBeNull()
    })

    test('isOnCurve() rejects a point built with off-curve coordinates', () => {
        const invalid = new BN128Fp(new Field(1n), new Field(3n), Field._1)
        expect(invalid.isOnCurve()).toBeFalsy()
    })

    test('isValid() rejects a point built with non-Field coordinates', () => {
        expect(new BN128Fp(1n, 2n, 1n).isValid()).toBeFalsy()
    })

    test('isZero()', () => {
        expect(BN128Fp.ZERO.isZero()).toBeTruthy()
        expect(G.isZero()).toBeFalsy()
    })

    test('double() matches self-addition', () => {
        expect(G.double().eq(G.add(G))).toBeTruthy()
        expect(G.double().eq(G)).toBeFalsy()
    })

    test('add() treats the point at infinity as the identity', () => {
        expect(G.add(BN128Fp.ZERO).eq(G)).toBeTruthy()
        expect(BN128Fp.ZERO.add(G).eq(G)).toBeTruthy()
    })

    test('multiply() matches repeated addition (compared in affine form)', () => {
        expect(G.multiply(0n).isZero()).toBeTruthy()
        expect(G.multiply(1n).eq(G)).toBeTruthy()
        expect(G.multiply(2n).eq(G.double())).toBeTruthy()

        const threeG = G.multiply(3n).toAffine()
        const addedThreeG = G.add(G.double()).toAffine()
        expect(threeG.eq(addedThreeG)).toBeTruthy()
    })

    test('neg() produces the additive inverse', () => {
        expect(G.add(G.neg()).isZero()).toBeTruthy()
    })

    test('toAffine() normalizes z to 1 and leaves an already-affine point unchanged', () => {
        expect(G.toAffine().eq(G)).toBeTruthy()

        const zeroAffine = BN128Fp.ZERO.toAffine()
        expect(zeroAffine.isZero()).toBeTruthy()
        expect(zeroAffine.y.eq(Field._1)).toBeTruthy()
    })

    test('toEthNotation() encodes the point at infinity as (0, 0, 0)', () => {
        expect(G.toEthNotation().eq(G)).toBeTruthy()

        const zeroEth = BN128Fp.ZERO.toEthNotation()
        expect(zeroEth.eq(BN128Fp.ZERO)).toBeTruthy()
        expect(zeroEth.y.eq(Field._0)).toBeTruthy()
    })

    test('eq() compares by value and rejects non-BN128Fp values', () => {
        expect(G.eq(G)).toBeTruthy()
        expect(G.eq(BN128Fp.create(1n, 2n))).toBeTruthy()
        expect(G.eq(G.double())).toBeFalsy()
        expect(G.eq(null)).toBeFalsy()
        expect(G.eq({})).toBeFalsy()
    })

    test('toString() renders coordinates as a comma-separated decimal string', () => {
        expect(G.toString()).toBe('1, 2, 1')
    })
})

describe('BN128Fp2', () => {
    const G2 = BN128Fp2.create(...G2_COORDS)

    test('create() returns a valid point for coordinates on the twisted curve', () => {
        expect(G2).not.toBeNull()
        expect(G2.isOnCurve()).toBeTruthy()
        expect(G2.isValid()).toBeTruthy()
    })

    test('create() returns the point at infinity for all-zero coordinates', () => {
        expect(BN128Fp2.create(0n, 0n, 0n, 0n)).toBe(BN128Fp2.ZERO)
    })

    test('create() returns null for coordinates not on the curve', () => {
        expect(BN128Fp2.create(1n, 2n, 3n, 4n)).toBeNull()
    })

    test('isValid() rejects a point built with non-Fp2 coordinates', () => {
        expect(new BN128Fp2(1n, 2n, 1n).isValid()).toBeFalsy()
    })

    test('isZero()', () => {
        expect(BN128Fp2.ZERO.isZero()).toBeTruthy()
        expect(G2.isZero()).toBeFalsy()
    })

    test('double() matches self-addition', () => {
        expect(G2.double().eq(G2.add(G2))).toBeTruthy()
        expect(G2.double().eq(G2)).toBeFalsy()
    })

    test('add() treats the point at infinity as the identity', () => {
        expect(G2.add(BN128Fp2.ZERO).eq(G2)).toBeTruthy()
        expect(BN128Fp2.ZERO.add(G2).eq(G2)).toBeTruthy()
    })

    test('multiply() matches repeated addition (compared in affine form) and coerces non-bigint scalars', () => {
        expect(G2.multiply(0n).isZero()).toBeTruthy()
        expect(G2.multiply(1n).eq(G2)).toBeTruthy()
        expect(G2.multiply(2n).eq(G2.double())).toBeTruthy()
        expect(G2.multiply(2).eq(G2.double())).toBeTruthy()

        const threeG2 = G2.multiply(3n).toAffine()
        const addedThreeG2 = G2.add(G2.double()).toAffine()
        expect(threeG2.eq(addedThreeG2)).toBeTruthy()
    })

    test('toAffine() normalizes z to 1 and leaves an already-affine point unchanged', () => {
        expect(G2.toAffine().eq(G2)).toBeTruthy()

        const zeroAffine = BN128Fp2.ZERO.toAffine()
        expect(zeroAffine.isZero()).toBeTruthy()
        expect(zeroAffine.y.eq(Fp2._1)).toBeTruthy()
    })

    test('toEthNotation() encodes the point at infinity as (0, 0, 0)', () => {
        expect(G2.toEthNotation().eq(G2)).toBeTruthy()
        expect(BN128Fp2.ZERO.toEthNotation().eq(BN128Fp2.ZERO)).toBeTruthy()
    })

    test('eq() compares by value and rejects non-BN128Fp2 values', () => {
        expect(G2.eq(G2)).toBeTruthy()
        expect(G2.eq(BN128Fp2.create(...G2_COORDS))).toBeTruthy()
        expect(G2.eq(G2.double())).toBeFalsy()
        expect(G2.eq(null)).toBeFalsy()
        expect(G2.eq({})).toBeFalsy()
    })

    test('toString() renders coordinates as a bracketed decimal string', () => {
        expect(G2.toString()).toBe(
            '[10857046999023057135944570762232829481370756359578518086990519993285655852781, 11559732032986387107991004021392285783925812861821192530917403151452391805634, 8495653923123431417604973247489272438418190587263600148770280649306958101930, 4082367875863433681332203403145435568316851327593401208105741076214120093531, 1, 0]'
        )
    })

    test('mulByP() applies the Frobenius twist and stays on the curve', () => {
        const twisted = G2.mulByP()
        expect(twisted).toBeInstanceOf(BN128Fp2)
        expect(twisted.isOnCurve()).toBeTruthy()
    })
})

describe('Curve / Point', () => {
    const curve = new Curve()
    const G = curve.G

    test('G is on the curve and the curve exposes the point at infinity', () => {
        expect(curve.contains(G)).toBeTruthy()
        expect(curve.infinity.zero()).toBeTruthy()
        expect(curve.infinity.double().zero()).toBeTruthy()
    })

    test('double() matches self-addition', () => {
        expect(G.double().eq(G.add(G))).toBeTruthy()
        expect(G.double().eq(G)).toBeFalsy()
    })

    test('add() treats the point at infinity as the identity', () => {
        expect(G.add(curve.infinity).eq(G)).toBeTruthy()
        expect(curve.infinity.add(G).eq(G)).toBeTruthy()
    })

    test('multiply() matches repeated addition', () => {
        expect(G.multiply(0n).zero()).toBeTruthy()
        expect(G.multiply(1n).eq(G)).toBeTruthy()
        expect(G.multiply(2n).eq(G.double())).toBeTruthy()
        expect(G.multiply(3n).eq(G.add(G.double()))).toBeTruthy()
    })

    test('neg() produces the additive inverse', () => {
        expect(G.add(G.neg()).zero()).toBeTruthy()
    })

    test('twice(n) doubles n times', () => {
        expect(G.twice(2).eq(G.multiply(4n))).toBeTruthy()
        expect(curve.infinity.twice(3).zero()).toBeTruthy()
    })

    test('contains() rejects a point built with off-curve coordinates', () => {
        const offCurve = new Point(
            curve,
            new Fp2(1n, 0n, Bn254Parameters.fp2Params),
            new Fp2(1n, 0n, Bn254Parameters.fp2Params)
        )
        expect(curve.contains(offCurve)).toBeFalsy()
    })

    test('eq() rejects points from a different curve and non-Point values', () => {
        const otherCurve = new Curve({ ...Bn254Parameters })
        expect(G.eq(otherCurve.G)).toBeFalsy()
        expect(G.eq(null)).toBeFalsy()
        expect(G.eq({})).toBeFalsy()
    })

    test('toString() renders affine coordinates', () => {
        expect(G.toString()).toBe('(1, 0,2, 0)')
    })

    test('toF12() embeds the point into the Fp12 pairing target group', () => {
        const G12 = G.toF12()
        expect(G12).toBeInstanceOf(Point12)
        expect(G12.add(G12).eq(G12.double())).toBeTruthy()

        const infinity12 = curve.infinity.toF12()
        expect(infinity12).toBe(curve.infinity)
    })

    test('pointFactory() produces distinct valid points on this curve instance', () => {
        const p1 = curve.pointFactory()
        const p2 = curve.pointFactory()
        expect(curve.contains(p1)).toBeTruthy()
        expect(p1.eq(p2)).toBeFalsy()
    })
})

describe('Curve2 / Point2', () => {
    const curve = new Curve()
    const curve2 = new Curve2(curve)
    const Gt = curve2.Gt

    test('Gt is on the twisted curve and the curve exposes the point at infinity', () => {
        expect(curve2.contains(Gt)).toBeTruthy()
        expect(curve2.infinity.zero()).toBeTruthy()
    })

    test('double() matches self-addition', () => {
        expect(Gt.double().eq(Gt.add(Gt))).toBeTruthy()
        expect(Gt.double().eq(Gt)).toBeFalsy()
    })

    test('add() treats the point at infinity as the identity', () => {
        expect(Gt.add(curve2.infinity).eq(Gt)).toBeTruthy()
        expect(curve2.infinity.add(Gt).eq(Gt)).toBeTruthy()
    })

    test('multiply() matches repeated addition', () => {
        expect(Gt.multiply(0n).zero()).toBeTruthy()
        expect(Gt.multiply(2n).eq(Gt.double())).toBeTruthy()
        expect(Gt.multiply(3n).eq(Gt.add(Gt.double()))).toBeTruthy()
    })

    test('neg() produces the additive inverse', () => {
        expect(Gt.add(Gt.neg()).zero()).toBeTruthy()
    })

    test('constructing a point not on the twisted curve throws', () => {
        expect(
            () =>
                new Point2(
                    curve2,
                    new Fp2(1n, 0n, Bn254Parameters.fp2Params),
                    new Fp2(1n, 0n, Bn254Parameters.fp2Params)
                )
        ).toThrow('pointNotOnCurve')
    })

    test('toF12() embeds the point into the Fp12 pairing target group', () => {
        const Gt12 = Gt.toF12()
        expect(Gt12).toBeInstanceOf(Point12)
        expect(curve2.contains(Gt12)).toBeTruthy()
    })

    test('toF12() rejects an unrecognized twistType', () => {
        const badCurve2 = new Curve2(
            new Curve({ ...Bn254Parameters, twistType: 'X' })
        )
        expect(() => badCurve2.Gt.toF12()).toThrow(
            'does not know how to untwist bn.twistType "X"'
        )
    })

    test('pointFactory() produces distinct valid points on this curve instance', () => {
        const p1 = curve2.pointFactory()
        const p2 = curve2.pointFactory()
        expect(curve2.contains(p1)).toBeTruthy()
        expect(p1.eq(p2)).toBeFalsy()
    })
})

describe('Point12', () => {
    const curve = new Curve()
    const curve2 = new Curve2(curve)
    const G12 = curve.G.toF12()

    test('the curve2-based 1-argument constructor builds the Fp12 identity', () => {
        const identity = new Point12(curve2)
        expect(identity.inf).toBeTruthy()
        expect(identity.x.eq(curve2.Fp12_1)).toBeTruthy()
        expect(identity.zero()).toBeTruthy()
    })

    test('double() matches self-addition', () => {
        expect(G12.double().eq(G12.add(G12))).toBeTruthy()
    })

    test('multiply() matches repeated addition', () => {
        expect(G12.multiply(2n).eq(G12.double())).toBeTruthy()
        expect(G12.multiply(3n).eq(G12.add(G12.double()))).toBeTruthy()
    })

    test('twice(n) doubles n times', () => {
        expect(G12.twice(2).eq(G12.multiply(4n))).toBeTruthy()
    })

    test('toString() renders affine Fp12 coordinates', () => {
        expect(G12.toString().startsWith('(')).toBeTruthy()
        expect(G12.toString()).toContain(', ')
    })
})

// BLS12-381's G1/G2 generator, b coefficient, and subgroup order in Bls12381Parameters are
// published constants recalled from memory rather than read from a source, so the strongest
// checks here are the ones that would catch a wrong digit rather than just "didn't throw":
// multiplying each generator by its claimed subgroup order must return the point at infinity.
describe('BLS12-381', () => {
    const curve = new Curve(Bls12381Parameters)
    const curve2 = new Curve2(curve)
    const G = curve.G
    const Gt = curve2.Gt

    test('generators are on their respective curves and have the claimed subgroup order', () => {
        expect(curve.contains(G)).toBeTruthy()
        expect(G.multiply(Bls12381Parameters.n).zero()).toBeTruthy()

        expect(curve2.contains(Gt)).toBeTruthy()
        expect(Gt.multiply(Bls12381Parameters.n).zero()).toBeTruthy()
    })

    test('G1 double() matches self-addition and multiply() matches repeated addition', () => {
        expect(G.double().eq(G.add(G))).toBeTruthy()
        expect(G.multiply(2n).eq(G.double())).toBeTruthy()
        expect(G.multiply(3n).eq(G.add(G.double()))).toBeTruthy()
    })

    test('G2 double() matches self-addition and multiply() matches repeated addition', () => {
        expect(Gt.double().eq(Gt.add(Gt))).toBeTruthy()
        expect(Gt.multiply(2n).eq(Gt.double())).toBeTruthy()
        expect(Gt.multiply(3n).eq(Gt.add(Gt.double()))).toBeTruthy()
    })

    test('add() treats the point at infinity as the identity', () => {
        expect(G.add(curve.infinity).eq(G)).toBeTruthy()
        expect(Gt.add(curve2.infinity).eq(Gt)).toBeTruthy()
    })

    test('toF12() embeds points into the Fp12 pairing target group (M-twist)', () => {
        const G12 = G.toF12()
        expect(G12).toBeInstanceOf(Point12)
        expect(curve.contains(G12)).toBeTruthy()
        expect(G12.add(G12).eq(G12.double())).toBeTruthy()

        const Gt12 = Gt.toF12()
        expect(Gt12).toBeInstanceOf(Point12)
        expect(curve2.contains(Gt12)).toBeTruthy()
        expect(Gt12.add(Gt12).eq(Gt12.double())).toBeTruthy()
        expect(Gt12.multiply(3n).eq(Gt12.add(Gt12.double()))).toBeTruthy()
    })
})

describe('JacobianPoint / JacobianPoint2', () => {
    const curve = new Curve()
    const curve2 = new Curve2(curve)
    const JG = JacobianPoint.fromAffine(curve, curve.G)
    const JGt = JacobianPoint2.fromAffine(curve2, curve2.Gt)

    test('fromAffine()/toAffine() round-trips the generator', () => {
        expect(JG.toAffine().eq(curve.G)).toBeTruthy()
        expect(JGt.toAffine().eq(curve2.Gt)).toBeTruthy()
    })

    test('the point at infinity round-trips and is zero()', () => {
        expect(new JacobianPoint(curve).zero()).toBeTruthy()
        expect(new JacobianPoint(curve).toAffine().eq(curve.infinity)).toBeTruthy()
        expect(new JacobianPoint2(curve2).zero()).toBeTruthy()
        expect(new JacobianPoint2(curve2).toAffine().eq(curve2.infinity)).toBeTruthy()
    })

    test('double()/twice() agree with the affine Point/Point2 implementation', () => {
        expect(JG.double().toAffine().eq(curve.G.double())).toBeTruthy()
        expect(JG.twice(3).toAffine().eq(curve.G.twice(3))).toBeTruthy()
        expect(JGt.double().toAffine().eq(curve2.Gt.double())).toBeTruthy()
        expect(JGt.twice(3).toAffine().eq(curve2.Gt.twice(3))).toBeTruthy()
    })

    test('add() agrees with the affine implementation, including doubling and infinity results', () => {
        const J3 = JG.multiply(3n)
        expect(JG.add(J3).toAffine().eq(curve.G.add(curve.G.multiply(3n)))).toBeTruthy()
        expect(JG.add(JG).toAffine().eq(curve.G.add(curve.G))).toBeTruthy() // same-point add == double
        expect(JG.add(JG.neg()).zero()).toBeTruthy() // P + (-P) = infinity

        const J3t = JGt.multiply(3n)
        expect(
            JGt.add(J3t).toAffine().eq(curve2.Gt.add(curve2.Gt.multiply(3n)))
        ).toBeTruthy()
        expect(JGt.add(JGt.neg()).zero()).toBeTruthy()
    })

    test('multiply() agrees with repeated addition and with Point/Point2.multiply() across random scalars', () => {
        expect(JG.multiply(0n).zero()).toBeTruthy()
        expect(JG.multiply(1n).toAffine().eq(curve.G)).toBeTruthy()
        expect(JG.multiply(2n).toAffine().eq(curve.G.double())).toBeTruthy()

        for (let i = 0; i < 15; i++) {
            const k = randomBigIntForTest(200)
            expect(JG.multiply(k).toAffine().eq(curve.G.multiply(k))).toBeTruthy()
            expect(JGt.multiply(k).toAffine().eq(curve2.Gt.multiply(k))).toBeTruthy()
        }
    })

    test('multiply() with a negative scalar matches negating first', () => {
        const k = 12345n
        expect(JG.multiply(-k).eq(JG.multiply(k).neg())).toBeTruthy()
    })

    test('satisfies the group axioms (associativity, commutativity, identity)', () => {
        const A = JG.multiply(3n)
        const B = JG.multiply(5n)
        const C = JG.multiply(7n)
        expect(A.add(B).add(C).eq(A.add(B.add(C)))).toBeTruthy()
        expect(A.add(B).eq(B.add(A))).toBeTruthy()
        expect(A.add(new JacobianPoint(curve)).eq(A)).toBeTruthy()
    })

    test('JacobianPoint2 rejects off-curve coordinates the same way Point2 does', () => {
        expect(
            () =>
                new JacobianPoint2(
                    curve2,
                    new Fp2(1n, 0n, Bn254Parameters.fp2Params),
                    new Fp2(1n, 0n, Bn254Parameters.fp2Params)
                )
        ).toThrow('pointNotOnCurve')
    })

    test('toString()/toF12() delegate to the affine representation', () => {
        expect(JG.toString()).toBe(curve.G.toString())
        expect(JG.toF12().eq(curve.G.toF12())).toBeTruthy()
    })

    test('works for a second curve (BLS12-381), not just the BN254 default', () => {
        const blsCurve = new Curve(Bls12381Parameters)
        const blsCurve2 = new Curve2(blsCurve)
        const JBG = JacobianPoint.fromAffine(blsCurve, blsCurve.G)
        const JBGt = JacobianPoint2.fromAffine(blsCurve2, blsCurve2.Gt)

        for (let i = 0; i < 10; i++) {
            const k = randomBigIntForTest(180)
            expect(
                JBG.multiply(k).toAffine().eq(blsCurve.G.multiply(k))
            ).toBeTruthy()
            expect(
                JBGt.multiply(k).toAffine().eq(blsCurve2.Gt.multiply(k))
            ).toBeTruthy()
        }
    })
})
