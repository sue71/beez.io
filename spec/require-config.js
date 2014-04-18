(function(global) {
    var require = global.require;

    // Configure RequireJS
    require.config({
        'baseUrl': '../',
        'urlArgs': 'v=' + (new Date()).getTime(),
        'paths': {
            'backbone': 'bower_components/backbone/backbone',
            'underscore': 'bower_components/underscore/underscore',
            'zepto': 'bower_components/zepto/zepto',
            'handlebars': 'bower_components/handlebars/handlebars',
            'beez': 'bower_components/beez/release/beez',
            'beez.io': 'beez.io'
        },
        'shim': {
            'backbone': {
                'deps': [
                    'underscore',
                    'zepto'
                ],
                'exports': 'Backbone'
            },
            'zepto': {
                'exports': '$'
            },
            'underscore': {
                'exports': '_'
            },
            'handlebars': {
                'exports': 'Handlebars'
            }
        },
        'config': {
        }
    });

    /**
     * @name index.js<spec>
     * @author Masaki Sueda <sueda_masaki@cyberagent.co.jp>
     */
    define(['beez', 'beez.io', 'spec/template.hbsc'], function (beez, beezio, template) {

        beez.manager.setup();
        beezio.setup({
            host: 'http://0.0.0.0',
            port: '1115'
        });

        var mm = beez.manager.m,
            mv = beez.manager.v,

            $  = beez.vendor.$,
            _  = beez.vendor._;

        var rootView = mv.root(beez.View.extend({
            vidx: '@',
            render: function render() {
                $('#root').append(this.$el);
            }
        }));

        var rootModel = mm.root(beez.Model.extend({
            midx: '@'
        }));

        var Message = beez.Model.extend({
            midx: 'message',
            idAttribute: '_req'
        });

        var Messages = beez.Collection.extend({

            io: 'test',

            url: 'test',

            model: Message,

            midx: 'messages',

            initialize: function initialize() {
                var self = this,
                    idAttribute = self.idAtribute;

                beez.manager.m.io.bindIo(this);

                self.on('io:create', function (data) {
                    console.log('create', data);
                    self.add(data);
                });
                self.on('io:read', function (data) {
                    console.log('read', data);
                });
                self.on('io:delete', function (data) {
                    console.log('delete', data);
                    self.remove(data[idAttribute]);
                });
            }

        });

        var MessageView = beez.View.extend({

            vidx: 'message',

            midx: 'message',

            className: 'message',

            render: function render() {
                this.$el.text(this.model.get('message'));
                $('#message-area').append(this.$el);
            },

            remove: function remove() {
                //this.model.destroy();
            }

        });

        var MessagesView = beez.View.extend({

            vidx: 'messages',

            className: 'messages',

            events: {
                'click .button': 'send'
            },

            initialize: function initialize() {
                this.collection.on('add', this.render, this);
                this.template = template;
            },

            beforeOnce: function beforeOnce() {
                var self = this;
                self.getParent().$el.append(self.$el);
            },

            render: function render() {
                var self = this;
                self.$el.html(self.template());

                mv.remove('/@/messages/message');

                this.collection.each(function (model, index) {
                    mv
                    .create(mv.pathOf(self), [MessageView], {
                        model: model
                    });
                    mv.get('/@/messages/message')[index].async().show().end();
                });
            },

            send: function send(e) {
                var self = this;
                var $target = $(e.currentTarget);
                var method = $target.attr('data-method');

                if (method === 'create') {
                    this.collection.create({}, {wait: true});
                } else if (method === 'read') {
                    this.collection.fetch();
                } else if (method === 'delete') {
                    _.each(this.getChildren(), function (child) {
                        mv.remove(mv.pathOf(child));
                    });
                }
            }

        });

        $(function () {
            var messages = mm.create('/@', Messages);
            messages.fetch();
            mv.create('/@', MessagesView, {
                collection: messages
            });
            mv.get('/@')
            .async()
            .show()
            .end();
        });

    });


})(this);
