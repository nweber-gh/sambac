#! /usr/bin/env node

'use strict';

let _ = require('lodash'),
    glob = require('glob'),
    path = require('path'),
    express = require('express'),
    http = require('http'),
    argv = require('minimist')(process.argv.slice(2)),
    serveIndex = require('serve-index'),
    port = argv.p || argv.port || '5678',
    staticDir = path.resolve(process.cwd(), argv._ && argv._.length > 0 ? argv._[0] : ''),
    go = {cwd: staticDir},
    projectName = staticDir.split(path.sep).pop(),
    jasmineDir = `${__dirname}/node_modules/jasmine-core`,
    jasminumDir = `${__dirname}/web`;

function start(systemJs, configJs) {
    let app = express();

    app.set('view engine', 'jade');
    app.set('views', `${__dirname}/views`);
    app.use('/static', serveIndex(staticDir, {icons: true}));
    app.use('/static', express.static(staticDir));
    app.use('/jasmine', serveIndex(jasmineDir, {icons: true}));
    app.use('/jasmine', express.static(jasmineDir));
    app.use('/jasminum', serveIndex(jasminumDir, {icons: true}));
    app.use('/jasminum', express.static(jasminumDir));

    //console.log(`/static => ${staticDir}`);

    app.get('/', (req, res) => {
        glob('!(node_modules|jspm_packages)/**/*-spec.js', go, (err, files) => {
            res.render('home', {
                projectName,
                specs: _.map(files, file => ({
                    name: path.basename(file, '.js'),
                    path: file,
                    url: `/specs/${path.basename(file, '.js')}`
                }))
            });
        });
    });

    app.get('/specs/:specName', (req, res) => {
        glob(`!(node_modules|jspm_packages)/**/${req.params.specName}.js`, go, (error, files) => {
            if (error) {
                res.status(500).render('500', {error});
            } else if (files.length === 0) {
                res.status(404).render('404', {error});
            } else {
                res.status(200).render('spec', {
                    specName: req.params.specName,
                    specJs: `/static/${files[0]}`,
                    systemJs,
                    configJs
                });
            }
        });
    });

    app.get('/specs', (req, res) => {
        glob('!(node_modules|jspm_packages)/**/*-spec.js', go, (err, files) => {
            res.render('specs', {
                projectName,
                systemJs,
                configJs,
                specsJs: _.map(files, file => `/static/${file}`).join('\', \'')
            });
        });
    });

    http
        .createServer(app)
        .listen(port, () => console.log(`HTTP server listening on port ${port}`));
}

glob(`jspm_packages/system.js`, go, (error, files) => {
    let systemJs, configJs;

    if (error || !files || files.length === 0) {
        console.error('Cannot start Jasminum - Unable to locate system.js for JSPM.');
    } else {
        systemJs = `/static/${files[0]}`;

        glob(`config.js`, go, (error, files) => {
            if (error || !files || files.length === 0) {
                console.error('Cannot start Jasminum - SystemJS config.js file not found.');
            } else {
                configJs = `/static/${files[0]}`;
                start(systemJs, configJs);
            }
        });
    }
});
