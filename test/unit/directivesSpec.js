"use strict";

describe("ubAutocomplete", function() {
  beforeEach(module("ubAutocomplete"));
  beforeEach(module("karma.template"));

  function compileDirective(scopeVariables, tpl) {
    var el = null;
    var scope = null;
    inject(function($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.test = scopeVariables;
      if (!angular.isDefined(tpl)) {
        tpl = "<ub-autocomplete ng-model='test.model' source='test.source($keyword)'></ub-autocomplete>";
      }
      el = $compile(tpl)(scope);
      scope.$digest();
    });
    return {
      el: el,
      scope: scope,
      input: el.find("input"),
      suggestions: angular.element(el[0].querySelector(".autocomplete-suggestions"))
    };
  }

  describe("basic rendering", function() {
    // a single test example, check the produced DOM
    it("should show initial scope value on", function() {
      var el = compileDirective({model: "a", source: function() { return []; }});
      expect(el.input.length).toEqual(1);
      expect(el.input[0].value).toEqual("a");
    });
    it("should show sync autcomplete values", function() {
      var el = compileDirective({model: "", source: function() { return ["foo", "bar"]; }});
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(2);
      expect(el.suggestions.find("li")[0].textContent.trim()).toEqual("foo");
      expect(el.suggestions.find("li")[1].textContent.trim()).toEqual("bar");
    });
    it("should reflect changes to model", function() {
      var el = compileDirective({model: "", source: function() { return []; }});
      el.input.val("test123");
      el.input[0].dispatchEvent(new Event("input"));
      el.scope.$digest();
      expect(el.scope.test.model).toEqual("test123");
    });
  });

  describe("ngForm connections", function() {
    it("should be invalid with empty input if ng-required is exist", function() {
      var el = compileDirective({model: "", source: function() { return []; }},
        "<ub-autocomplete ng-model='test.model' ng-required='true' source='test.source($keyword)'></ub-autocomplete>");
      expect(el.el.hasClass("ng-invalid")).toEqual(true);
      el.input.val("x");
      el.input[0].dispatchEvent(new Event("input"));
      el.scope.$digest();
      expect(el.el.hasClass("ng-invalid")).toEqual(false);
    });
    it("should indicate ng-dirty once changed", function() {
      var el = compileDirective({model: "", source: function() { return []; }});
      expect(el.el.hasClass("ng-pristine")).toEqual(true);
      el.input.val("x");
      el.input[0].dispatchEvent(new Event("input"));
      el.scope.$digest();
      expect(el.el.hasClass("ng-dirty")).toEqual(true);
    });
  });

  describe("search", function() {
    it("should show loading and async response", inject(function($q) {
      var deferred = $q.defer();
      var el = compileDirective({
        model: "",
        source: function() {
          return deferred.promise;
        }});
      expect(el.suggestions[0].classList.contains("busy")).toEqual(false);
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(0);
      expect(el.suggestions[0].classList.contains("busy")).toEqual(true);
      deferred.resolve(["a", "b", "c"]);
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(3);
      expect(el.suggestions[0].classList.contains("busy")).toEqual(false);
    }));
    it("should show only the last current result, even resolve order is not linear", inject(function($q) {
      var deferred1 = $q.defer();
      var deferred2 = $q.defer();
      var el = compileDirective({
        model: "",
        source: function(kw) {
          if (kw.length > 0) {
            return deferred2.promise;
          }
          return deferred1.promise;
        }});
      expect(el.suggestions[0].classList.contains("busy")).toEqual(false);
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(0);
      expect(el.suggestions[0].classList.contains("busy")).toEqual(true);
      el.scope.$digest();
      expect(el.suggestions[0].classList.contains("busy")).toEqual(true);
      // deferred 1 is not finished at this point but we keep typing...

      el.input.val("x");
      el.input[0].dispatchEvent(new Event("input"));
      el.scope.$digest();
      expect(el.suggestions[0].classList.contains("busy")).toEqual(true);
      el.scope.$digest();
      expect(el.suggestions[0].classList.contains("busy")).toEqual(true);
      // deferred 1 and deffered2 is not finished at this point.

      // first the deferred1 fisinhes but we are not interested anymore
      deferred1.resolve(["a", "b", "c"]);
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(0);
      expect(el.suggestions[0].classList.contains("busy")).toEqual(true);

      // second, deferred2 finishes and we show it on the screen.
      deferred2.resolve(["a"]);
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(1);
      expect(el.suggestions[0].classList.contains("busy")).toEqual(false);
    }));
    it("should send the correct function parameter", function() {
      var obj = {
        model: "",
        source: function(x) {
          return [x + "123"];
        }
      };
      var el = compileDirective(obj);
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(1);
      expect(el.suggestions.find("li")[0].textContent.trim()).toEqual("123");

      el.input.val("xyzparam123");
      el.input[0].dispatchEvent(new Event("input"));
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(1);
      expect(el.suggestions.find("li")[0].textContent.trim()).toEqual("xyzparam123123");
    });
  });

  describe("visual limits", function() {
    it("should obey min character limit", function() {
      var el = compileDirective({model: "", source: function() { return ["foo", "bar"]; }},
        "<ub-autocomplete ng-model='test.model' min-length='3' ng-required='true' source='test.source($keyword)'></ub-autocomplete>");
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(0);
      el.input.val("xy");
      el.input[0].dispatchEvent(new Event("input"));
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(0);
      el.input.val("xyz");
      el.input[0].dispatchEvent(new Event("input"));
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(2);
    });
    it("should obey max search result limit", function() {
      var el = compileDirective({model: "", source: function() { return ["foo", "bar", "limit-here"]; }},
        "<ub-autocomplete ng-model='test.model' max-suggestions='2' ng-required='true' source='test.source($keyword)'></ub-autocomplete>");
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(2);
      expect(el.suggestions.find("li")[0].textContent.trim()).toEqual("foo");
      expect(el.suggestions.find("li")[1].textContent.trim()).toEqual("bar");
    });
  });

  describe("keyboard/mouse actions", function() {
    it("should go down and select by enter", function() {
      var el = compileDirective({model: "", source: function() { return ["foo", "bar"]; }});
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(2);

      el.input.triggerHandler("focus");

      // to first
      var e = new window.KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        shiftKey: false
      });
      delete e.keyCode;
      Object.defineProperty(e, "keyCode", {value: 40});
      // credits to http://stackoverflow.com/a/28146595/158523
      el.input[0].dispatchEvent(e);
      el.scope.$digest();

      expect(el.suggestions.find("li")[0].classList.contains("active")).toEqual(true);

      // to second
      el.input[0].dispatchEvent(e);
      el.scope.$digest();

      expect(el.suggestions.find("li")[0].classList.contains("active")).toEqual(false);
      expect(el.suggestions.find("li")[1].classList.contains("active")).toEqual(true);

      // to the first again
      el.input[0].dispatchEvent(e);
      el.scope.$digest();

      expect(el.suggestions.find("li")[1].classList.contains("active")).toEqual(false);
      expect(el.suggestions.find("li")[0].classList.contains("active")).toEqual(true);

      // select by enter
      e = new window.KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        shiftKey: false
      });
      delete e.keyCode;
      Object.defineProperty(e, "keyCode", {value: 13});

      el.input[0].dispatchEvent(e);
      el.scope.$digest();

      expect(el.suggestions[0].classList.contains("ng-hide")).toEqual(true);
      expect(el.scope.test.model).toEqual("foo");
    });
    it("should go up and select by click", function() {
      var el = compileDirective({model: "", source: function() { return ["foo", "bar"]; }});
      el.input.triggerHandler("focus");
      el.scope.$digest();
      expect(el.suggestions.find("li").length).toEqual(2);

      el.input.triggerHandler("focus");

      // to second
      var e = new window.KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        shiftKey: false
      });
      delete e.keyCode;
      Object.defineProperty(e, "keyCode", {value: 38});
      // credits to http://stackoverflow.com/a/28146595/158523
      el.input[0].dispatchEvent(e);
      el.scope.$digest();

      expect(el.suggestions.find("li")[1].classList.contains("active")).toEqual(true);

      // to first
      el.input[0].dispatchEvent(e);
      el.scope.$digest();

      expect(el.suggestions.find("li")[1].classList.contains("active")).toEqual(false);
      expect(el.suggestions.find("li")[0].classList.contains("active")).toEqual(true);

      // to the second
      el.input[0].dispatchEvent(e);
      el.scope.$digest();

      expect(el.suggestions.find("li")[0].classList.contains("active")).toEqual(false);
      expect(el.suggestions.find("li")[1].classList.contains("active")).toEqual(true);

      // click
      angular.element(el.suggestions.find("li")[0]).triggerHandler("click");
      el.scope.$digest();

      expect(el.suggestions[0].classList.contains("ng-hide")).toEqual(true);
      expect(el.scope.test.model).toEqual("foo");
    });
  });
});
