'use strict';

/* Directives */


angular.module('myApp.directives', [])
	.directive('appVersion', ['version', function(version) {
    	return function(scope, elm, attrs) {elm.text(version);};
  	}])
    .directive('dropdown', function () {
    return function (scope, elm, attrs) {
         $(elm).dropdown();
        };
    })
	.directive('buttonGroup', function(){
	  return {
	    restrict: 'E',
	    scope: {
	      states: '=',
	      state: '=',
	      onStateChange: '='
	    },
	    template: '<div class="btn-group">' +
	                '<button class="btn" ng-repeat="s in states" ng-click="select(s, $event)">' +
	                    '{{s}}' + 
	                '</button>' +
	            '</div>',
	    replace: true,
	    controller: function($scope, $element){

	        // Make sure that style is applied to initial state value
	        $scope.$watch(function () {
	            return $($element).find('.btn').length; // it checks if the buttons are added to the DOM
	        }, function (newVal) {
	            // it applies the selected style to the currently defined state, if any
	            if (newVal > 0) {
	                $($element).find('.btn').each(function(index, elm){
	                    if ($(elm).text() == $scope.state) $(elm).addClass('btn-primary');
	                });
	            }
	        }, true);

	        // Apply style changes according to selection
	        $scope.select = function(s, evt){  
	            $scope.state = s;

	            $($element).find('.btn').removeClass('btn-primary'); // reset styles on all buttons
	            angular.element(evt.srcElement).addClass('btn-primary'); // apply style only to selected button
	        };


	        // Execute callback if it was provided
	        $scope.$watch('state', function(){
	            if ($scope.onStateChange){
	              $scope.onStateChange();
	            }
	        }, true);
	    }
	  };
	});


