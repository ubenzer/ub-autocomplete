(function() {
  "use strict";
  angular.module("ubAutocomplete", [])
    .directive("ubAutocomplete", ubAutocomplete);

  function ubAutocomplete() {
    return {
      restrict: "E",
      scope: {
        source: "&",
        minLength: "=?", // optional
        maxSuggestions: "=?" // optional
      },
      require: ["ubAutocomplete", "ngModel"],
      controller: AutocompleteController,
      controllerAs: "ac",
      bindToController: true,
      templateUrl: "lib/autocomplete.html",
      // in production build, templateUrl above should be converted to a ng-template and concatted
      // into this file by a build system.
      link: function link(scope, iElement, iAttrs, controllers) {
        var ubAutocompleteController = controllers[0];
        var ngModelController = controllers[1];

        // we use standart ng-model pipeline. In this way, users will be able to use
        // ng-require ng-maxlength etc. to validate our autocomplete.
        ubAutocompleteController.initNgModel(ngModelController);

        angular.element(iElement[0].querySelector(".autocomplete-suggestions"))
          .bind("mousedown", function(event) {
            /* by preventing mousedown default in autocomplete suggestions div,
               we prevent blur of input, therefore preventing closing suggestions div.
            */
            event.preventDefault();
          });
      }
    };

    function AutocompleteController($q, $scope) {
      var vm = this; // vm stands for view model
      var suggestionCounter = 0; // int, explained bellow
      var hasFocus = false; // boolean, does autocomplete (directive in general) has focus?

      vm.inputFocus = inputFocus; // function() that runs when input box focused
      vm.inputBlur = inputBlur; // function() that runs when input box blurred
      vm.inputValue = ""; // string, value typed to input box
      vm.suggestionsVisible = false; // boolean, suggestions div is open (visible) or not
      vm.searchForSuggestions = searchForSuggestions; // function(), this can be invoked to initiate a search with the current input value
      vm.isBusy = false; // boolean, is there a async suggestion search in progress?
      vm.suggestions = []; // array of strings, suggestions to show on screen
      vm.select = select; // function(string), 'selects' the string, making it ng-model and input value
      vm.inputKeydown = inputKeydown; // function(event), run when there is a keydown event on input
      vm.activeSuggestion = null; // string OR null, one of the suggestions, which is "active" (highlighted by keyboard)
      vm.ngModel = null; // ngModelController, used to communicate out from directive to page.
      vm.initNgModel = initNgModel; // fuction(ngModelControllerInstance), used by linkFunction to initiate ngModel once.

      $scope.$watch("ac.inputValue", function(newValue) {
        // if input's model change, directive's model should change too.
        vm.ngModel.$setViewValue(newValue); // ui --> model
      });

      init(); // calculate defaults

      function inputKeydown(e) {
        if (!vm.suggestionsVisible) { return; }

        // 40 DOWN, 38 UP, 13 ENTER, 27 ESC
        if (e.keyCode === 27) {
          // ESC closes suggestions window.
          vm.suggestionsVisible = false;
          return;
        }

        if (e.keyCode === 13 && vm.activeSuggestion !== null) {
          // ENTER selectes current suggestion
          select(vm.activeSuggestion);
          return;
        }

        if (e.keyCode === 40) {
          // DOWN selectes the next selection
          selectSuggsetionNext();
          e.preventDefault(); // used to prevent cursor location change in input
          return;
        }

        if (e.keyCode === 38) {
          // UP selectes the next selection
          selectSuggsetionPrev();
          e.preventDefault(); // used to prevent cursor location change in input
          return;
        }
      }

      function selectSuggsetionNext() {
        if (vm.suggestions.length === 0) { return; }

        // Selects the next suggestion (first if there is none), rewinds if hits the end
        if (vm.activeSuggestion === null) {
          vm.activeSuggestion = vm.suggestions[0];
        } else {
          var nextIdx = (vm.suggestions.indexOf(vm.activeSuggestion) + 1) % vm.suggestions.length;
          vm.activeSuggestion = vm.suggestions[nextIdx];
        }
      }

      function selectSuggsetionPrev() {
        if (vm.suggestions.length === 0) { return; }

        // Selects the previous suggestion (last if there is none), forwards if hits the beginning
        if (vm.activeSuggestion === null) {
          vm.activeSuggestion = vm.suggestions[vm.suggestions.length - 1];
        } else {
          var prevIdx = vm.suggestions.indexOf(vm.activeSuggestion) - 1;
          if (prevIdx < 0) { prevIdx = vm.suggestions.length - 1; }
          vm.activeSuggestion = vm.suggestions[prevIdx];
        }
      }

      function select(suggestion) {
        // makes suggestion the active string, ending autocomplete selection.
        vm.suggestionsVisible = false;
        vm.inputValue = suggestion;
      }

      function initNgModel(ngModel) {
        // connect ng-model <-> directive, called by linkFunction
        vm.ngModel = ngModel;
        // specify model --> ui update
        vm.ngModel.$render = function() {
          vm.inputValue = vm.ngModel.$viewValue;
        };
      }

      function init() {
        // set defaults if not overriden by user
        if (!angular.isNumber(vm.minLength)) {
          vm.minLength = 0;
        }
        if (!angular.isNumber(vm.maxSuggestions)) {
          vm.maxSuggestions = 5;
        }
      }

      function inputBlur() {
        // if input blurs close autocomplete
        hasFocus = false;
        vm.suggestionsVisible = false;
      }

      function inputFocus() {
        // if input focuses try to suggest something
        hasFocus = true;
        searchForSuggestions();
      }

      function searchForSuggestions() {
        // if all conditions match, start an autocomplete search and show on UI
        if (vm.inputValue.length < vm.minLength) {
          // min length check
          vm.suggestionsVisible = false;
          return;
        }
        suggestionCounter++; // explained bellow
        var currentSearchNo = suggestionCounter;

        vm.isBusy = true; // if there is a search is ongoing we show it in UI by slightly dimming font colors.

        $q.when(vm.source({$keyword: vm.inputValue})) // be sure it is a promise by wrapping with when
          .then(function(suggestions) {
            /* If currentSearchNo and suggestionCounter does not equal, this means we are handling
              an aysnc response that doesn't belong to our latest query, but an old one (that probably
              took a very long time to load). We ignore it!

              Note: partially inspired from the source of ngInclude:
              https://github.com/angular/angular.js/blob/master/src/ng/directive/ngInclude.js#L194
            */
            if (currentSearchNo !== suggestionCounter) { return; }

            if (suggestions.length > vm.maxSuggestions) {
              // chop the unwanted ones
              suggestions.splice(vm.maxSuggestions, suggestions.length - vm.maxSuggestions);
            }

            if (!angular.equals(suggestions, vm.suggestions)) {
              // if suggestions are the same, we don't need to clear the active suggestion
              vm.activeSuggestion = null;
            }

            // update on screen, or hide them all if there is none
            if (suggestions.length > 0 && hasFocus) {
              vm.suggestions = suggestions;
              vm.suggestionsVisible = true;
            } else {
              vm.suggestionsVisible = false;
            }
          })
          .finally(function() {
            /* we remove isBusy in finally, insted of then, because if request fails for some reason
               we still need to remove loading indicator! */
            if (currentSearchNo !== suggestionCounter) { return; }
            vm.isBusy = false;
          });
      }
    }
  }
})();
