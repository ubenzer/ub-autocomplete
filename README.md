# ub-autocomplete
A basic autocomplete library based on **Angular.js 1.4.x**

## Demo
[Click here to see it in action!](https://ubenzer.github.io/ub-autocomplete)

## How to setup
Include `ubAutocomplete.js` in your web page after angular.js.
```html
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular.min.js"></script>
<script src="lib/ubAutocomplete.js"></script>
```

If you don't want to customize the looks and want the defaults, include `ubAutocomplete.css` in your page's header.
```html
<link href="lib/ubAutocomplete.css" media="all" rel="stylesheet" />
```

Add dependency to the module named `ubAutocomplete`.
```javascript
angular.module("your-app", ["ubAutocomplete"]);
```

Use it using `ub-autocomplete` in your html!
```html
<ub-autocomplete ng-model="demo.ac1" source="demo.staticSourceDemo($keyword)"></ub-autocomplete>
```

## How to use
All available attributes for this directive is used in the following example:
```html
<ub-autocomplete
  ng-model="demo.model"
  ng-required="true"
  min-length="3"
  max-suggestions="10"
  source="demo.someSource($keyword)"></ub-autocomplete>
```

### ng-model
`ng-model` is used to bind the screen value to the underlying `$scope`.

### ng-required
This directive supports `ng-form` validations since it is using `ngModelController` to modify scope data. This means you can use `ng-required`, `ng-maxlength` etc. with the form validation system of Angular.js!

### min-length
Minimum character count required to be typed before initiating a autocomplete lookup search. If you specify 0, it means you'll be recommended something even without typing anything.

### max-suggestions
Determines to max autocomplete entries to be shown.

### source
Source is the underlying search function that the directive uses to fetch results. This function called by the directive when needed to fetch autocomplete results. A special parameter `$keyword` is passed to this function, this is the keyword that is typed to the input.

As a result, a promise of array of strings OR an array of strings is expected. Returning a promise enables user to go any kind of data source async and fetch results from 3rd parties.

**You should not return duplicate values in array. It is source function's responsibility to clear duplicate data!**

```html
<ub-autocomplete ng-model="result" source="source($keyword)"></ub-autocomplete>
```

Sync example:
```javascript
  $scope.source = function(keyword) {
    // do some stuff with keyword and return array of strings
    return ["Result1", "Result2"];
  }
```

Async example:
```javascript
  $scope.source = function(keyword) {
    // do an async request with the keyword
    var promise = $http.get("search", {params:keyword})
      .then(function(response) {
        return response.data;
      });
    return promise; // and return a promise that'll be fulfilled in the future
  }
```

## Running
To run development web server type `npm start`

To run tests type `npm test`

## Code Documentation
There are comments embedded into the source code.

### To do
0. **Create a gulpfile that runs eslint, nghtml2js, uglify and writes output to dist folder as a single file.**
1. Add ng-disabled support
2. Add some animations
3. Publish on bower and npm.
4. Setup travis.
5. Move default config into a config block, so it can be overriden app wide.

### Contributing
Just open an issue or create a pull request. You can pick one from the Todo list above.
