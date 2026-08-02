const { BN128Fp, BN128Fp2 } = require('./src')
const { Curve, Curve2 } = require('./src/Curves')
const { Field, Fp2, Field2, Field12 } = require('@wa1one/alg-field')

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

// Curve, Curve2, Point, Point2 and Point12 all build coordinates via Field2/Field12
// from @wa1one/alg-field. That package's own README documents those two classes as
// unfinished and non-functional ("every method throws or returns a wrong result"),
// so none of the five classes below can currently be used for real elliptic-curve
// arithmetic. These tests pin down that broken state so they fail loudly (telling us
// to fill in real coverage) once alg-field ships working Field2/Field12 classes.
describe('Curve, Curve2, Point, Point2, Point12 (blocked by @wa1one/alg-field Field2/Field12)', () => {
    const p =
        21888242871839275222246405745257275088548364400416034343698204186575808495617n

    test('Field2 cannot be constructed, so Curve cannot build its coefficients', () => {
        expect(() => new Field2(p, 3n)).toThrow()
        expect(() => new Curve({ p })).toThrow()
    })

    test('Curve2 fails for the same reason, via its Curve super constructor', () => {
        expect(() => new Curve2({ bn: { p } })).toThrow()
    })

    test('Field12 cannot be constructed either, blocking Point12 coordinates', () => {
        expect(() => new Field12({ p }, [1n, 2n, 3n, 4n, 5n, 6n])).toThrow()
    })
})
