module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

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
        src: ["Gruntfile.js", "lib/**/*.js", "test/*.js", "examples/*.js"]
      }
    },

    jscs: {
      files: {
        src: ["Gruntfile.js", "lib/**/*.js", "test/*.js", "examples/*.js"]
      },
      options: {
        config: ".jscsrc",
        requireCurlyBraces: [
          "if",
          "else",
          "for",
          "while",
          "do",
          "try",
          "catch",
        ],
        requireSpaceBeforeBlockStatements: true,
        requireParenthesesAroundIIFE: true,
        requireSpacesInConditionalExpression: true,
        requireSpaceAfterKeywords: [
          "if", "else",
          "switch", "case",
          "try", "catch",
          "do", "while", "for",
          "return", "typeof", "void",
        ],
        validateQuoteMarks: {
          mark: "\"",
          escape: true
        }
      }
    },

    mochacli: {
      spec: {
        options: {
          reporter: "spec"
        }
      },
      nyan: {
        options: {
          reporter: "nyan"
        }
      }
    }

  });

  grunt.registerTask("default", ["jshint", "jscs", "mochacli:nyan"]);
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-cli");
  grunt.loadNpmTasks("grunt-jscs");

  grunt.registerTask("test", ["mochacli:spec"]);
};
