#! /usr/bin/env node

let sambac = require('../index.js'),
    program = require('commander');

program
    .usage('[options] <file ...>')
    .option('--webpackConfig <webpackConfig>', 'webpackConfigLocation')
    .option('--port <portNumber>', 'serve spec list on the specified local port number')
    .option('--webpackPort <webpackPort>', 'local webpack dev server port')
    .option('--showPath', 'set to show path instead of only filename for specs')
    .option('--disableRandom', 'do not run specs in random order (the default since jasmine 3)')
    .parse(process.argv);

sambac(program);
