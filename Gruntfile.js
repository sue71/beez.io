(function () {

    var beez = {
        projectname: 'beez.io'
    };

    module.exports = function (grunt) {
        // enviroment
        beez.projectdir = grunt.file.findup(beez.projectname);
        grunt.log.ok('[environment] project name:', beez.projectname);
        grunt.log.ok('[environment] project directory:', beez.projectdir);

        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            clean: {
                src: ['dist', 'release', 'docs']
            },
            jshint: {
                src: ['beez.io.js'],
                options: {
                    jshintrc: '.jshintrc',
                    jshintignore: ".jshintignore"
                }
            },
            mkdir: {
                docs: {
                    options: {
                        mode: 0755,
                        create: ['docs']
                    }
                }
            },
            copy: {
                raw: {
                    files: [
                        {
                            src: ['dist/beez.io.js'],
                            dest: 'beez.io.js'
                        }
                    ]
                },
                min: {
                    files: [
                        {
                            src: ['dist/beez.io.min.js'],
                            dest: 'beez.io.min.js'
                        }
                    ]
                }
            },
            jsdoc : {
                dist : {
                    src: ['beez.io.js'],
                    options: {
                        lenient: true,
                        recurse: true,
                        private: true,
                        destination: 'docs',
                        configure: '.jsdoc.json'
                    }
                }
            },
            exec: {
                setver: {
                    command: './setver',
                    stdout: true,
                    stderr: true
                },
                beez_rjs: {
                    command: function (optimize) {
                        return './node_modules/requirejs/bin/r.js -o build.js optimize=' + optimize;
                    },
                    stdout: true,
                    stderr: true
                },
                spec_foundation: {
                    command: 'beez-foundation -c spec/foundation/spec.js -a beez.io:' + beez.projectdir,
                    stdout: true,
                    stderr: true
                }
            }
        });

        // These plugins provide necessary tasks.
        require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

        // task: foundation
        grunt.registerTask('pre', [
            'exec:setver'
        ]);

        /**
         * task: build
         */
        grunt.registerTask('rawbuild', [
            'pre',
            'jshint',
            'exec:beez_rjs:none',
            'copy:raw'
        ]);

        grunt.registerTask('minbuild', [
            'pre',
            'jshint',
            'exec:beez_rjs:uglify2',
            'copy:min'
        ]);

        // task: docs
        grunt.registerTask('docs', [
            'mkdir:docs',
            'jsdoc'
        ]);

        // task: defulat
        grunt.registerTask('default', [
            'clean',
            'rawbuild',
            'minbuild'
        ]);

        grunt.registerTask('foundation', [
            'exec:spec_foundation'
        ]);

    };

})(this);
