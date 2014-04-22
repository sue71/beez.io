({
    appDir: "./",
    baseUrl: ".",
    dir: "./dist",
    optimize: "none",
    //optimize: "uglify2",
    paths: {
        "zepto"       : "bower_components/zepto/zepto",
        "backbone"    : "bower_components/backbone/backbone",
        "underscore"  : "bower_components/underscore/underscore",
        "handlebars"  : "bower_components/handlebars/handlebars.runtime",
        "beez"        : "bower_components/beez/release/beez",
        "beez.io" : "beez.io"
    },
    shim: {
        zepto: {
            exports: "$"
        },
        backbone: {
            deps: ["underscore", "zepto"],
            exports: "Backbone"
        },
        underscore: {
            exports: "_"
        },
        handlebars: {
            exports: "Handlebars"
        }
    },
    modules: [
        {
            name: "beez.io",
            exclude: [
                "zepto",
                "backbone",
                "underscore",
                "handlebars",
                "beez"
            ]
        }
    ]
})
