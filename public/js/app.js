'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
		when('/', {templateUrl: 'partials/index.html', controller: EntriesListCtrl }).
		when('/idea/new', {templateUrl: 'partials/idea-form.html', controller: IdeaFormCtrl }).
		when('/idea/edit/:id', {templateUrl: 'partials/idea-form.html', controller: IdeaFormCtrl }).
		when('/idea/:id', {templateUrl: 'partials/idea.html', controller: IdeaViewCtrl }).
		when('/idea/:id/vote', {templateUrl: 'partials/vote-form.html', controller: VoteFormCtrl }).
		when('/idea/:id/vote/:voteId', {templateUrl: 'partials/vote-form.html', controller: VoteFormCtrl }).
		otherwise({redirectTo: '/'});
      
  }]);


