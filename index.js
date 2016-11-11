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
    serveIndex = require('serve-index');

program
    .usage('[options] <file ...>')
    .option('-p, --port <portNumber>', 'serve spec list on the specified local port number', parseInt, 5678)
    .option('-w, --webpackPort <webpackPort>', 'local webpack dev server port ', '8080')
    .option('-t, --webpackTestPath <webpackTestPath>', 'path on webpack dev server that specs live under', 'test')
    .parse(process.argv);

let projectDir = path.resolve(process.cwd(), program.args && program.args.length > 0 ? program.args[0] : ''),
    go = {cwd: projectDir},
    projectName = projectDir.split(path.sep).pop(),
    jasmineDir = `${process.cwd()}/node_modules/jasmine-core`,
    webpackBaseUrl = `http://localhost:${program.webpackPort}/`,
    webpackLiveReloadBaseUrl = `${webpackBaseUrl}webpack-dev-server/${program.webpackTestPath}/`,
    webpackDebugBaseUrl = `${webpackBaseUrl}${program.webpackTestPath}/`;

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
                    debugUrl: `${webpackDebugBaseUrl}${file.toString().slice(0, -2)}html`
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

http
    .createServer(app)
    .listen(program.port, () => console.log(`HTTP server listening on port ${program.port}`));