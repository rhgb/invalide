'use strict';
module.exports = {
    Server: require('./lib/server'),
    Client: require('./lib/client'),
    createServer: function (params) {
        return new this.Server(params);
    },
    createClient: function (params) {
        return new this.Client(params);
    }
};