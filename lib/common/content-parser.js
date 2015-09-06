'use strict';
var EventEmitter = require('events').EventEmitter;

function parseData(str) {
    return new Buffer(str, 'hex');
}

class ContentParser extends EventEmitter {
    constructor() {
        super();
        this.headerParsed = false;
        this.headers = '';
    }
    push(str) {
        if (!this.headerParsed) {
            let pos = str.indexOf('\n');
            if (pos < 0) {
                this.headers += str;
            } else {
                this.headers += str.substr(0, pos);
                try {
                    this.headers = JSON.parse(this.headers);
                } catch(e) {
                    if (EventEmitter.listenerCount(this, 'error')) {
                        this.emit('error', 'JSON parse error', e);
                    } else {
                        throw new Error('ContentParser: Content JSON parse error');
                    }
                }
                this.headerParsed = true;
                this.emit('header', this.headers);
                let rest = str.slice(pos + 1);
                if (rest) {
                    this.emit('data', parseData(rest));
                }
            }
        } else {
            this.emit('data', parseData(str));
        }
    }
}
module.exports = ContentParser;