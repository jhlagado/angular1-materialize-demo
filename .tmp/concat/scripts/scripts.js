'use strict';
/**
 * @ngdoc overview
 * @name appApp
 * @description
 * # appApp
 *
 * Main module of the application.
 */
angular.module('appApp', ['ngAnimate', 'ngCookies', 'ngResource', 'ngRoute', 'ngSanitize', 'ngTouch', 'angular1-materialize']).config(["$routeProvider", function($routeProvider) {
    $routeProvider.when('/', {
        redirectTo: '/buttons'
    }).when('/buttons', {
        templateUrl: 'views/buttons.html',
        controller: 'Generic',
    }).when('/chips', {
        templateUrl: 'views/chips.html',
        controller: 'Generic',
    }).when('/collapsible', {
        templateUrl: 'views/collapsible.html',
        controller: 'Generic',
    }).when('/dialogs', {
        templateUrl: 'views/dialogs.html',
        controller: 'Generic',
    }).when('/dropdown', {
        templateUrl: 'views/dropdown.html',
        controller: 'Generic',
    }).when('/forms', {
        templateUrl: 'views/forms.html',
        controller: 'Generic',
    }).when('/tabs', {
        templateUrl: 'views/tabs.html',
        controller: 'Generic',
    }).when('/datepicker', {
        templateUrl: 'views/datepicker.html',
        controller: 'Generic',
    }).otherwise({
        redirectTo: '/buttons'
    });
}]);

'use strict';
angular.module('appApp').controller('MainCtrl', ["$scope", "$route", "Materialize", function($scope, $route, Materialize) {
    
    $scope.Materialize = Materialize;

    $scope.isRouteActive = function(route) {
        var url = 'views' + route.url + '.html';
        return $route.current && $route.current.loadedTemplateUrl == url;
    }
    $scope.routes = [{
        url: '/buttons',
        name: 'Buttons'
    }, {
        url: '/chips',
        name: 'Chips'
    }, {
        url: '/collapsible',
        name: 'Collapsible'
    }, {
        url: '/dialogs',
        name: 'Dialogs'
    }, {
        url: '/dropdown',
        name: 'Dropdown'
    }, {
        url: '/forms',
        name: 'Forms'
    }, {
        url: '/tabs',
        name: 'Tabs'
    }, {
        url: '/datepicker',
        name: 'Date Picker'
    }, //     {
    //         url: '/modelbindings',
    //         name: 'Model Bindings'
    //     }
    ];
    $scope.chipsInit = {
        data: [{
            tag: 'Apple',
        }, {
            tag: 'Microsoft',
        }, {
            tag: 'Google',
        }],
    };
    $scope.chipsPlaceholder = {
        placeholder: '+Tag',
        secondaryPlaceholder: 'Enter a tag',
    };
    //forms
    $scope.firstName = "";
    $scope.selectedOption = "";
    $scope.selectOptions = [{
        value: 1,
        name: "Option 1"
    }, {
        value: 2,
        name: "Option 2"
    }, {
        value: 3,
        name: "Option 3"
    }]
    //dialogs

    var modalEmit, globalEmit;
    $scope.modalInit = function(emit) {
        modalEmit = emit;
    }
    $scope.globalInit = function(emit) {
        globalEmit = emit;
    }
    $scope.printSomething = function() {
        console.log("tooltip button clicked!");
    }
    $scope.triggerToast = function() {
        globalEmit('toast')
    }
    $scope.openModal = function() {
        modalEmit({
            action: "modal",
            params: ['open']
        });
    }
    $scope.closeModal = function() {
        modalEmit({
            action: "modal",
            params: ['close']
        });
    }
}]);

'use strict';

angular.module('appApp')
  .controller('Generic', function () {
  });

angular.module('appApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/buttons.html',
    "<a class=\"waves-effect waves-light btn\">Stuff</a> <a class=\"waves-effect waves-light btn\"><i class=\"material-icons left\">cloud</i>button</a> <a class=\"waves-effect waves-light btn\"><i class=\"material-icons right\">cloud</i>button</a> <br> <div class=\"fixed-action-btn horizontal click-to-toggle\" style=\"top: 24px; right: 24px\"> <a class=\"btn-floating btn-large red\"> <i class=\"large mdi-navigation-menu\"></i> </a> <ul> <li><a class=\"btn-floating red\"><i class=\"material-icons\">insert_chart</i></a></li> <li><a class=\"btn-floating yellow darken-1\"><i class=\"material-icons\">format_quote</i></a></li> <li><a class=\"btn-floating green\"><i class=\"material-icons\">publish</i></a></li> <li><a class=\"btn-floating blue\"><i class=\"material-icons\">attach_file</i></a></li> </ul> </div>"
  );


  $templateCache.put('views/chips.html',
    "<div class=\"chip\">Tag1<i class=\"close material-icons\">close</i></div> <div class=\"chip\">Tag2<i class=\"close material-icons\">close</i></div> <br><hr> <div class=\"chips\" materialize=\"material_chip\"></div> <div class=\"chips chips-initial\" materialize=\"material_chip\" materialize-params=\"[chipsInit]\"></div> <div class=\"chips chips-placeholder\" materialize=\"material_chip\" materialize-params=\"[chipsPlaceholder]\"></div> <br><hr>"
  );


  $templateCache.put('views/collapsible.html',
    "<ul materialize=\"collapsible\" class=\"collapsible\" data-collapsible=\"accordion\"> <li> <div class=\"collapsible-header\"><i class=\"material-icons\">filter_drama</i>First</div> <div class=\"collapsible-body\"><p>Lorem ipsum dolor sit amet.</p></div> </li> <li> <div class=\"collapsible-header\"><i class=\"material-icons\">place</i>Second</div> <div class=\"collapsible-body\"><p>Lorem ipsum dolor sit amet.</p></div> </li> <li> <div class=\"collapsible-header\"><i class=\"material-icons\">whatshot</i>Third</div> <div class=\"collapsible-body\"><p>Lorem ipsum dolor sit amet.</p></div> </li> </ul>"
  );


  $templateCache.put('views/datepicker.html',
    "<form materialize class=\"col s12\"> <div class=\"row\"> <div class=\"col s6\"> <label for=\"birthdate\">Birthdate</label> <input id=\"birthdate\" materialize=\"pickadate\" materialize-params=\"[{selectMonths: true, selectYears: 15}]\" type=\"text\"> </div> </div> </form>"
  );


  $templateCache.put('views/dialogs.html',
    "<!-- Modal Trigger --> <a class=\"waves-effect waves-light btn modal-trigger\" ng-click=\"openModal()\">Modal</a> <!-- Modal Structure --> <div id=\"modal1\" class=\"modal bottom-sheet\" materialize=\"modal\" materialize-params=\"[{dismissible: false}]\" materialize-init=\"modalInit(emit)\"> <div class=\"modal-content\"> <h4>Modal Header</h4> <p>A bunch of text</p> </div> <div class=\"modal-footer\"> <a class=\"waves-effect waves-green btn-flat\" ng-click=\"closeModal()\">Close</a> <a class=\"modal-action modal-close waves-effect waves-green btn-flat\">Agree</a> </div> </div> <!-- data-position can be : bottom, top, left, or right --> <!-- data-delay controls delay before tooltip shows (in milliseconds)--> <a materialize=\"tooltip\" ng-click=\"printSomething()\" class=\"btn tooltipped\" data-position=\"bottom\" data-delay=\"10\" data-tooltip=\"I am tooltip\">Hover me!</a> <br><br> <!-- toast --> <a class=\"btn\" ng-click=\"Materialize.toast('I am a toast', 4000)\">Toast 1!</a> <a class=\"btn\" ng-click=\"triggerToast()\" materialize materialize-params=\"['I am also a toast',4000]\" materialize-init=\"globalInit(emit)\">Toast 2!</a>"
  );


  $templateCache.put('views/dropdown.html',
    "<!-- Dropdown Trigger --> <a materialize=\"dropdown\" class=\"dropdown-button btn\" href=\"#\" data-activates=\"dropdown1\">Drop Me!</a> <!-- Dropdown Structure --> <ul id=\"dropdown1\" class=\"dropdown-content\"> <li><a>one</a></li> <li><a>two</a></li> <li class=\"divider\"></li> <li><a>three</a></li> </ul>"
  );


  $templateCache.put('views/forms.html',
    "<form materialize class=\"col s12\"> <div class=\"row\"> <div class=\"input-field col s6\"> <input ng-model=\"firstName\" name=\"firstName\" placeholder=\"Placeholder\" id=\"first_name\" type=\"text\" class=\"validate\"> <label for=\"first_name\">First Name</label> </div> <div class=\"input-field col s6\"> <input id=\"last_name\" type=\"text\" class=\"validate\"> <label for=\"last_name\">Last Name</label> </div> </div> <div class=\"row\"> <div class=\"input-field col s12\"> <input type=\"text\" name=\"autoComplete\" materialize=\"autocomplete\" materialize-params=\"[{'data': {'apple': null, 'google': null}}]\"> <label for=\"autoComplete\">Autocomplete (a/g)</label> </div> </div> <div class=\"row\"> <div class=\"input-field col s12\"> <input disabled value=\"I am not editable\" id=\"disabled\" type=\"text\" class=\"validate\"> <label for=\"disabled\">Disabled</label> </div> </div> <div class=\"row\"> <div class=\"input-field col s12\"> <input id=\"password\" type=\"password\" placeholder=\"\" class=\"validate\"> <label for=\"password\">Password</label> </div> </div> <div class=\"row\"> <div class=\"input-field col s12\"> <input id=\"email\" type=\"email\" class=\"validate\"> <label for=\"email\">Email</label> </div> </div> <div class=\"row\"> <div class=\"input-field col s6\"> <i class=\"material-icons prefix\">account_circle</i> <input id=\"icon_prefix\" type=\"text\" class=\"validate\"> <label for=\"icon_prefix\">First Name</label> </div> <div class=\"input-field col s6\"> <i class=\"material-icons prefix\">phone</i> <input id=\"icon_telephone\" type=\"tel\" class=\"validate\"> <label for=\"icon_telephone\">Telephone</label> </div> </div> <div class=\"row\"> <input materialize=\"pickadate\" type=\"date\" class=\"datepicker\"> </div> <div class=\"row\"> <div class=\"input-field col s12\"> <textarea id=\"textarea1\" class=\"materialize-textarea\"></textarea> <label for=\"textarea1\">Textarea</label> </div> </div> <div class=\"row\"> <div class=\"input-field col s6\"> <select ng-model=\"selectedOption\" name=\"selectedOption\" materialize=\"material_select\" materialize-select-options=\"selectOptions\"> <option value=\"\" disabled selected>Choose your option</option> <option ng-repeat=\"option in selectOptions\" value=\"{{option.value}}\">{{option.name}}</option> </select> <label>Materialize Select</label> </div> <div class=\"input-field col s6\"> <select multiple materialize=\"material_select\" materialize-select-options=\"selectOptions\"> <option value=\"\" disabled selected>Choose your option</option> <option ng-repeat=\"option in selectOptions\" value=\"{{option.value}}\">{{option.name}}</option> </select> <label>Materialize Multi Select</label> </div> </div> <div class=\"row\"> <div class=\"col s6 switch\"> <label> Off <input type=\"checkbox\"> <span class=\"lever\"></span> On </label> </div> </div> </form> <br><hr><hr><br> <div class=\"row\"> <div class=\"col s6\">First Name: {{firstName}}</div> </div> <div class=\"row\"> <div class=\"col s6\">Selected Option: {{selectedOption}}</div> </div>"
  );


  $templateCache.put('views/index.html',
    "export { SideNav } from \"./side-nav\"; export { Forms } from \"./forms\"; export { Tabs } from \"./tabs\"; export { TabsRouting } from \"./tabs-routing\"; export { Dialogs } from \"./dialogs\"; export { Dropdown } from \"./dropdown\"; export { Collapsible } from \"./collapsible\"; export { Buttons } from \"./buttons\"; export { Chips } from \"./chips\"; export { DatePicker } from \"./datepicker\"; export { ModelBindings } from \"./model-bindings/model-bindings\";"
  );


  $templateCache.put('views/side-nav.html',
    "<style>nav {\r" +
    "\n" +
    "          width: 200px;\r" +
    "\n" +
    "      }\r" +
    "\n" +
    "      li.active {\r" +
    "\n" +
    "        background-color: #ee6e73\r" +
    "\n" +
    "      }</style> <nav> <ul id=\"slide-out\" class=\"side-nav\"> <li ng-repeat=\"route in routes\"><a ng-href=\"{{route.url}}\">{{route.name}}</a></li> </ul> </nav> <a href=\"#\" data-activates=\"slide-out\" class=\"button-collapse show-on-large\"><i class=\"material-icons\">menu</i></a>"
  );


  $templateCache.put('views/tabs.html',
    "<div class=\"row\"> <div class=\"col s12\"> <ul class=\"tabs\" materialize=\"tabs\"> <li class=\"tab col s3\"><a href=\"#test1\">Test 1</a></li> <li class=\"tab col s3\"><a class=\"active\" href=\"#test2\">Test 2</a></li> <li class=\"tab col s3 disabled\"><a href=\"#test3\">Disabled Tab</a></li> <li class=\"tab col s3\"><a href=\"#test4\">Test 4</a></li> </ul> </div> <div id=\"test1\" class=\"col s12\">Test 1</div> <div id=\"test2\" class=\"col s12\">Test 2</div> <div id=\"test3\" class=\"col s12\">Test 3</div> <div id=\"test4\" class=\"col s12\">Test 4</div> </div>"
  );

}]);
