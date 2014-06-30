(function () {

    var _hash = 'hash';

    return {

        'test': {

            create: {
                id: _hash,
                message: 'test'
            },

            read: {
                id: _hash,
                list: [
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'}
                ]
            },

            update: {
                id: _hash,
                message: 'update'
            },

            'delete': {
                id: _hash
            },

            user: {

                attack: {
                    test: 'id'
                }

            }


        },

        'guild': {

            'item': {

                attack: {

                }

            }

        },

        'namespaceA': {

            create: {
                id: _hash,
                message: 'test'
            },

            read: {
                id: _hash,
                list: [
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'}
                ]
            },

            update: {
                id: _hash,
                message: 'update'
            },

            'delete': {
                id: _hash
            },

            attack: {
                id: _hash
            }

        },

        'namespaceB': {

            create: {
                id: _hash,
                message: 'test'
            },

            read: {
                id: _hash,
                list: [
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'},
                    {id: _hash, message: 'read'}
                ]
            },

            update: {
                id: _hash,
                message: 'update'
            },

            delete: {
                id: _hash
            }

        },

        'nameSpaceA': {
            attack: {
                test: 'test'
            }
        }

    };

}());
