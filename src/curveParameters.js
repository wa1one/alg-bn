const {
    Parameters,
    Bls12381Parameters: FieldBls12381Parameters,
    deriveFp2Params,
    Fp2,
} = require('alg-field')

// Curve-parameter bundles for Curve/Curve2 (src/Curves.js): the field modulus and subgroup
// order, the derived Fp2 tower params every Fp2 value on this curve must share, and the base
// (G1) and twisted (G2) curve coefficients/generators as Fp2 (G1 coordinates use im = 0,
// matching how Point/Point2 represent both groups uniformly).
//
// Named distinctly from alg-field's own Parameters/Bls12381Parameters (which are field-only,
// {p, n}) to avoid a naming collision when both packages are required together.

function buildBn254Parameters() {
    const p = Parameters.p
    const n = Parameters.n
    const fp2Params = deriveFp2Params(p)

    return {
        p,
        n,
        fp2Params,
        b: new Fp2(3n, 0n, fp2Params),
        Gx: new Fp2(1n, 0n, fp2Params),
        Gy: new Fp2(2n, 0n, fp2Params),
        G2b: new Fp2(3n, 0n, fp2Params).divide(new Fp2(9n, 1n, fp2Params)),
        G2x: new Fp2(
            10857046999023057135944570762232829481370756359578518086990519993285655852781n,
            11559732032986387107991004021392285783925812861821192530917403151452391805634n,
            fp2Params
        ),
        G2y: new Fp2(
            8495653923123431417604973247489272438418190587263600148770280649306958101930n,
            4082367875863433681332203403145435568316851327593401208105741076214120093531n,
            fp2Params
        ),
    }
}

function buildBls12381Parameters() {
    const p = FieldBls12381Parameters.p
    const n = FieldBls12381Parameters.n
    const fp2Params = deriveFp2Params(p)

    return {
        p,
        n,
        fp2Params,
        b: new Fp2(4n, 0n, fp2Params),
        Gx: new Fp2(
            3685416753713387016781088315183077757961620795782546409894578378688607592378376318836054947676345821548104185464507n,
            0n,
            fp2Params
        ),
        Gy: new Fp2(
            1339506544944476473020471379941921221584933875938349620426543736416511423956333506472724655353366534992391756441569n,
            0n,
            fp2Params
        ),
        G2b: new Fp2(4n, 4n, fp2Params),
        G2x: new Fp2(
            352701069587466618187139116011060144890029952792775240219908644239793785735715026873347600343865175952761926303160n,
            3059144344244213709971259814753781636986470325476647558659373206291635324768958432433509563104347017837885763365758n,
            fp2Params
        ),
        G2y: new Fp2(
            1985150602287291935568054521177171638300868978215655730859378665066344726373823718423869104263333984641494340347905n,
            927553665492332455747201965776037880757740193453592970025027978793976877002675564980949289727957565575433344219582n,
            fp2Params
        ),
    }
}

const Bn254Parameters = buildBn254Parameters()
const Bls12381Parameters = buildBls12381Parameters()

module.exports = { Bn254Parameters, Bls12381Parameters }
