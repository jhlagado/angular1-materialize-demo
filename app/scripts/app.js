'use strict';
/**
 * @ngdoc overview
 * @name appApp
 * @description
 * # appApp
 *
 * Main module of the application.
 */
angular.module('appApp', ['ngAnimate', 'ngCookies', 'ngResource', 'ngRoute', 'ngSanitize', 'ngTouch', 'angular1-materialize']).config(function($routeProvider) {
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
});
