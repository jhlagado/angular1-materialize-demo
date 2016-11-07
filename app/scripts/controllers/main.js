'use strict';
angular.module('appApp').controller('MainCtrl', function($scope, $route, Materialize) {
    
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
});
