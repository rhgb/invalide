'use strict';
var invalide = require('../index');
var params = require('minimist')(process.argv.slice(2));
var serverMode = params._.indexOf('server') >= 0;
var clientMode = params._.indexOf('client') >= 0;
if (serverMode && clientMode) {
    console.error('Please specify running mode.');
    process.exit(-1);
}
if (serverMode) {
    invalide.createServer(params);
} else if (clientMode) {
    invalide.createClient(params);
} else {
    console.error('Usage: ')
}