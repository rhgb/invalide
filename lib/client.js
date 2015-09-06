'use strict';
var path = require('path');
var fs = require('fs');
var http = require('http');
var _ = require('underscore');
var http2 = require('http2');
var ContentParser = require('./common/content-parser');
var debug = require('debug');
var debugRequest = debug('request');
var debugResponse = debug('response');

var defaultOptions = {
    remoteHostname: 'localhost',
    remotePort: 6700,
    proxyHostName: 'localhost',
    proxyPort: 4200
};

var ca = fs.readFileSync(path.join(__dirname, '../data/cert.pem'));

class Client {
    constructor (opt) {
        _.defaults(opt, defaultOptions);
        this.proxyServer = http.createServer();
        this.proxyServer.on('request', function (req, res) {
            debugRequest(req.method, req.url);
            debugRequest(req.headers);
            let remoteReq = http2.request({
                hostname: opt.remoteHostname,
                port: opt.remotePort,
                method: req.method,
                path: req.url,
                ca: ca
            });
            remoteReq.write(JSON.stringify(req.headers) + '\n');
            req.on('data', function (data) {
                debugRequest(data.toString());
                remoteReq.write(data.toString('hex'));
            });
            req.on('end', function () {
                remoteReq.end();
            });
            remoteReq.on('response', function (remoteRes) {
                let parser = new ContentParser();
                debugResponse(remoteRes.statusCode, remoteRes.statusMessage);
                debugResponse(remoteRes.headers);
                remoteRes.on('data', function (data) {
                    debugResponse(data.toString());
                    parser.push(data.toString());
                });
                parser.on('header', function (headers) {
                    res.writeHead(remoteRes.statusCode, remoteRes.statusMessage, headers);
                });
                parser.on('data', function (data) {
                    res.write(data);
                });
                remoteRes.on('end', function () {
                    res.end();
                })
            });
            remoteReq.on('error', function () {
                res.statusCode = 502;
                res.end();
            })
        });
        this.proxyServer.on('connect', function () {
            // TODO ssl
        });
        this.proxyServer.on('upgrade', function () {
            // TODO http2
        });
        this.proxyServer.listen(opt.proxyPort, opt.proxyHostName, function () {
            console.info(`Proxy server listening at ${opt.proxyHostName}:${opt.proxyPort}`);
        });
    }
}
module.exports = Client;