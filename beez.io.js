/**
 * @fileOverview client system of the socket.io
 * @name beez.io.js
 * @author Masaki Sueda <sueda_masaki@cyberagent.co.jp>
 */

var BEEZIO_VERSION = '0.1.0';

if (typeof module !== 'undefined' && module.exports) {

    exports.VERSION = BEEZIO_VERSION;

} else {

    (function (w) {

        define('beez.io',['require','exports','module','beez'],function (require, exports, module) {

            var beez = require('beez'),
            _ = beez.vendor._,
            logger = beez.getLogger('beez.io');

            /**
             * get regexp by format
             * '%s:%s:%s' > /^(.+?):(.+?):(.+?)$/
             * @param  {String} format formatted string
            * @example
            * > formatedRegexp('%s:%s:%s');
            * > /^(.+?):(.+?):(.+?)$/
            */
            var formatRegexp = function formatRegexp(format) {
                format = format.replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&')
                .replace(/%.{1}/g, '(.+?)');
                return new RegExp('^' + format + '$');
            };

            /**
             * get format string
             */
            var formatString = function formatString() {
                var args = Array.prototype.slice.call(arguments);
                var str = args.pop();

                for (var i = 0; i < args.length; i++) {
                    str = str.replace(/%.{1}/, args[i]);
                }

                return str;
            };

            /**
             * websocket client
             * @exports Client
             */
            var Client = (function (w) {

                function Client() {

                    /**
                     * url
                     * @type {String}
                     */
                    this.url = '';

                    /**
                     * callback
                     * @type {Object}
                     */
                    this.callbacks = {};

                    /**
                     * handler
                     * @type {Object}
                     */
                    this.handler = {};

                    /**
                     * transport type
                     * @type {String}
                     */
                    this.transportType = null;

                    /**
                     * connection
                     * @type {*}
                     */
                    this.sockets = null;

                    /**
                     * format
                     * @type {String}
                     */
                    this.format = '';

                    /**
                     * format regexp
                     * @type {String}
                     */
                    this.regexp = '';
                }

                /**
                 * Setup beez.io client
                 */
                Client.prototype.setup = function (options) {
                    options = options || {};

                    var self = this;

                    if (!w.io) {
                        logger.error('io is not found.');
                        self.onError('io is not found.');
                    }

                    self.options = options;
                    beez.manager.m.io = this;

                    if (!options.namespace) {
                        options.namespace = [''];
                    } else if (options.namespace.indexOf('') > -1) {
                        options.namespace.push('');
                    }

                    this
                    .configure(options) // configuration
                    .open(this.url); // start connect

                    self.sockets.of(name).on('connect', function () {
                        // override heartbeat event
                        var context = self.sockets.socket.transport;
                        var origOnHeartBeat = context.onHeartbeat;
                        self.sockets.socket.transport.onHeartbeat = function (heartbeat) {
                            logger.debug('Heartbeat!', heartbeat);
                            origOnHeartBeat.apply(context, arguments);
                        };
                    });

                    _.each(options.namespace, function (name) {

                        /**
                         * Fired when the connection is established and the handshake successful.
                         */
                        self.sockets.of(name).on('connect', function () {
                            logger.debug('status [' + self.transportType + ']', 'connected to [' + self.url + ']');
                        });

                        /**
                         * Fired when a connection is attempted, passing the transport name.
                         */
                        self.sockets.of(name).on('connecting', function (transportType) {
                            logger.debug('connecting transport type:', transportType);
                            self.transportType = transportType;
                        });

                        /**
                         * Fired when the connection timeout occurs after the last connection attempt.
                         * This only fires if the connectTimeout option is set.
                         * If the tryTransportsOnConnectTimeout option is set,
                         * this only fires once all possible transports have been tried.
                         */
                        self.sockets.of(name).on('connect_failed', function (e) {
                            logger.error('connect fail:', e);
                            self.onError(e);
                        });

                        /**
                         * Fired when the connection is closed.
                         * Be careful with using this event,
                         * as some transports will fire it even under temporary,
                         * expected disconnections (such as XHR-Polling).
                         */
                        self.sockets.of(name).on('close', function (e) {
                            logger.debug('connection closed:', e);
                            self.onClose(e);
                        });

                        /**
                         * Fired when the connection is considered disconnected.
                         */
                        self.sockets.of(name).on('disconnect', function (e) {
                            logger.error('disconnect:', e);
                            self.onClose(e);
                        });

                        /**
                         * Fired when the connection has been re-established. This only fires if the reconnect option is set.
                         */
                        self.sockets.of(name).on('reconnect', function (transportType, reconnectionAttempts) {
                            logger.warn('reconnect:', transportType, ',', reconnectionAttempts);
                        });

                        /**
                         * Fired when a reconnection is attempted, passing the next delay for the next reconnection.
                         */
                        self.sockets.of(name).on('reconnecting', function (reconnectionDelay, reconnectionAttempts) {
                            logger.warn('reconnecting:', reconnectionDelay, ',', reconnectionAttempts);
                        });

                        /**
                         * Fired when all reconnection attempts have failed and we where unsuccessful in reconnecting to the server.
                         */
                        self.sockets.of(name).on('reconnect_failed', function (e) {
                            logger.error('reconnect failed:', e);
                            self.onError(e);
                        });

                        /**
                         * Fired when error occured
                         */
                        self.sockets.of(name).on('error', function (e) {
                            logger.error('error reason:', e);
                            self.onError(e);
                        });

                        /**
                         * message event
                         */
                        self.sockets.of(name).on('message', function (res) {
                            logger.debug('get Sever respose:', res);
                            self.invoke(res);
                        });
                    });

                    return this;
                };


                /**
                 * configure client
                 *
                 * @param options
                 * @return {beez.io}
                 */
                Client.prototype.configure = function (options) {

                    if (options.host) {
                        this.url += options.host || location.host;
                    }

                    if (options.port) {
                        this.url += ':' + options.port;
                    }

                    this.format = options.format || '%s.%s:%s';
                    this.regexp = formatRegexp(this.format);

                    return this;
                };

                /**
                 * OVERRIDE ME
                 * onerror handler
                 * If you want to write original error handler
                 * override this method
                 */
                Client.prototype.onError = beez.none;

                /**
                 * OVERRIDE ME
                 * onclose connection handler
                 * If you want to write original close handler
                 * override this method
                 */
                Client.prototype.onClose = beez.none;

                /**
                 * Join a room by room ID
                 * @param  {String} room - room id
                 * @param  {String} namespace - namespace of socket connection
                 */
                Client.prototype.join = function (room, namespace) {
                    logger.debug('join room ', room, 'namespace: ', namespace);
                    namespace = namespace || '/';
                    this.sockets.of(namespace).emit('join', room);
                };

                /**
                 * Add handler which called when server respond with socket connection
                 * @param {Object} handler
                 */
                Client.prototype.use = function (handler) {
                    if (handler.name) {
                        throw new beez.Error('handler name is not define');
                    }
                    if (this.handler[handler.name]) {
                        logger.warn('handler name ', handler.name, ' is already exists');
                    }
                    this.hanler[handler.name] = handler;
                };

                /**
                 * Start to connection with socket.io
                 */
                Client.prototype.open = function (url) {
                    logger.debug('open connection url:', url);
                    this.sockets = w.io.connect(url);
                    return this;
                };

                /**
                 * Invoke handler and callback
                 * This metod usually called when server respond
                 * @param  {String} res response data(string)
                 */
                Client.prototype.invoke = function (res) {
                    var data = this.parse(res),
                    callback,
                    fn;

                    if (data.body) {
                        callback = this.callbacks[data.body._req];
                        if (callback) {
                            delete this.callbacks[data.body._req];
                            callback(data.body, data.method);
                        }
                    }

                    if (data.handle) {
                        fn = this.handler[data.name] && this.handler[data.name][data.method];
                        fn && fn();
                    }

                    return this;
                };

                Client.prototype.get = function (namespace) {
                    return this.sockets.of(namespace);
                };

                /**
                 * Add socket.io event handler
                 * @param {String} label
                 * @param {function} callback
                 * @param {String} [namespace]
                 */
                Client.prototype.on = function (label, callback, namespace) {
                    var socket = namespace ? this.sockets.of(namespace) : this.sockets;
                    socket.on(label, callback);
                };

                /**
                 * bind socket event to model
                 * @param  {Model|Collection} model
                 */
                Client.prototype.bindIo = function (model) {
                    var self = this,
                    options = {};

                    if (!model.io) {
                        throw new beez.Error('It is necessary to set io option to a model.');
                    }

                    if (beez.utils.isString(model.io)) {
                        options.name = model.io;
                        model.io = options;
                    } else if (beez.utils.isObject(model.io)) {
                        options = model.io;
                    }

                    // connection is opened
                    this.ready(function onConnection(sockets) {

                        var socket = sockets.of(options.name);

                        // join the room
                        self.join(options.room, options.name);
                        // get server response
                        socket.on('message', function (res) {
                            logger.debug('get Server response. ', res);
                            // invoke
                            self.invoke(res);
                            var data = self.parse(res),
                            evt = model.io.event || 'io';

                            if (data.method) {
                                model.trigger(evt + ':' + data.method, data.body);
                            }

                        });

                    });

                };

                /**
                 * Send message to server
                 * @param {String} method
                 * @param {JSON} data
                 * @param {function} callback
                 */
                Client.prototype.send = function (service, method, data, namespace, callback) {
                    var self = this;

                    this.ready(function (sockets) {
                        var socket = sockets.of(namespace || '/'),
                        message;

                        if (beez.utils.isFunction(callback)) {
                            data._req = _.uniqueId();
                            if (!self.callbacks[data._req]) {
                                self.callbacks[data._req] = callback;
                            }
                        }

                        try {

                            var message = formatString(service, method, JSON.stringify(data), self.format);
                            logger.debug('send', message);
                            socket.send(message);

                        } catch (e) {

                            throw e;

                        }

                        return self;

                    });

                    return self;
                };

                /**
                 * Promise to ready for connection with socket.io
                 * @param {Function} callback
                 */
                Client.prototype.ready = function (callback) {
                    var self = this;

                    if (this.sockets.socket.connected) {
                        return callback && callback(this.sockets);
                    }

                    this.sockets.on('connect', function () {
                        callback && callback(self.sockets);
                    });

                    return this;
                };

                /**
                 * Parse data from server
                 * @param  {Object} data
                 */
                Client.prototype.parse = function parse(data) {
                    var match = data.match(this.regexp);

                    if (!match) {
                        throw new beez.Error('data format is illegal');
                    }

                    var service = match[1],
                    method = match[2],
                    body = match[3];

                    try {
                        body = JSON.parse(body);

                        return {
                            body: body,
                            service: service,
                            method: method
                        };
                    } catch (e) {
                        throw new beez.Error('parse error');
                    }

                };

                // create crud method
                _.each(['create', 'read', 'update', 'delete'], function (method) {
                    Client.prototype[method] = function (name, data, namespace, callback) {
                        this.send(name, method, data, namespace, callback);
                    };
                });

                return Client;

            }(w));

            var origSync = beez.vendor.Backbone.sync; // original sync
            beez.vendor.Backbone.sync = function sync(method, model, options) {
                // this is model and has collection
                if ((method === 'delete' || method === 'create') && model.isNew() && model.collection && model.collection.io) {
                    model = model.collection;
                }

                if (!model.io || options.direct) {

                    origSync.apply(this, arguments);

                } else {

                    var callback = options.success || beez.none;
                    var service = options.service || model.io.name;
                    var data = options.data || {};

                    beez.manager.m.io[method](service, data, model.io.name, function (data, method) {
                        callback(data, method);
                    });

                }
            };

            return new Client();

        });

    })(this);
}
;
