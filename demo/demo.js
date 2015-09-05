(function() {
  "use strict";

  /*
    This is a demo controller and is not related to
    autocomplete directive.
  */
  angular.module("app.controllers.demo", [])
    .controller("Demo", DemoController);

  var STATIC_DEMO_DATA = [
    "berlin", "frankfurt", "amsterdam", "toronto",
    "ankara", "antalya", "vancouver", "belgrade",
    "stockholm", "london", "marmaris", "istanbul"
  ];

  function DemoController($http) {
    var vm = this;

    vm.ac1 = "";
    vm.ac2 = "Antalya";
    vm.staticSourceDemo = staticSourceDemo;
    vm.dynamicSourceDemo = dynamicSourceDemo;

    function staticSourceDemo(keyword) {
      var tbReturned = [];
      STATIC_DEMO_DATA.forEach(function(data) {
        if (data.indexOf(keyword) > -1) {
          tbReturned.push(data);
        }
      });
      // You can return array of strings right away!
      return tbReturned;
    }

    function dynamicSourceDemo(keyword) {
      /* You can return a promise, that'll resolve to array of strings
        eventually. Since we can do anything async, you can go any data
        source here.
      */
      return $http.jsonp("http://gd.geobytes.com/AutoCompleteCity", {
        params: {
          callback: "JSON_CALLBACK",
          q: keyword
        }
      }).then(function(data) {
        var tbReturned = [];
        data.data.forEach(function(aCity) {
          if (aCity.length > 0 && tbReturned.indexOf(aCity) < 0) {
            tbReturned.push(aCity);
          }
        });
        return tbReturned;
      });
    }
  }
})();
