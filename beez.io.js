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

        define(function (require, exports, module) {

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
                    this.io = null;

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
                        self.onError(new beez.Error('io is not found.'));
                    }

                    self.options = options;
                    beez.manager.m.io = this;

                    if (!options.namespace) {
                        options.namespace = [''];
                    } else if (options.namespace.indexOf('') < 0) {
                        options.namespace.unshift('');
                    }

                    this
                    .configure(options)
                    .open(options.namespace); // configuration

                    _.each(options.namespace, function (name) {
                        /**
                         * Fired when the connection is established and the handshake successful.
                         */
                        self.io.of(name).on('connect', function () {
                            logger.debug('status connect to url:', self.url, ' namespace:', '/' + name);
                            if (name === '') {
                                var engine = self.io.engine;
                                var origOnHeartbeat = engine.onHeartbeat;
                                self.io.engine.onHeartbeat = function (heartbeat) {
                                    logger.debug('Heartbeat!', heartbeat);
                                    origOnHeartbeat.apply(engine, arguments);
                                    self.onHeartbeat(heartbeat);
                                };
                            }
                        });

                        /**
                         * Fired when a connection is attempted, passing the transport name.
                         */
                        self.io.of(name).on('connecting', function (transportType) {
                            logger.debug('connecting transport type:', transportType);
                            self.transportType = transportType;
                        });

                        /**
                         * Fired when the connection timeout occurs after the last connection attempt.
                         * This only fires if the connectTimeout option is set.
                         * If the tryTransportsOnConnectTimeout option is set,
                         * this only fires once all possible transports have been tried.
                         */
                        self.io.of(name).on('connect_failed', function (e) {
                            logger.error('connect fail:', e);
                            self.onError(e);
                        });

                        /**
                         * Fired when the connection is closed.
                         * Be careful with using this event,
                         * as some transports will fire it even under temporary,
                         * expected disconnections (such as XHR-Polling).
                         */
                        self.io.of(name).on('close', function (e) {
                            logger.debug('connection closed:', e);
                            self.onClose(e);
                        });

                        /**
                         * Fired when the connection is considered disconnected.
                         */
                        self.io.of(name).on('disconnect', function (e) {
                            logger.error('disconnect:', e);
                            self.onClose(e);
                        });

                        /**
                         * Fired when the connection has been re-established. This only fires if the reconnect option is set.
                         */
                        self.io.of(name).on('reconnect', function (transportType, reconnectionAttempts) {
                            logger.warn('reconnect:', transportType, ',', reconnectionAttempts);
                        });

                        /**
                         * Fired when a reconnection is attempted, passing the next delay for the next reconnection.
                         */
                        self.io.of(name).on('reconnecting', function (reconnectionDelay, reconnectionAttempts) {
                            logger.warn('reconnecting:', reconnectionDelay, ',', reconnectionAttempts);
                        });

                        /**
                         * Fired when all reconnection attempts have failed and we where unsuccessful in reconnecting to the server.
                         */
                        self.io.of(name).on('reconnect_failed', function (e) {
                            logger.error('reconnect failed:', e);
                            self.onError(e);
                        });

                        /**
                         * Fired when error occured
                         */
                        self.io.of(name).on('error', function (e) {
                            logger.error('error reason:', e);
                            self.onError(e);
                        });

                        /**
                         * message event
                         */
                        self.io.of(name).on('message', function (res) {
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
                 * Start to connection with socket.io
                 */
                Client.prototype.open = function (namespace) {
                    var self = this;
                    self.io = w.io.Manager(this.url);

                    _.each(namespace, function (nsp) {
                        self.io.socket('/' + nsp);
                    });

                    self.io.of = function (nsp) {
                        nsp = '/' + nsp;
                        return self.io.nsps[nsp];
                    };

                    return self;
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
                 * OVERRIDE ME
                 * onheartbeat handler
                 * If you want to write original onheartbeat handler
                 * override this method
                 */
                Client.prototype.onHeartbeat = beez.none;

                /**
                 * Join a room by room ID
                 * @param  {String} room - room id
                 * @param  {String} namespace - namespace of socket connection
                 */
                Client.prototype.join = function (room, namespace) {
                    logger.debug('join room ', room, 'namespace: ', namespace);
                    namespace = namespace || '/';
                    this.io.of(namespace).emit('join', room);
                };

                /**
                 * Add handler which called when server respond with socket connection
                 * @param {Object} handler
                 */
                Client.prototype.use = function (handler) {
                    if (!handler.name) {
                        throw new beez.Error('handler name is not define');
                    }
                    if (this.handler[handler.name]) {
                        logger.warn('handler name ', handler.name, ' is already exists');
                    }
                    this.handler[handler.name] = handler;
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

                    if (data.service) {
                        fn = this.handler[data.service] && this.handler[data.service][data.method];
                        fn && fn();
                    }

                    return this;
                };

                Client.prototype.get = function (namespace) {
                    return this.io.of(namespace);
                };

                /**
                 * Add socket.io event handler
                 * @param {String} label
                 * @param {function} callback
                 * @param {String} [namespace]
                 */
                Client.prototype.on = function (label, callback, namespace) {
                    var socket = namespace ? this.io.of(namespace) : this.io;
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
                    this.ready(function onConnection(io) {

                        var socket = io.of(options.name);

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
                 *
                 * @param {String} options.service
                 * @param {String} options.namespace
                 * @param {String} options.method
                 * @param {JSON} options.data
                 * @param {function} callback
                 */
                Client.prototype.send = function (options, callback) {
                    var self = this;
                    var namespace = options.namespace || '/';
                    var data = options.data || {};
                    var service = options.service;
                    var method = options.method;

                    this.ready(function (io) {
                        var socket = io.of(namespace),
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

                    if (self.io.connected) {
                        return callback && callback(self.io);
                    }

                    self.io.of('').on('connect', function () {
                        callback && callback(self.io);
                    });

                    return self;
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
                    Client.prototype[method] = function (service, data, namespace, callback) {
                        this.send({
                            service: service,
                            method: method,
                            namespace: namespace,
                            data: data
                        }, callback);
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
