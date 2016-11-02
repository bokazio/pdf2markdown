require("babel-core/register");
require("babel-polyfill");
var JSDocPlugin = require('jsdoc-webpack-plugin');
var webpack = require('webpack');
var package = require('./package.json');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });
// Webpack Setup
module.exports = {
    entry: ['babel-polyfill',package.paths.src],
    target: "node",
    output: {
        path: path.join(__dirname, package.paths.build),
        filename: "main.js",
    },
    module: {
        loaders: [{
            test: /(?:\.js[x]*$)/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
                presets:['es2015','stage-0','stage-3']
            }
        }],
        preLoaders: [{
            test: /(?:\.js[x]*$)/,
            loaders: ["future-loader?development"]
        }],
    },
    externals: nodeModules,
        // new webpack.optimize.UglifyJsPlugin({
        //     mangle: {
        //       except: ['Document', 'Revision', 'Guideline', 'Information', 'User', 'Base', 'TestClass']
        //     }
        // }),   //Production Minimizer
    ]
}
