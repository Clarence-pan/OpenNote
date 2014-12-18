/**
 * @author - Jake Liscom 
 * @project - OpenNote
 */

/**
 * controller for note creation, editing and maintance
 */
openNote.controller("noteController", function(	$scope, $rootScope, $routeParams, $location, $routeParams, 
												noteFactory, config, serverConfigService, $sce) {
	$rootScope.buttons=[];
	$scope.note = new noteFactory();
	$scope.editMode = false;
	$scope.showDeleteButton = false;
	
	/**
	 * Returns the save buttons object
	 */
	var saveButton = function(){
		return {
			text: "Save",
			action: function(){
				$scope.save();
			},
			helpText: $rootScope.helpContent.saveButton
		};
	};
	
	/**
	 * return the clear button
	 */
	var clearButton = function(){
		return {
			text: "Clear",
			action: function(){
				$scope.clear();
			},
			helpText: $rootScope.helpContent.clearButton
		};
	};
	
	/**
	 * Take us into edit mode
	 */
	var activateEditMode = function(){		
		serverConfigService.getEditorConfig().then(function(config){
			$scope.editMode=true;
			
			if($scope.note.id !=null)
				$scope.showDeleteButton = true;
			
			CKEDITOR.replace("note", config);
			$rootScope.buttons=[];
			
			attachWindowUnload();
			
			//Add new buttons
				$rootScope.buttons.push(saveButton());
				$rootScope.buttons.push(clearButton());
		});	
	};
	
	//Load or new
		if($routeParams.id==null){//new
			$scope.note.id = null;
			$scope.note.folderID = $location.search().folderID;
			$scope.note.title = "Note Title";
			
			activateEditMode();
			$(".notePartial").fadeIn(config.fadeSpeedLong());
		}
		else{
			/**
			 * Load folder contents
			 */
			$scope.note.$get({id:$routeParams.id}).then(function(note){
				$(".notePartial").fadeIn(config.fadeSpeedLong());
			});
			
			//Add buttons
				$rootScope.buttons.push({
					text: "Edit",
					action: function(){
						activateEditMode();
					},
					helpText: $rootScope.helpContent.editButton
				});
		}
		
	/** 
	 * Save a note
	 */
	$scope.save = function(){
		$scope.note.note = CKEDITOR.instances["note"].getData();
		
		//Insert only logic
			if($scope.note.originNoteID == null)
				$scope.note.originNoteID=$scope.note.id;//Make this not a child of the one we opened
		
		$(".notePartial").fadeOut(config.fadeSpeedShort());
		$scope.note.$save().then(function(){
			detachWindowUnload();
			$location.url("/note/"+$scope.note.id)
			alertify.success("Note Saved"); //all done. close the notify dialog 
		});
		
	}
	
	/**
	 * Delete a note
	 */
	$scope.delete = function(){
		alertify.confirm("Are you sure you want to delete this note?",
			function(confirm) {	
				if(!confirm)
					return;
				
				var folderID = $scope.note.folderID;//need to keep track of this because we are about to delete it
				$(".notePartial").fadeOut(config.fadeSpeedShort());
				$scope.note.$remove({id: $scope.note.id}).then(function(){
					detachWindowUnload();
					alertify.success("Note Deleted",5); //all done. close the notify dialog 
					$location.url("/folder/"+folderID);
				});
			}
		);
	}
	
	/**
	 * Reset changes
	 */
	$scope.clear = function(){
		alertify.confirm("Are you sure you want to clear your changes?",
			function(confirm) {
				if(!confirm)
					return;
				
				$(".notePartial").fadeOut(config.fadeSpeedShort(),function(){
					$scope.$apply(function(){
						detachWindowUnload();
						$location.url("/folder/"+$scope.note.folderID);
					});
				});
			});
	};
	
	/**
	 * Mark html as trusted
	 */
	$scope.trustHTML = function(html) {
	    return $sce.trustAsHtml(html);
	}
	
	/**
	 * Attach window on-load listener 
	 */
	var attachWindowUnload = function(){
		window.onbeforeunload = function() {
            return "Are you sure you want to navigate away?";//Keep the page from closing
		};
	}
	
	/**
	 * Remove window on-load listener 
	 */
	var detachWindowUnload = function(){
		window.onbeforeunload = null;
	}
});

$(function(){
    setInterval(function(){
        $('iframe').add(window).each(function(i,w){
            w = w.contentWindow || w;
            w.onkeydown = function(e){
                if ((e.keyCode == 83) && e.ctrlKey){ // CTRL + S:
                    //save to the server;
                    $('button').filter(function(){ return $(this).text() == 'Save';}).trigger('click');

                    // prevent default saving
                    e.cancelBubble = true;
                    e.preventDefault();
                    return false;
                }
            }
        })
    }, 3000);
});