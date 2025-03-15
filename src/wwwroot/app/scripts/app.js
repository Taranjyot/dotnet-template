'use strict';
angular.module('todoApp', ['ngRoute'])
.config(['$routeProvider', '$httpProvider', '$locationProvider', function ($routeProvider, $httpProvider, $locationProvider) {

    $locationProvider.hashPrefix('');

    // disable IE ajax request caching
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';

    $routeProvider.when("/Home", {
        controller: "todoListCtrl",
        templateUrl: "app/views/TodoList.html",
    }).otherwise({ redirectTo: "/Home" });

    }]);