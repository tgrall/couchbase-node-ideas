'use strict';

/* Controllers */


function AppCtrl($scope, $http) {
	$scope.user = null;
}
AppCtrl.$inject = ['$scope', '$http'];


function NavBarController($scope) {
}
NavBarController.$inject = ['$scope'];

function EntriesListCtrl($scope, $http) {
	$http({method: 'GET', url: '/api/results' }).success(function(data, status, headers, config) {			
			$scope.entries = data;
		})
		.error(function(data, status, headers, config) {
	    		$scope.name = 'Error!'
	  		});
}
EntriesListCtrl.$inject = ['$scope', '$http'];

function IdeaViewCtrl($rootScope, $scope, $routeParams, $http, $location) {
	$scope.numberOfVote = 0;	
	$http({method: 'GET', url: '/api/idea/'+ $routeParams.id }).success(function(data, status, headers, config) {			
			$scope.entry = data;
		})
		.error(function(data, status, headers, config) {
	    		$scope.name = 'Error!'
		});
	$http({method: 'GET', url: '/api/votes/'+ $routeParams.id }).success(function(data, status, headers, config) {			
			$scope.votes = data;
			$scope.numberOfVote = data.length;
		})
		.error(function(data, status, headers, config) {
	    		$scope.name = 'Error!'
		});	

	$scope.delete = function(vote) {
		$http.delete('/api/vote/'+ vote.id).success(function(data) {
			// remove the data from the vote list
			for (var i in $scope.votes) {
				if ( $scope.votes[i] == vote ) {
					$scope.votes.splice(i, 1);
					$scope.numberOfVote = $scope.numberOfVote -1;
				}
			}
		});
	}
}
IdeaViewCtrl.$inject = ['$rootScope', '$scope', '$routeParams','$http', '$location'];

function VoteFormCtrl($rootScope, $scope, $routeParams, $http, $location) {	
	
  $scope.ratings = [
	{
  	"id": 0,
  	"label": "0 - No Interest",
	},
  	{
    	"id": 1,
    	"label": "1 - Low Interest",
  	},
  	{
    	"id": 2,
    	"label": "2 - Medium",
  	},
  	{
    	"id": 3,
    	"label": "3 - Good",
  	},
  	{
    	"id": 4,
    	"label": "4 - Outstanding",
  	}, 
  	{
    	"id": 5,
    	"label": "5 - Must be done. Now!",
  	}];
	
	
	$http({method: 'GET', url: '/api/idea/'+ $routeParams.id }).success(function(data, status, headers, config) {			
			$scope.entry = data;
		})
		.error(function(data, status, headers, config) {
	    		$scope.name = 'Error!'
				console.log("Error in VoteFormCtrl");
		});
	
	// if a parameter exit we should load the vote
	if ($routeParams.voteId) {
		$http({method: 'GET', url: '/api/vote/'+ $routeParams.voteId }).success(function(data, status, headers, config) {			
			$scope.vote = data;
		})
		.error(function(data, status, headers, config) {
	    		$scope.name = 'Error!'
				console.log("Error in VoteFormCtrl");
		});
	}

	if ($scope.entry == null) {
	 	$scope.entry = {rating : 0}
	}
			
	$scope.save = function() {			
		$scope.vote.type = "vote";
		$scope.vote.user_id = $scope.user;
		$scope.vote.idea_id = $routeParams.id;
		$http.post('/api/vote',$scope.vote).success(function(data) {
			$location.path('/idea/'+ $routeParams.id );
		});
	}
		
}
VoteFormCtrl.$inject = ['$rootScope', '$scope', '$routeParams','$http', '$location'];


/**
 * Manage the Creation & Edit of ideas
 */
function IdeaFormCtrl($rootScope, $scope, $routeParams, $http, $location) {
	$scope.idea = null;
	if ($routeParams.id ) {
		$http({method: 'GET', url: '/api/idea/'+ $routeParams.id }).success(function(data, status, headers, config) {			
				$scope.idea = data;
			});
	}

	$scope.save = function() {			
		$scope.idea.type = "idea"; // set the type
		$scope.idea.user_id = $scope.user;
		$http.post('/api/idea',$scope.idea).success(function(data) {
			$location.path('/');
		});
	}
	$scope.cancel = function() {
		$location.path('/');
	}
	
}
IdeaFormCtrl.$inject = ['$rootScope', '$scope', '$routeParams','$http', '$location'];

