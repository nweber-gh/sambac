const webpack = require('webpack');
const WebpackJasmineHtmlRunnerPlugin = require('webpack-jasmine-html-runner-plugin');
const path = require('path');

let config = {
  entry: WebpackJasmineHtmlRunnerPlugin.entry('./**/example-spec.js'),
  output: {
   path: '/',
   publicPath: '/',
   filename: '[name].bundle.js'
  },
  module: {
    rules: []
  },
  devtool: '#inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"test"'
      },
    }),
    new WebpackJasmineHtmlRunnerPlugin( {
      fixupScripts: ['fixup-stacktraces', 'fixup-json-messages'],
      pattern: /spec$/
    })
  ]
};

module.exports = config;