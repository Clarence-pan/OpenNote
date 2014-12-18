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
	window.$s = $scope;
	
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

            $('body').trigger('note.edit');
		});	
	};

    $scope.theMdEditorTextArea = null;
    $('body').on('note.loaded', function(){
	$scope.theMdEditorTextArea && $scope.theMdEditorTextArea.remove();
        $scope.theMdEditorTextArea = null;
	$scope.epicEditor && $scope.epicEditor.remove();
	$scope.epicEditor = null;
    });

    /**
     * Take us into edit mode
     */
    var activateEditMode_md = function(options){
        $scope.editMode=true;
        options = $.extend({
            initialPreview: false
        }, options);
        if ($scope.theMdEditorTextArea){
            return;
        }
        $('#note').css('height', Math.max(400, $(window).height()-290)+'px');
        if (!options.content){
            var content = $('#note').html();
            var target = $('#note').empty();
        }else{
            var content = options.content;
            var target = $("#note").hide().clone().show().removeAttr('id').insertBefore('#note');
            setTimeout(function(){
                $('#note').empty().hide();
            }, 3000);
        }
        var textArea = $('<textarea class="note-md-editor"></textarea>').insertAfter(target);
        textArea.val(content).text(content);
        $scope.theMdEditorTextArea = textArea; // this textArea would be used to ge the value of the content
	$('#note').siblings('.tip').remove();
        $('<div class="tip">Shortcuts: ALT-Q to toggle preview, ALT-F to toggle fullscreen.</div>').insertAfter('#note');
        serverConfigService.getEditorConfig().then(function(config){


            if($scope.note.id !=null)
                $scope.showDeleteButton = true;

            var epicEditor = $scope.epicEditor = new EpicEditor({
                container: target.get(0),
                textarea: textArea.get(0),
                basePath: 'openNote/EpicEditor',
                theme: {
                    base: '/themes/base/epiceditor.css',
                    editor: "/themes/editor/epic-light.css" ,
                    preview: "/themes/preview/github.css"
                },
                shortcut: {
                    preview: 81
                },
                button: {
                    bar: true
                }
            }).load();

            if (options.initialPreview){
                epicEditor.preview();
            }

            $rootScope.buttons=[];

            attachWindowUnload();

            //Add new buttons
            $rootScope.buttons.push(saveButton());
            $rootScope.buttons.push(clearButton());

            $('body').trigger('note.edit');
        });
    };
	
	//Load or new
    if($routeParams.id==null){//new
        $scope.note.id = null;
        $scope.note.folderID = $location.search().folderID;
        $scope.note.title = "Note Title";

        activateEditMode();
        $(".notePartial").fadeIn(config.fadeSpeedLong());
        $('body').trigger('note.new');
    }
    else{
        /**
         * Load folder contents
         */
        $scope.note.$get({id:$routeParams.id}).then(function(note){
            $(".notePartial").fadeIn(config.fadeSpeedLong());
            $('body').trigger('note.loaded');
            if (/^#/.test(note.note || '') ){ // it's a markdown
                activateEditMode_md({initialPreview: true, content: note.note});
            }
        });

        //Add buttons
        $rootScope.buttons.push({
            text: "Edit",
            action: function(){
                activateEditMode();
            },
            helpText: $rootScope.helpContent.editButton
        },{
            text: "Edit.md",
            action: function(){
                activateEditMode_md()
            },
            helpText: "Edit with markdown editor"
        });

        $('body').trigger('note.load');
    }

    function getNoteContentFromEditor(){
        if (!$scope.theMdEditorTextArea){
            return CKEDITOR.instances["note"].getData();
        } else {
            return $scope.theMdEditorTextArea.val();
        }
    }
		
	/** 
	 * Save a note
	 */
	$scope.save = function(){
		$scope.note.note = getNoteContentFromEditor();
		
		//Insert only logic
			if($scope.note.originNoteID == null)
				$scope.note.originNoteID=$scope.note.id;//Make this not a child of the one we opened
		
		$(".notePartial").fadeOut(config.fadeSpeedShort());
		$scope.note.$save().then(function(){
			detachWindowUnload();
			$location.url("/note/"+$scope.note.id)
			alertify.success("Note Saved"); //all done. close the notify dialog 
		});

        $('body').trigger('note.save');
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


    $('body').on('note.load',function(e){
//        console.log(e.type);
    })
    $('body').on('note.new',function(e){
//        console.log(e.type);
    })

    $('body').on('note.loaded', function(){
        $("#note").on('dblclick', function(){
//            $('button').filter(function(){ return $(this).text() == 'Edit';}).trigger('click');
            activateEditMode_md();
            window.document.getSelection().empty();
        });
    })

    function preventCtrlSAndSaveIt(e){
        if ((e.keyCode == 83) && e.ctrlKey){ // CTRL + S:
            // if the ckeditor is fullscreen, restore it. otherwise the layout will be broken.
            if ($('.cke_button__maximize').is('.cke_button_on')){
                CKEDITOR.instances['note'].execCommand('maximize');
            }
            //save to the server;
            $('button').filter(function(){ return $(this).text() == 'Save';}).trigger('click');

            // prevent default saving
            e.cancelBubble = true;
            e.preventDefault();
            return false;
        }
    }

    window.onkeydown = preventCtrlSAndSaveIt;

    $('body').on('note.edit', function(){
        var i = 0;
        var timer = setInterval(
            function(){
                $('iframe').each(function(i,w){
                    w.contentWindow.onkeydown = preventCtrlSAndSaveIt;
                });
                i++;
                if (i>10){
                    clearInterval(timer);
                }
            },
            500 // ms
        );
    })
});
