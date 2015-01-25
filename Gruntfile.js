module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        latedef: false,
        curly: true,
        eqeqeq: true,
        immed: true,
        newcap: false,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        strict: false,
        mocha: true,
        globals: {
          exports: true
        }
      },
      files: {
        src: [
          'Gruntfile.js',
          'lib/**/*.js',
          'test/**/*.js',
          'examples/**/*.js'
        ]
      }
    },

    mochacli: {
      spec: {
        options: {
          reporter: 'spec'
        }
      },
      nyan: {
        options: {
          reporter: 'nyan'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cli');

  grunt.registerTask('test', ['mochacli:spec']);
  grunt.registerTask('default', ['jshint', 'mochacli:nyan']);

};
