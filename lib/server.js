'use strict';
var path = require('path');
var fs = require('fs');
var net = require('net');
var http = require('http');
var http2 = require('http2');
var _ = require('underscore');
var debug = require('debug');
var ContentParser = require('./common/content-parser');

var debugRequest = debug('request');
var debugResponse = debug('response');

var defaultOptions = {
    hostname: 'localhost',
    port: 443
};
class Server {
    constructor(opt) {
        _.defaults(opt, defaultOptions);
        this.server = http2.createServer({
            key: fs.readFileSync(path.join(__dirname, '../data/key.pem')),
            cert: fs.readFileSync(path.join(__dirname, '../data/cert.pem'))
        });
        this.server.on('request', function (req, res) {
            let headers = null;
            let remoteReq = null;
            let parser = new ContentParser();
            function createRemoteReq() {
                let headerHost = headers.host.split(':');
                let host = headerHost[0];
                let port = headerHost[1] || 80;
                remoteReq = http.request({
                    hostname: host,
                    port: port,
                    path: req.url,
                    method: req.method,
                    headers: headers
                });
                remoteReq.on('response', function (remoteRes) {
                    debugResponse(remoteRes.statusCode, remoteRes.statusMessage);
                    debugResponse(remoteRes.headers);
                    res.writeHead(remoteRes.statusCode, remoteRes.statusMessage, {
                        'Content-Type': 'text/plain',
                        'Cache-Control': 'no-cache'
                    });
                    res.write(JSON.stringify(remoteRes.headers) + '\n');
                    remoteRes.on('data', function (data) {
                        debugResponse(data.toString());
                        res.write(data.toString('hex'));
                    });
                    remoteRes.on('end', function () {
                        res.end();
                    })
                });
            }
            debugRequest(req.method, req.url);
            req.on('data', function (data) {
                let incoming = data.toString();
                debugRequest(incoming);
                parser.push(incoming);
            });
            req.on('end', function () {
                remoteReq.end();
            });
            parser.on('header', function (header) {
                headers = header;
                createRemoteReq();
            });
            parser.on('data', function (data) {
                remoteReq.write(data);
            });
        });
        this.server.listen(opt.port, opt.hostname, function(){
            console.log(`Server listening at ${opt.hostname}:${opt.port}`);
        });
    }
}
module.exports = Server;