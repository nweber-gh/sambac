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
    open = require('open'),
    fork = require('child_process').fork,
    WebpackJasmineHtmlRunnerPlugin = require('webpack-jasmine-html-runner-plugin');

program
    .usage('[options] <file ...>')
    .option('--webpackConfig <webpackConfig>', 'webpackConfigLocation')
    .option('--port <portNumber>', 'serve spec list on the specified local port number', 5678)
    .option('--webpackPort <webpackPort>', 'local webpack dev server port ', 8080)
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
                res(_.sortBy(_.map(_.filter(files, file => !_.includes(file, 'e2e')), file => {
                  const url = `http://localhost:${program.port}/specs/${file.toString().slice(0, -3)}`;
                  return {
                    name: path.basename(file, '.js'),
                    url,
                    debugUrl: `${url}?debug=true`
                  };
                }), 'name'));
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

const pattern = webpackConfig.entry;
let availableEntries;
if(Array.isArray(pattern)){
  availableEntries = WebpackJasmineHtmlRunnerPlugin.entry(...webpackConfig.entry);
}
else{
  availableEntries = WebpackJasmineHtmlRunnerPlugin.entry(webpackConfig.entry);
}
const availableEntryKeys = Object.keys(availableEntries);
webpackConfig.entry = {};

let child;

process.on('exit', function(){
  child.kill();
});

function restartFork(entryMap){
  return new Promise((resolve) => {
    child = fork(__dirname + '/webpack.js', [program.webpackConfig, JSON.stringify(webpackConfig.entry), program.webpackPort], {cwd: process.cwd()});
    child.on('message', m => {
      if(m === 'started'){
        resolve();
      }
    });
  });
}

app.get('/specs/*?', (req, res, next) => {
  function redirect(){
    let newUrl;
    if(!req.query.debug){
      newUrl = `${webpackLiveReloadBaseUrl}${specPath}.html`;
    }
    else{
      newUrl = `${webpackBaseUrl}${specPath}.html`
    }
    res.redirect(newUrl);
  }

  const specPath = req.params[0];
  let entryName = availableEntryKeys.find(entry => entry.endsWith(specPath));
  if(!webpackConfig.entry[entryName]){
    webpackConfig.entry[entryName] = availableEntries[entryName];
    child.kill();
    restartFork().then(redirect);
  }
  else{
    redirect();
  }
});

restartFork().then(() => {
  http
      .createServer(app)
      .listen(program.port, () => {
        console.log(`HTTP server listening on port ${program.port}`);
        open(`http://localhost:${program.port}`);
      });
});