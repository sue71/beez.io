# beezio

## About

[beez](http://github.com/CyberAgent/beez)向けのsocket.ioクライアントプラグインです。


## Features

- beez.manager.model.ioからの通信に対応

- Model(save, fetch), Collection(create, fetch)に対応


## Usage

### CRUD

beezのModel(Collection)経由で実行します


``` javascript

beez.manager.setup();
beez.manager.m.io.setup(options);

var Collection = beez.Collection.extend(
    'model',
    {
        midx: 'model',

        io: 'user',

        initialize: function initialize() {
            beez.manager.m.bindIo(this); // start bind io

            this.on('io:create', function (data) {
                this.add(data);
            });

            this.on('io:update', function (data) {
                var model = this.get(data[this.idAttribute]);
                if (model) {
                    model.set(data);
                }
            });

            this.on('io:delete', function () {
                var model = this.get(data[this.idAttribute]);
                if (model) {
                    model.destroy();
                }
            });
        }

    }
);

```

### Other

beezを経由しないで通信します。

```javascript

var handler = {
    name: 'serviceName',
    method1: function () {
    }
};

beez.manager.m.io.use(handler);
beez.manager.m.io.send({
    service: handler.name,
    namespace: 'test',
    method: 'method1',
    data: {}
}, function () {
    // callback
});

```

## Method

### setup(options)
クライアントの設定とイベントの設定

- options.host ドメイン

- options.port ポート

- options.namespace 登録する名前空間

- options.format パースに使用するフォーマット

### open()
socket.io通信を開始する

### send(options, callback)
socket.ioでデータを送信する

#### params
- options.service 対応するハンドラ名
- options.method ハンドラのメソッド名
- options.data リクエストボディ
- options.namespace ネームスペース

### create(service, data, namespace, callback)
`create`で通信する

### read(name, data, namespace, callback)
`read`で通信する

### update(name, data, namespace, callback)
`update`で通信する

### delete(name, data, namespace, callback)
`delete`で通信する

### ready(callback)
コネクションの準備が整っていた場合に実行される関数

### parse(data)
データをフォーマットにそって整形する

### use(handler)
レスポンスに対応したメソッドを登録します


## Test

```
$ npm instal -g grunt-cli
$ npm install .
$ npm install -g beez-foundation

$ bower install

$ grunt foundation

```

open browser [http://0.0.0.0:1109/m/beezio/spec/index.html]

## Build
```
$ npm install -g grunt-cli
$ npm install .
$ bower install

grunt
```
