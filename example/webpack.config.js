const webpack = require('webpack');
const path = require('path');

let config = {
  //entry paths should be relative to root directory
  entry: './example/src/**/example-spec.js',
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
    })
  ]
};

module.exports = config;