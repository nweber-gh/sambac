#! /usr/bin/env node

/* globals require, process, __dirname */

'use strict';

const SPECS_GLOB = '!(node_modules|jspm_packages)/**/*spec.js';

let _ = require('lodash'),
    glob = require('glob'),
    path = require('path'),
    express = require('express'),
    http = require('http'),
    program = require('commander'),
    serveIndex = require('serve-index'),
    webpack = require('webpack'),
    webpackDevServer = require('webpack-dev-server');

program
    .usage('[options] <file ...>')
    .option('--webpackConfig <webpackConfig>', 'webpackConfigLocation')
    .option('--port <portNumber>', 'serve spec list on the specified local port number', parseInt, 5678)
    .option('--webpackPort <webpackPort>', 'local webpack dev server port ', parseInt, 8080)
    .parse(process.argv);

if(!program.webpackConfig){
  console.log('add a webpack config');
  process.exit(1);
}
let webpackConfig = require(process.cwd() + '/' + program.webpackConfig);
if(!webpackConfig){
  console.log('missing webpack config');
  process.exit(1);
}


let projectDir = path.resolve(process.cwd(), program.args && program.args.length > 0 ? program.args[0] : ''),
    go = {cwd: projectDir},
    projectName = projectDir.split(path.sep).pop(),
    jasmineDir = `${process.cwd()}/node_modules/jasmine-core`,
    webpackBaseUrl = `http://localhost:${program.webpackPort}/`,
    webpackLiveReloadBaseUrl = `${webpackBaseUrl}webpack-dev-server/`;

function getSpecs() {
    return new Promise((res, rej) => {
        glob(SPECS_GLOB, go, (err, files) => {
            if (err) {
                rej(err);
            } else {
                res(_.sortBy(_.map(_.filter(files, file => !_.includes(file, 'e2e')), file => ({
                    name: path.basename(file, '.js'),
                    path: file,
                    url: `${webpackLiveReloadBaseUrl}${file.toString().slice(0, -2)}html`,
                    debugUrl: `${webpackBaseUrl}${file.toString().slice(0, -2)}html`
                })), 'name'));
            }
        });
    });
}

let app = express();

app.set('view engine', 'jade');
app.set('views', `${__dirname}/views`);
app.use('/jasmine', serveIndex(jasmineDir, {icons: true}));
app.use('/jasmine', express.static(jasmineDir));

app.get('/', (req, res) => {
    getSpecs()
        .then(specs => {
            res.render('home', {
                projectName,
                specs
            });
        })
        .catch(error => {
            res.status(500).render('500', {error});
        });
});

let compiler = webpack(webpackConfig);
let server = new webpackDevServer(compiler, {
  hot: true,
  stats: {
    colors: true
  },
  inline: true,
  progress: false
});
server.listen(program.webpackPort);

http
    .createServer(app)
    .listen(program.port, () => console.log(`HTTP server listening on port ${program.port}`));