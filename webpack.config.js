const path = require('path')

module.exports = [
    {
        entry: './src/index.js',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'bls-sign',
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
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',

                    options: {
                        presets: [
                            '@babel/preset-env',
                            {
                                plugins: [
                                    '@babel/plugin-proposal-class-properties',
                                ],
                            },
                        ],
                    },
                },
            ],
        },

        target: ['node', 'es6'],
    },
    {
        entry: './src/index.js',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist-web'),
            library: 'bls-sign',
            libraryTarget: 'umd',
        },

        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',

                    options: {
                        presets: [
                            '@babel/preset-env',
                            {
                                plugins: [
                                    '@babel/plugin-proposal-class-properties',
                                ],
                            },
                        ],
                    },
                },
            ],
        },
        target: ['web', 'es6'],
        resolve: {
            fallback: {},
        },
    },
]
