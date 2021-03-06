/**
 * Connects the the rest service to get user details 
 */
openNote.service("userService", function ($http, $q, config) {
	
	/**
	 * @return - raw token object
	 */
	this.getAPITokenObject = function(){
		return angular.fromJson(sessionStorage.apiToken);
	};
	
	/**
	 * tell httpd to use our token in requests
	 */
	this.useAPITokenHeader = function(){
		$http.defaults.headers.common["token"] = this.getAPITokenString();//used by the resources implicitly
		
		document.cookie="token="+this.getAPITokenString()+"; path=/;"; //This is the download token, it is used for pulling files
	}
	
	/**
	 * Stop using a token
	 */
	this.destroyTokenHeader = function(){
		$http.delete(config.servicePath() +"/token/");//have the server delete it
		
		delete sessionStorage.apiToken; 
		document.cookie = "token=;  path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
	}
	
	/**
	 * Is token valid?
	 * @return - true if token is still valid
	 */
	this.hasValidToken = function(){
		var tokenObject = this.getAPITokenObject();
		if(tokenObject!=null){
			var tokenTime = tokenObject.expires.replace(" ","T");//convert to ISO-8601 date and time
			return new Date().getTime()< Date.parse(tokenTime);//UTC time
		}
	
		return false;
	};
	
	/**
	 * @return - the apiToken 
	 */
	this.getAPITokenString = function(){
		var tokenObject = this.getAPITokenObject();
		if(tokenObject!=null)
			return tokenObject.token;
		return null;
	};
	
	/**
	 * Checks is a user is available
	 * @param userName - the username to check 
	 * @return - true if available, false if not
	 */
	this.isAvailable = function(userName){ 	
		return $http.get(config.servicePath() +"/user/"+userName).then(function(response){
					throw "Error"; // Weirdly if we get a 2xx value its a failure
				},function(response){
					switch(response.status){
			  			case 302://we found it so its not available
			  				return false;
			  				
			  			case 404://could not find it so its available
			  				return true; 
			  				
			  			default://there was a error
			  				throw "Error";
					};
				});
	};
	
	/**
	 * Logs the user in
	 * @param userName - the username to login with 
	 * @param password - the password to login with
	 * @return - true if successful, false if not
	 */
	this.login = function(userName, password){ 	
		var self = this;
		return $http.post(config.servicePath() +"/token/"+userName+"&"+password).then(
		function(response){//Successful
			if(response.status==200){
				
				if(response.data.token==null)
					throw "Invalid response from server";
				
				sessionStorage.apiToken=angular.toJson(response.data);
				self.useAPITokenHeader();//used by the resources implicitly
				return true;	
			}
		},
		function(response){
			return false;
		});
	};
	
	/**
	 * Registers the user
	 * @param userName - the username to register with 
	 * @param password - the password to register with
	 * @return - true if successful, false if not
	 */
	this.register = function(userName, password){ 	
		var self = this;
		return $http.post(config.servicePath() +"/user/"+userName+"&"+password).then(
			function(response){//Successful
				if(response.status==200){
					
					if(response.data.token==null)
						throw "Invalid response from server";
					
					sessionStorage.apiToken=angular.toJson(response.data);
					self.useAPITokenHeader();//used by the resources implicitly
					return true;	
				}
			},
			function(response){//non 200 response
				return false;
			});
	};
	
});