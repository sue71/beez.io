/**
 * @name index.js<spec>
 * @author Masaki Sueda <sueda_masaki@cyberagent.co.jp>
 * @overview TestCase: s/beez.io/index
 */
define(['beez.io', 'beez'], function(beezio, beez){

    beez.manager.setup();
    beezio.setup({
        host: '0.0.0.0',
        port: '1115'
    });

    var mm = beez.manager.m,
        mv = beez.manager.v;

    mv.root(beez.View.extend(
        'spec.rootView',
        {
            vidx: '@',

            id: 'root',

            render: function render() {
                $('#w').append(this.$el);
            }
        }
    ));

    mm.root(beez.Model.extend(
        'spec.rootModel',
        {
            midx: '@'
        }
    ));

    var Model = beez.Model.extend({
        midx: 'model',

        io: 'test',

        initialize: function initialize() {
            var self = this,
                idAttribute = self.idAtribute;

            beez.manager.m.io.bindIo(this);

            self.on('io:create', function (data) {
                console.log('create', data);
            });
            self.on('io:read', function (data) {
                console.log('read', data);
            });
            self.on('io:update', function (data) {
                console.log('update', data);
            });
            self.on('io:delete', function (data) {
                console.log('delete', data);
            });
        }
    });

    var Collection = beez.Collection.extend({

        io: 'test',

        url: 'test',

        model: Model,

        midx: 'collection',

        initialize: function initialize() {
            var self = this,
                idAttribute = self.idAtribute;

            beez.manager.m.io.bindIo(this);

            self.on('io:create', function (data) {
                console.log('create', data);
            });
            self.on('io:read', function (data) {
                console.log('read', data);
            });
            self.on('io:update', function (data) {
                console.log('update', data);
            });
            self.on('io:delete', function (data) {
                console.log('delete', data);
            });
        }

    });

    var collection, model;
    return function () {

        describe('Collection', function(done){

            before(function (done) {
                collection = mm.createCollection('/@', Collection);
                done();
            });

            it('fetch() - callback shoud be called', function (done) {
                collection.fetch({
                    success: function (collection, resp) {
                        done();
                    }
                });
            });

            it('fetch() - read event shoud be fired', function (done) {
                collection.on('io:read', function () {
                    done();
                });
                collection.fetch();
            });

            it('create() - create event shoud be fired', function (done) {
                collection.on('io:create', function () {
                    done();
                });
                collection.create({}, {wait: true});
            });

        });

        describe('Model', function(){

            before(function (done) {
                model = mm.create('/@', Model);
                done();
            });

            it('fetch() - callback should be called', function (done) {
                model.fetch({
                    success: function (collection, resp) {
                        done();
                    }
                });
            });

            it('fetch() - read event shoud be fired', function (done) {
                model.on('io:read', function () {
                    done();
                });
                model.fetch();
            });

            it('save() - update event shoud be fired', function (done) {
                model.on('io:update', function () {
                    done();
                });
                model.save();
            });


            it('destroy() - delete event shoud be fired', function (done) {
                model.on('io:delete', function () {
                    done();
                });
                model.destroy();
            });

        });


        describe('Manager', function(){

            it('callback shoud be called', function (done) {
                beez.manager.m.io.send('test.read', {}, 'test', function () {
                    done();
                });
            });
        });
    };

});
