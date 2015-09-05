"use strict";
module.exports = function(config) {
  config.set({
    basePath: "../",
    files: [
      "https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular.min.js",
      "https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular-mocks.js",
      "lib/**/*.html",
      "lib/**/*.js",
      "test/unit/**/*.js"
    ],
    preprocessors: {
      "lib/**/*.html": ["ng-html2js"]
    },
    ngHtml2JsPreprocessor: {
      moduleName: "karma.template"
    },
    autoWatch: true,
    frameworks: ["jasmine"],
    browsers: ["Chrome"],
    plugins: [
      "karma-ng-html2js-preprocessor",
      "karma-chrome-launcher",
      "karma-jasmine"
    ]
  });
};
