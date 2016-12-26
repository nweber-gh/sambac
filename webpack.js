let webpack = require('webpack'),
    webpackDevServer = require('webpack-dev-server');

let webpackConfig = require(process.cwd() + '/' + process.argv[2]);
webpackConfig.entry = JSON.parse(process.argv[3]);

let compiler = webpack(webpackConfig);
let webpackServer = new webpackDevServer(compiler, {
  stats: {
    colors: true
  }
});

webpackServer.listen(parseInt(process.argv[4]));
process.send('started');