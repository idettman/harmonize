var path = require('path');
var webpack = require('webpack');
module.exports = {
    entry: [
        'core-js/fn/object/assign',
        './src/example.ts'
    ],
    output: {
        filename: './example.js',
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: 'source-map',

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { test: /\.ts?$/, loader: 'ts-loader' },
        ],

        preLoaders: [
            { test: /\.js$/, loader: 'source-map-loader' }
        ]
    }
};