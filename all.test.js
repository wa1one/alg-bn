const { BN128Fp, BN128Fp2 } = require('./src')

describe('Curves', function () {
    test('Curve point test', function () {
        const G = BN128Fp.create(1n, 2n)

        expect(G.double().eq(G.add(G))).toBeTruthy()

        expect(G.double().eq(G)).toBeFalsy()

        expect(G.isOnCurve()).toBeTruthy()

        const G2 = BN128Fp2.create(
            10857046999023057135944570762232829481370756359578518086990519993285655852781n,
            11559732032986387107991004021392285783925812861821192530917403151452391805634n,
            8495653923123431417604973247489272438418190587263600148770280649306958101930n,
            4082367875863433681332203403145435568316851327593401208105741076214120093531n
        )

        expect(G2.double().eq(G2.add(G2))).toBeTruthy()

        /*let pc = PairingCheck.create()

        pc.addPair(G, G2)
        pc.addPair(G, G2)

        pc.run()
        const pair = pc.result()

        pc = PairingCheck.create()

        pc.addPair(G.multiply(2n), G2)

        pc.run()

        expect(pair.eq(pc.result())).toBeTruthy()
        */
    })
})
