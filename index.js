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
    .option('-p, --port <portNumber>', 'serve spec runners on the specified local port number', parseInt, 5678)
    .parse(process.argv);

let projectDir = path.resolve(process.cwd(), program.args && program.args.length > 0 ? program.args[0] : ''),
    go = {cwd: projectDir},
    projectName = projectDir.split(path.sep).pop(),
    jasmineDir = `${process.cwd()}/node_modules/jasmine-core`,
    sambacDir = `${__dirname}/web`;

function getSpecs() {
    return new Promise((res, rej) => {
        glob(SPECS_GLOB, go, (err, files) => {
            if (err) {
                rej(err);
            } else {
                res(_.sortBy(_.map(_.filter(files, file => !_.includes(file, 'e2e')), file => ({
                    name: path.basename(file, '.js'),
                    path: file,
                    url: `/specs/${path.basename(file, '.js')}`
                })), 'name'));
            }
        });
    });
}

function start(systemJs, configJs) {
    let app = express();

    app.set('view engine', 'jade');
    app.set('views', `${__dirname}/views`);
    app.use('/project', serveIndex(projectDir, {icons: true}));
    app.use('/project', express.static(projectDir));
    app.use('/jasmine', serveIndex(jasmineDir, {icons: true}));
    app.use('/jasmine', express.static(jasmineDir));
    app.use('/sambac', serveIndex(sambacDir, {icons: true}));
    app.use('/sambac', express.static(sambacDir));

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

    app.get('/specs/:specName', (req, res) => {
        glob(`!(node_modules|jspm_packages)/**/${req.params.specName}.js`, go, (error, files) => {
            if (error) {
                res.status(500).render('500', {error});
            } else if (files.length === 0) {
                res.status(404).render('404', {error});
            } else {
                res.status(200).render('spec', {
                    specName: req.params.specName,
                    specJs: `/project/${files[0]}`,
                    systemJs,
                    configJs
                });
            }
        });
    });

    app.get('/specs', (req, res) => {
        getSpecs()
            .then(specs => {
                res.render('specs', {
                    projectName,
                    systemJs,
                    configJs,
                    specsJs: _.map(specs, spec => `/project/${spec.path}`).join('\', \'')
                });
            })
            .catch(error => {
                res.status(500).render('500', {error});
            });
    });

    http
        .createServer(app)
        .listen(program.port, () => console.log(`HTTP server listening on port ${program.port}`));
}

glob(`jspm_packages/system.js`, go, (error, files) => {
    let systemJs, configJs;

    if (error || !files || files.length === 0) {
        console.error('Cannot start sambac - Unable to locate system.js for JSPM.');
    } else {
        systemJs = `/project/${files[0]}`;

        glob(`config.js`, go, (error, files) => {
            if (error || !files || files.length === 0) {
                console.error('Cannot start sambac - SystemJS config.js file not found.');
            } else {
                configJs = `/project/${files[0]}`;
                start(systemJs, configJs);
            }
        });
    }
});
