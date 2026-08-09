const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

// This package is built on BigInt, so it cannot run anywhere below ES2020
// regardless of how it is transpiled. Targeting the oldest BigInt-capable
// engines therefore costs nothing in reach, while avoiding preset-env's
// default ES5 output - which rewrites `**` into Math.pow(). That rewrite
// silently broke Curve/Curve2.pointFactory (`2n ** (2n * BigInt(...))`),
// making every call throw "Cannot convert a BigInt value to a number".
const BIGINT_CAPABLE_TARGETS = {
    node: '10.4',
    chrome: '67',
    edge: '79',
    firefox: '68',
    safari: '14',
}

const babelRule = {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
        presets: [
            [
                '@babel/preset-env',
                { targets: BIGINT_CAPABLE_TARGETS, bugfixes: true },
            ],
            {
                plugins: ['@babel/plugin-proposal-class-properties'],
            },
        ],
    },
}

// Minification is configured explicitly rather than left to webpack's
// implicit production default, so the published output stays stable across
// webpack upgrades. Deliberately no `unsafe_*` compressor flags: they can
// change semantics, which is not a trade worth making here.
const minimizer = [
    new TerserPlugin({
        extractComments: false,
        terserOptions: {
            compress: { passes: 2 },
            format: { comments: false },
        },
    }),
]

module.exports = [
    {
        entry: './src/index.js',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'alg-bn',
            libraryTarget: 'umd',
        },

        // alg-field must NOT be bundled here: this is the Node build, and
        // consumers require() both alg-bn and alg-field directly (alg-bn's
        // own Curve/Point/JacobianPoint take alg-field Fp2/Field12 values
        // as arguments). Bundling a private copy means the classes those
        // consumers construct via their own `require('alg-field')` are a
        // *different* Fp2/Field12 than the one alg-bn's bundled copy uses
        // internally -- structurally identical data, but `instanceof`
        // (which alg-field's own add/multiply/etc rely on to recognize
        // same-level operands) fails between the two, throwing "Incorrect
        // type argument" on essentially every operation. `externals` keeps
        // this build's `require('alg-field')` resolving to the caller's own
        // installed copy instead of a second, bundled one.
        externals: {
            'alg-field': 'commonjs alg-field',
        },
        module: {
            rules: [babelRule],
        },

        optimization: { minimize: true, minimizer },

        target: ['node', 'es6'],
    },
    {
        entry: './src/index.js',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist-web'),
            library: 'alg-bn',
            libraryTarget: 'umd',
        },

        module: {
            rules: [babelRule],
        },

        optimization: { minimize: true, minimizer },

        target: ['web', 'es6'],
        resolve: {
            fallback: {},
        },
    },
]
