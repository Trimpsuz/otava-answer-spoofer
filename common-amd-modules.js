define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/gamification', ['./utils', './material'], function(utils, material) {
	
	/**
	 Contains functions for interacting with Cloubi's gamification features.
	 <br><br>
	 These function are intended to be used within materials. If used outside materials, make sure to always manually provide material IDs.
	 <br><br>
	 
	 To use this API, load it like this:
	 
	 <pre><code>
	require(['fi.cloubi.frontend/gamification'], function(gamification) {
		gamification.isEnabled().then( function(enabled) {
			if (enabled) console.log("Gamification is enabled");
			else console.log("Gamification is disabled");
		});
	});
	 </code></pre>
	 
	 * @namespace gamification */
	
	/**An array of errors encountered while executing a request.
	 * All gamification functions except isEnabled will return the error "no-such-realm" if the function is called for a material
	 * that does not have gamification features enabled.
	 * @memberof gamification
	 * @typedef {Array} Error*/
	
	/**Represents an achievement that the player can level up by meeting certain criteria.
	 * @memberof gamification
	 * @typedef {Object} Achievement
	 * @property {string} id									The ID of this achievement
	 * @property {string} title 								The name of this achievement
	 * @property {string} description							The description of this achievement
	 * @property {string} [group]								The name of the achievement group this achievement belongs to (if any)
	 * @property {number} level									The user's current level number in this achievement. 
	 * 															Level 0 means that the achievement has not yet been unlocked.
	 * @property {gamification.AchievementLevel} currentLevel	The data of the user's current level in this achievement.
	 * @property {gamification.AchievementLevel} [nextLevel]	The data of the user's next level in this achievement, if any.*/
	
	/**Represents a single level in an achievement. Each level must be unlocked separately and has its own unlock criteria.
	 * @memberof gamification
	 * @typedef {Object} AchievementLevel
	 * @property {string} title			The name of this level
	 * @property {string} description	The description of this level
	 * @property {string} awardText		Text that should be shown to the user when this level is unlocked
	 * @property {string} [badgeImage]	A download URL for a small image representing this level
	 * @property {string} [largeImage]	A download URL for a large image representing this level*/
	
	/**An avatar that the player may select to represent themselves.
	 * @memberof gamification
	 * @typedef {Object} Avatar
	 * @property {string} id			The ID of this avatar
	 * @property {string} name			The default name of this avatar
	 * @property {string} description	A description of this avatar
	 * @property {string} [largeImage]	A download URL for a large image representing this avatar
	 * @property {string} [markerImage]	A download URL for a small image representing this avatar*/
	
	/**Contains the status of the current user
	 * @memberof gamification
	 * @typedef {Object} Player
	 * @param {string} name					The player's name
	 * @param {boolean} hasAvatar			True if the player has chosen an avatar
	 * @property {string} [largeImage]		A download URL for a large image representing the player's avatar
	 * @property {string} [markerImage]		A download URL for a small image representing the player's  avatar
	 * @property {Array<String>} overlays	An array of download URLs to images that should be drawn over the player's avatar*/
	
	
	var BASE_URL="/o/gamification/";	
	var PARAM_MATERIAL = "materialId";
	
	var enabledMaterials = {};
	
	/**Checks whether gamification features have been enabled for the specified product
	 * @memberof gamification
	 * @param {string} [materialId=Current material ID]	The ID of the material to check
	 * @return {Promise<boolean, gamification.Error>}	Resolves to true if gamification is enabled, false otherwise*/
	function isEnabled(materialId){
		var cacheKey = materialId || material.getCurrentMaterialId();
		if ( enabledMaterials[cacheKey] ) {
			return enabledMaterials[cacheKey]; 
		} else {
			var promise = _postWithPromise("enabled", materialId, {}, function(d, result) {
				if (result.enabled){
					d.resolve(true);
				}
				else {
					d.resolve(false);
				}
			});
			enabledMaterials[cacheKey] = promise;
			return promise;
		}
	}
	
	/**Loads all achievements that are currently visible to the player in the specified material
	 * @memberof gamification
	 * @param {string} [materialId=Current material ID]	The ID of the material
	 * @return {Promise<Array<gamification.Achievement>, gamification.Error>}	Resolves to an array of achievements in the current material*/
	function getAchievements(materialId){
		return _doGetAchievements("achievements", materialId);
	}
	
	/**Loads all achievements that the player has unlocked but have not yet been marked as shown. Note that this does not perform checks to see
	 * if any new achievements have been unlocked, use {@link gamification.checkAchievements} to also check for new achievements.
	 * @memberof gamification
	 * @param {string} [materialId=Current material ID]	The ID of the material
	 * @return {Promise<Array<gamification.Achievement>, gamification.Error>}	Resolves to an array of pending achievements*/
	function getPendingAchievements(materialId){
		return _doGetAchievements("pending-achievements", materialId);
	}
	
	/**Checks if any new achievements have been unlocked and then loads all achievements that the player has unlocked but have not yet been 
	 * marked as shown. To load pending achievements without checking for new ones, use {@link gamification.getPendingAchievements}
	 * @memberof gamification
	 * @param {string} [materialId=Current material ID]	The ID of the material
	 * @return {Promise<Array<gamification.Achievement>, gamification.Error>}	Resolves to an array of pending achievements*/
	function checkAchievements(materialId){
		return _doGetAchievements("check-achievements", materialId);
	}
	
	/**Common handler for functions that return achievements*/
	function _doGetAchievements(action, materialId){
		return _postAndHandleSuccess(action, materialId, {}, "achievements");
	}
	
	/**Marks achievements as notified, so that they will no longer appear in the user's list of pending achievements
	 * @memberof gamification
	 * @param {Array<String>} achievements				An array of achievement IDs
	 * @param {string} [materialId=Current material ID]	The ID of the material
	 * @return {Promise<undefined, gamification.Error>}	Resolves when the request has been executed*/
	function markAchievements(achievements, materialId){
		return _postAndHandleSuccess("mark-achievements", materialId, {achievements: achievements});
	}
	
	/**Loads all avatars in the specified material
	 * @memberof gamification
	 * @param {string} [materialId=Current material ID]	The ID of the material
	 * @return {Promise<Array<gamification.Avatar>, gamification.Error>}	Resolves to an array of avatars in the current material*/
	function getAvatars(materialId){
		return _postAndHandleSuccess("avatars", materialId, {}, "avatars");
	}
	
	/**Gets current player status in the specified material
	 * @memberof gamification
	 * @param {string} [materialId=Current material ID]	The ID of the material
	 * @return {Promise<gamification.Player, gamification.Error>}	Resolves to the current player status*/
	function getPlayerStatus(materialId){
		return _postAndHandleSuccess("player-status", materialId, {}, "player");
	}
	
	/**Sets the player's avatar in the specified material
	 * @memberof gamification
	 * @param {string} name								The name that the player has chosen
	 * @param {string} avatarId							The ID of avatar that the player has chosen
	 * @param {string} [materialId=Current material ID]	The ID of the material
	 * @return {Promise<undefined, gamification.Error>}	Resolves when the request has been executed*/
	function setAvatar(name, avatarId, materialId){
		return _postAndHandleSuccess("set-avatar", materialId, {name: name, avatar: avatarId});
	}
	
	/**Posts an action, resolves the promise with a specified result field or rejects with any errors from the server
	 * @param resultFieldName	The name of the field in the result object that should be used to resolve the promise*/
	function _postAndHandleSuccess(action, materialId, data, resultFieldName){
		return _postWithPromise(action, materialId, data, function(d, result) {
			if (result.success){
				if (resultFieldName){
					d.resolve(result[resultFieldName]);
				}
				else {
					d.resolve();
				}
			}
			else {
				d.reject(result.errors);
			}
		});
	}
	
	/**Posts an AJAX call to the gamification endpoint and returns a promise
	 * @param action		The name of the action that should be invoked
	 * @param materialId	The material ID to send (default: current material ID)
	 * @param data			The data to send
	 * @param processor		A callback function to process the response. Receives the Deferred object of the promise as well as the server response
	 * 						as parameters and should either reject or resolve the Deferred based on the response data.*/
	function _postWithPromise(action, materialId, data, processor){
		var deferred = new $.Deferred();
		data[PARAM_MATERIAL] = materialId || material.getCurrentMaterialId();
		utils.post(BASE_URL + action, data, function(result){
			processor(deferred, result);
		},
		function(error){
			deferred.reject([error]);
		})
		return deferred.promise();
	}
	
	return {
		isEnabled: isEnabled,
		getAchievements: getAchievements,
		getPendingAchievements: getPendingAchievements,
		checkAchievements: checkAchievements,
		markAchievements: markAchievements,
		getAvatars: getAvatars,
		getPlayerStatus: getPlayerStatus,
		setAvatar: setAvatar
	}
	
});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/notes', ['./utils', './material'], function(utils, material) {
	
	/**
	 Contains functions for loading and manipulating user notes.
	 <br><br>
	 These function are intended to be used within materials. If used outside materials, make sure to always manually provide material and page IDs
	 <br><br>
	 
	 To use this API, load it like this:
	 
	 <pre><code>
	require(['fi.cloubi.frontend/notes'], function(notes) {
		notes.getNotesForPage(function(response) {
			console.log(response);
		});
	});
	 </code></pre>
	 
	 * @namespace notes */
	
	/**Represents a single note object. Topic, data, material and page are only included if the note was requested with includeExtra = true.
	 * @memberof notes
	 * @typedef {Object} Note
	 * @property {string} id			The unique ID of the note
	 * @property {string} time			A human-readable string describing when the note was last modified
	 * @property {string} text			The text content of the note
	 * @property {string} [topic]		The topic of the note
	 * @property {Object} [data]		Extra JSON data stored with the note
	 * @property {Number} [material]	The ID of the material containing the note
	 * @property {string] [page]		The ID of the page containing the note*/
	
	/**Represents an error encountered during processing. Possible values:
	 * <ul>
	 * <li><b>no-type-specified</b> A note type parameter was required but not specified</li>
	 * <li><b>no-material-specified</b> A material ID parameter was required but not specified</li>
	 * <li><b>no-page-specified</b> A page ID parameter was required but not specified</li>
	 * <li><b>no-id-specified</b> A note ID parameter was required but not specified</li>
	 * <li><b>no-such-note</b> The specified note was not found</li>
	 * <li><b>not-owner</b> The request tried to modify a note that does not belong to the current user</li>
	 * <li><b>no-such-material</b> The request referenced a material that does not exist</li>
	 * <li><b>no-material-access</b> The request referenced a material that the user is not allowed to access</li>
	 * <li><b>no-such-page</b> The request referenced a material page that does not exist</li>
	 * <li><b>type-not-readable</b> Notes of the specified type cannot be accessed through this API</li>
	 * <li><b>type-not-modifiable</b> Notes of the specified type cannot be added, modified or deleted through this API</li>
	 * </ul>
	 * @memberof notes
	 * @typedef {string} Error*/
	
	/**A callback that receives an array of notes.
	 * @memberof notes
	 * @callback NotesCallback
	 * @param {Object} resp					The response from the server
	 * @param {notes.Note[]} [resp.notes]	The requested notes, if there were no errors with the request
	 * @param {notes.Error[]} resp.errors	An array containing any errors encountered during the request*/
	
	/**A callback that receives note counts.
	 * @memberof notes
	 * @callback CountsCallback
	 * @param {Object} resp					The response from the server
	 * @param {Object} [resp.counts]		An object that maps page IDs to the number of notes on that page
	 * @param {number} [resp.total]			The total number of notes in the material
	 * @param {notes.Error[]} resp.errors	An array containing any errors encountered during the request*/
	
	/**A callback that receives the info of a newly created note.
	 * @memberof notes
	 * @callback NewNoteCallback
	 * @param {Object} resp					The response from the server
	 * @param {string} [resp.id]			The ID of the new note
	 * @param {string} [resp.time]			A human-readable string describing when the note was last modified
	 * @param {notes.Error[]} resp.errors	An array containing any errors encountered during the request*/
	 
	 /**A callback invoked after a note has been modified
	 * @memberof notes
	 * @callback NoteModifiedCallback
	 * @param {Object} resp					The response from the server
	 * @param {notes.Error[]} resp.errors	An array containing any errors encountered during the request*/
	
	/**A callback that receives a material page ID
	 * @memberof notes
	 * @callback PageIDCallback
	 * @param {string} [pageId]	The page ID or undefined if the page ID is not available*/
	
	/**
	 * A callback that receives a note changed event
	 * @memberof notes
	 * @callback NoteChangedCallback
	 * @param {int} noteChangedEventType Whether the note was 1 created, 2 updated, 3 deleted.
	 * @param {string} noteId The note's ID.
	 * @param {Object} payload The note's updated data.
	 */
	
	/**Request parameter name for note ID*/
	var PARAM_ID = "id";
	/**Request parameter name for note type*/
	var PARAM_TYPE = "type";
	/**Request parameter name for material ID*/
	var PARAM_MATERIAL = "material";
	/**Request parameter name for page ID*/
	var PARAM_PAGE = "page";
	/**Request parameter name for indicating whether to include extra data*/
	var PARAM_INCLUDE_EXTRA = "includeExtra";
	/**Request parameter name for note content text*/
	var PARAM_TEXT = "text";
	/**Request parameter name for note topic*/
	var PARAM_TOPIC = "topic";
	/**Request parameter name for note extra data*/
	var PARAM_DATA_JSON = "data";
	/**Request parameter name for note last modified time*/
	var PARAM_LAST_MODIFIED = "time";
	/**Request parameter name for an array of notes*/
	var PARAM_NOTES = "notes";
	/**Request parameter name for a total note count*/
	var PARAM_TOTAL = "total";
	/**Request parameter name for an array of errors*/
	var PARAM_ERRORS = "errors";
	/**Request parameter name for an object containing per-page note counts*/
	var PARAM_COUNTS = "counts";
	
	/**Default note type*/
	var TYPE_NOTE = "note";
	/**The server endpoint for the notes API*/
	var ENDPOINT = "/o/material-notes/";
	
	/** The different typese of note changed events */
	var NOTE_CHANGED_TYPES = {
		Created: 1,
		Updated: 2,
		Deleted: 3
	}
	
	var noteChangedListeners = []
	
	/**Gets all notes on a page
	 * @memberof notes
	 * @param {notes.NotesCallback} [callback]			A callback to handle the data
	 * @param {boolean} [includeExtra=false]			Whether to include topic and dataJSON in note data
	 * @param {number} [materialId=current material ID]	The ID of the material containing the notes
	 * @param {string} [pageId=current page ID]			The ID of the page containing the notes
	 * @param {string} [type="note"]					The type of notes to get*/
	function getNotesForPage(callback, includeExtra, materialId, pageId, type){
		materialId = materialId || material.getCurrentMaterialId();
		pageId = pageId || material.getCurrentPageId();
		type = type || TYPE_NOTE;
		
		var params = {};
		params[PARAM_MATERIAL] = materialId;
		params[PARAM_PAGE] = pageId;
		params[PARAM_TYPE] = type;
		params[PARAM_INCLUDE_EXTRA] = includeExtra;
		
		utils.post(ENDPOINT + "get-notes-for-page", params, callback);
	}
	
	/**Gets all notes in a material
	 * @memberof notes
	 * @param {notes.NotesCallback} [callback]			A callback to handle the data
	 * @param {boolean} [includeExtra=false]			Whether to include topic and dataJSON in note data
	 * @param {number} [materialId=current material ID]	The ID of the material containing the notes
	 * @param {string} [type="note"]					The type of notes to get*/
	function getNotesForMaterial(callback, includeExtra, materialId, type){
		materialId = materialId || material.getCurrentMaterialId();
		type = type || TYPE_NOTE;
		
		var params = {};
		params[PARAM_MATERIAL] = materialId;
		params[PARAM_TYPE] = type;
		params[PARAM_INCLUDE_EXTRA] = includeExtra;
		
		utils.post(ENDPOINT + "get-notes-for-material", params, callback);
	}
	
	/**Gets the per-page counts of all notes in a material
	 * @memberof notes
	 * @param {notes.CountsCallback} [callback]			A callback to handle the data
	 * @param {number} [materialId=current material ID]	The ID of the material containing the notes
	 * @param {string} [type="note"]					The type of notes to get*/
	function getNoteCounts(callback, materialId, type){
		materialId = materialId || material.getCurrentMaterialId();
		type = type || TYPE_NOTE;
		
		var params = {};
		params[PARAM_MATERIAL] = materialId;
		params[PARAM_TYPE] = type;
		
		utils.post(ENDPOINT + "get-counts", params, callback);
	}
	
	/**Creates a new note on a page
	 * @memberof notes
	 * @param {notes.NewNoteCallback} [callback]		A callback invoked after the note has been created
	 * @param {string} [text]							The text content of the note
	 * @param {string} [topic]							The topic of the note
	 * @param {Object} [data]							Extra JSON data to include with the note
	 * @param {number} [materialId=current material ID]	The ID of the material containing the note. Should always be specified if pageId is present.
	 * @param {string} [pageId=current page ID]			The ID of the page containing the note
	 * @param {string} [type="note"]					The type of the note*/
	function addNoteToPage(callback, text, topic, data, materialId, pageId, type){
		materialId = materialId || material.getCurrentMaterialId();
		pageId = pageId || material.getCurrentPageId();
		type = type || TYPE_NOTE;
		
		var params = {};
		params[PARAM_MATERIAL] = materialId;
		params[PARAM_PAGE] = pageId;
		params[PARAM_TYPE] = type;
		params[PARAM_TEXT] = text;
		params[PARAM_TOPIC] = topic;
		params[PARAM_DATA_JSON] = data;
		
		utils.post(
			ENDPOINT + "insert-note", 
			params, 
			function(response) { 
				callback(response); 
				
				noteChanged(NOTE_CHANGED_TYPES.Created, 
					response.id, 
					{	
						text: text, 
						topic: topic, 
						data: data, 
						materialId: materialId, 
						pageId: pageId,
						type: type
					}
				);
			}
		);
		
	}
	
	/**Creates a new note on a material
	 * @memberof notes
	 * @param {notes.NewNoteCallback} [callback]		A callback invoked after the note has been created
	 * @param {string} [text]							The text content of the note
	 * @param {string} [topic]							The topic of the note
	 * @param {Object} [data]							Extra JSON data to include with the note
	 * @param {number} [materialId=current material ID]	The ID of the material containing the note
	 * @param {string} [type="note"]					The type of the note*/
	function addNoteToMaterial(callback, text, topic, data, materialId, type){
		materialId = materialId || material.getCurrentMaterialId();
		type = type || TYPE_NOTE;
		
		var params = {};
		params[PARAM_MATERIAL] = materialId;
		params[PARAM_TYPE] = type;
		params[PARAM_TEXT] = text;
		params[PARAM_TOPIC] = topic;
		params[PARAM_DATA_JSON] = data;
		
		utils.post(
			ENDPOINT + "insert-note", 
			params,
			function(response) { 
				callback(response); 
				
				noteChanged(NOTE_CHANGED_TYPES.Created, 
					response.id, 
					{	
						text: text, 
						topic: topic, 
						data: data, 
						materialId: materialId, 
						type: type
					}
				);
			}
		);
	}
	
	/**Updates an existing note. Pass undefined to leave a field unchanged, passing null will set it to empty.
	 * @memberof notes
	 * @param {string} id								The ID of the note to update
	 * @param {notes.NoteModifiedCallback} [callback]	A callback invoked after the note has been updated
	 * @param {string} [text]							The text content of the note
	 * @param {string} [topic]							The topic of the note
	 * @param {Object} [data]							Extra JSON data to include with the note
	 * @param {number} [materialId]						The ID of the material containing the note. Should always be specified if pageId is present.
	 * @param {string} [pageId]							The ID of the page containing the note. Should always be specified if materialId is present 
	 * 													(pass null to associate the note to the material itself).
	 * @param {string} [type]							The type of the note*/
	function updateNote(id, callback, text, topic, data, materialId, pageId, type){
		
		var params = {};
		params[PARAM_ID] = id;
		params[PARAM_MATERIAL] = materialId;
		params[PARAM_PAGE] = pageId;
		params[PARAM_TYPE] = type;
		params[PARAM_TEXT] = text;
		params[PARAM_TOPIC] = topic;
		params[PARAM_DATA_JSON] = data;
		
		utils.post(
			ENDPOINT + "update-note", 
			params, 
			function(response) { 
				callback(response); 
				
				noteChanged(NOTE_CHANGED_TYPES.Updated, 
					response.id, 
					{
						text: text, 
						topic: topic, 
						data: data, 
						materialId: materialId, 
						pageId: pageId,
						type: type
					}
				);
			}
		);
	}
	
	/**Deletes a note
	 * @memberof notes
	 * @param {string} id								The ID of the note to update
	 * @param {notes.NoteModifiedCallback} [callback]	A callback invoked after the note has been deleted*/
	function deleteNote(id, callback){
		var params = {};
		params[PARAM_ID] = id;
		
		utils.post(
			ENDPOINT + "delete-note", 
			params, 
			function(response) {
				callback(response);
				noteChanged(NOTE_CHANGED_TYPES.Deleted, id);
			}
		);
	}
	
	/**Gets an URL that can be used to download a text file containing the user's notes on a page
	 * @memberof notes
	 * @param {number} [materialId=current material ID]	The ID of the material containing the note
	 * @param {string} [pageId=current page ID]			The ID of the page containing the note
	 * @return {string}	The URL*/
	function getDownloadUrlForPageNotes(materialId, pageId){
		materialId = materialId || material.getCurrentMaterialId();
		pageId = pageId || material.getCurrentPageId();
		return ENDPOINT + "text-notes?" + PARAM_MATERIAL + "=" + materialId + "&" + PARAM_PAGE + "=" + pageId;
	}
	
	/**Gets an URL that can be used to download a text file containing the user's notes in a material
	 * @memberof notes
	 * @param {number} [materialId=current material ID]	The ID of the material containing the note
	 * @return {string}	The URL*/
	function getDownloadUrlForMaterialNotes(materialId){
		materialId = materialId || material.getCurrentMaterialId();
		return ENDPOINT + "text-notes?" + PARAM_MATERIAL + "=" + materialId;
	}
	
	/**Gets the ID of the last page that the user has accessed in a material
	 * @memberof notes
	 * @param {notes.PageIDCallback} callback			A callback to handle the ID
	 * @param {number} [materialId=current material ID]	The ID of the material*/
	function getLastPageId(callback, materialId){
		materialId = materialId || material.getCurrentMaterialId();
		getNotesForMaterial(function(response){
			if (response.notes && response.notes.length > 0){
				callback(response.notes[0][PARAM_PAGE]);
			}
			else {
				callback(undefined);
			}
		}, true, materialId, "lastpage");
	}
	
	/**
	 * Calls all the note changed listeners
	 * 
	 * @param {int} Event type
	 * @param {string} Note's ID
	 * @param {Object} New note data.
	 */
	function noteChanged(evtType, id, payload) {
		noteChangedListeners.forEach(function(func){ func(evtType, id, payload) });
	}
	
	
	/**
	 * Registers a change listener for when a note has been changed
	 * @param {NoteChangedCallback} The callback listener
	 */
	function onNoteChanged(callback) {
		noteChangedListeners.push(callback)
	}
	
	/**
	 * Removes a note changed listener
	 * @param {NoteChangedCallback} The callback listener
	 */
	function offNoteChanged(callback) {		
    	var idx = noteChangedListeners.findIndex(callback);
    	
		if(idx !== -1) {
			noteChangedListeners.splice(idx, 1);
		}
	}
 	
	return {
		getNotesForPage: getNotesForPage,
		getNotesForMaterial: getNotesForMaterial,
		getNoteCounts: getNoteCounts,
		addNoteToPage: addNoteToPage,
		addNoteToMaterial: addNoteToMaterial,
		updateNote: updateNote,
		deleteNote: deleteNote,
		getDownloadUrlForPageNotes: getDownloadUrlForPageNotes,
		getDownloadUrlForMaterialNotes: getDownloadUrlForMaterialNotes,
		getLastPageId: getLastPageId,
		noteChanged: noteChanged,
		onNoteChanged: onNoteChanged,
		offNoteChanged: offNoteChanged,
		NOTE_CHANGED_TYPES: NOTE_CHANGED_TYPES
	};
	
});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/material', ['./utils'], function(utils) {

	//IE polyfills
	if (!Array.prototype.includes){
		Array.prototype.includes = function(value){
			for (var i = 0; i < this.length; i++) {
				if (this[i] === value) return true;
			}
			return false;
		}
	}

	/**Contains functions for accessing & manipulating the currently open material & material page
	 * @namespace material*/

	/**A callback for functions that output arbitrary data
	 * @memberof material
	 * @callback anyCallback
	 * @param {any} value	The requested value*/

	/**A callback for functions that output integer data
	 * @memberof material
	 * @callback intCallback
	 * @param {int} value	The requested value*/

	/**A callback for functions that output page data
	 * @memberof material
	 * @callback pageCallback
	 * @param {?material.Page} page	The requested page or null if the page is not available*/
	
	/**A callback for that listens for page updates
	 * @memberof material
	 * @callback pageUpdateCallback
	 * @param {material.Page} page	The requested page or null if the page is not available
	 * @param {string[]} [fields]	A list containing the names of fields that were updated*/

	/**A callback for functions that output material data
	 * @memberof material
	 * @callback materialCallback
	 * @param {material.Material} material	The requested material*/

	/**A callback for functions that output extra page data
	 * @memberof material
	 * @callback extraPageCallback
	 * @param {material.ExtraPage} page	The extra page*/

	/**A callback for functions that output a list of pages
	 * @memberof material
	 * @callback pageListCallback
	 * @param {material.Page[]} pages		The requested pages
	 * @param {boolean} [containsCurrent]	If present, indicates whether or not the list contains the currently open page*/

	/**A callback for functions that output a list of permissions
	 * @memberof material
	 * @callback permissionListCallback
	 * @param {material.Permission[]} permissions	The requested permissions*/
	
	/**A callback for function that outputs a list of material's ISBNs
	 * @memberof material
	 * @callback materialISBNsCallback 
	 * @param {material.Material.isbns} materialISBNs	requested list of material's ISBNs*/

	/**A callback that is invoked when the current material has been resolved
	 * @memberof material
	 * @callback materialReadyListener*/

	/**A callback that is invoked whenever the displayed page is changed
	 * @memberof material
	 * @callback pageChangeListener
	 * @param {material.Page} page					The new page
	 * @param {material.PageChangeOptions} options	The page change options
	 * @param {Object} data							Arbitrary metadata passed with the original page change request*/

	/**A callback that is invoked before the displayed page is changed
	 * @memberof material
	 * @callback beforePageChangeListener
	 * @param {material.Page} page					The new page
	 * @param {material.PageChangeOptions} options	The page change options object
	 * @return {Promise}							A promise that should be resolved when the new page can safely be loaded*/

	/**A callback for functions that output a playlist
	 * @memberof material
	 * @callback playlistCallback
	 * @param {?material.Playlist} playlist	The requested playlist or null if the playlist is not available*/
	
	/**A callback for functions that output metadata
	 * @memberof material
	 * @callback metadataCallback
	 * @param {material.Metadata} metadata			The requested metadata or null if material is not available*/

	/**A function that is used to redirect the user from certain pages to others
	 * @memberof material
	 * @typedef {function} pageMapper
	 * @param {string} pageID	The ID of the page to redirect from
	 * @return {string}	The ID of the page to redirect to*/

	/**The loading status for an individual product page
	 * @ignore
	 * @typedef {Object} LoadingStatus
	 * @property {boolean} failed					true if loading this page failed, false otherwise
	 * @property {material.pageCallback[]} buffer	An array of callbacks to invoke when loading finishes*/

	/**An object that globally identifies a specific product page
	 * @memberof material
	 * @typedef {Object} PageID
	 * @property {string} materialId	The ID of the product containing the page
	 * @property {string} pageId		The ID of the page within the product
	 * @property {Object} data			Data to pass to listeners when the page is loaded*/

	/**An object specifying extra options for a page change operation
	 * @memberof material
	 * @typedef {Object} PageChangeOptions
	 * @property {boolean} [addPageToHistory=true]		If true, the page state will be added to browser history
	 * @property {boolean} [ignorePageMappers=false]	If true, the page ID should be processed raw, ignoring any active page mapper function
	 * @property {boolean} [loadContent=true]			If true, the page content will be loaded into the browser in place of the previously displayed page
	 * @property {boolean} [back=false]					If true and the specified page is hidden, its closest visible ancestor page will be loaded instead.
	 * 													Otherwise, if the page is hidden, its first child will be loaded*/

	/**An object representing a product page
	 * @memberof material
	 * @typedef {Object} Page
	 * @property {string} title					The title of the page
	 * @property {string} shortTitle			The short title of the page
	 * @property {string} desc					The description of the page
	 * @property {string} id					The ID of this page
	 * @property {string} identifier			The identifier of this page
	 * @property {string} url					The complete URL of this page
	 * @property {string} contentUrl			The URL to load this page's content only
	 * @property {int} level					The page's level in the page hierarchy
	 * @property {string[]} breadcrump			The page's breadcrumb in the page hierarchy as an ordered list of page IDs
	 * @property {string} colorHex				The color hex of the page
	 * @property {string} group					The group of this page
	 * @property {string} [imageUrl]			The url for the page image of this page
	 * @property {boolean} navigation			True if this page is a navigation page
	 * @property {int} pageIndex				The page index of the page
	 * @property {int} pageNumber				The page number of the page
	 * @property {string} contentType			The content type of the page
	 * @property {string} subContentType		The content subtype of the page
	 * @property {boolean} hidden				True if the page is hidden
	 * @property {boolean} hideFromChildren		True if the page is hidden from its children
	 * @property {boolean} hideFromNavigation	True if the page is hidden from navigation
	 * @property {boolean} inactive				True if the page is inactive
	 * @property {string[]} childPages			An array of the IDs of the page's child pages
	 * @property {string[]} tags				An array of the page's tags
	 * @property {string[]} contentTags			An array of the page's content tags
	 * @property {string[]} styleClasses		An array of the page's style classes
	 * @property {int} siblingId				The sibling ID of the page
	 * @property {int} currentChildId			The current child ID of the page
	 * @property {material.LockState} lockState	The lock state of the page.
	 * @property {material.LockReason[]} lockReasons	If the page is locked, contains reasons explaining why
	 * @property {Object} scores				The user's current scores on this page
	 * @property {int} scores.score			The current user score on this page
	 * @property {int} scores.scoreMax		The maximum score on this page
	 * @property {float} scores.progress	The user's progress through this page on a scale of 0 to 1
	 * @property {boolean} scores.visited	True if the user has visited this page, false otherwise
	 * @property {int} scores.stars			The current number of stars the user has on this page
	 * @property {int} scores.starsMax		The maximum number of stars on this page */

	/**An object representing a single product
	 * @memberof material
	 * @typedef {Object} Material
	 * @property {string} title					The title of the product
	 * @property {string} id					The ID of the product
	 * @property {string} languageId			The language info of the product
	 * @property {string[]} isbns				An array of the product's ISBNs
	 * @property {string} lastUpdated 			The time when the material was last edited*/
	
	/**Represents a page outside the normal material structure
	 * @memberof material
	 * @typedef {Object} ExtraPage
	 * @property {string} pageUrl			The URL to access the page directly
	 * @property {string} pageContentUrl	The URL to access the page content only
	 * @property {string} languageKey		The language key used to translate the page name*/
	
	/**A string indicating the lock state of a page.
	 * Possible values are OPEN (allow access), 
	 * PREVIOUSLY_LOCKED (this page has been locked at some point but is now open),
	 * SHOW_IN_NAVIGATION_ONLY (no access but should be visible in navigation)
	 * and LOCKED (no access, hide from navigation).
	 * @memberof material
	 * @typedef {String} LockState*/
	
	/**An object representing a reason that a page is locked
	 * @memberof material
	 * @typedef {Object} LockReason
	 * @property {string} [name]					A human-readable title for the reason
	 * @property {string} [description]				A human-readable description of the reason
	 * @property {string} [imageUrl]				A URL that can be used to show an image representing the reason
	 * @property {string} type						The type identifier of this reason
	 * @property {material.LockReason[]} subreasons	An array of sub-reasons such as alternative unlock conditions*/
	
	/**An object representing a page's lock state and possible reasons that the page is locked
	 * @memberof material
	 * @typedef {Object} LockAndReason
	 * @property {material.LockState} lockState			The lock state of the page.
	 * @property {material.LockReason[]} lockReasons	An array of reasons explaining why the page is locked*/

	/**An object representing a playlist
	 * @memberof material
	 * @typedef {Object} Playlist
	 * @property {string} id						The ID of the playlist
	 * @property {string} name						The name of the playlist
	 * @property {string} description				The description of the playlist
	 * @property {boolean} visible					If true, anyone with the code can open the playlist
	 * @property {string} shareCode					The share code of the playlist
	 * @property {long} creator						The user ID of the creator of the playlist
	 * @property {material.PlaylistPage[]} pages	An array of pages in the list*/
	
	/**An object representing metadata of a material
	 * @memberof material
	 * @typedef {Object} Metadata
	 * @property {string} previewURL				The preview URL of the material
	 * @property {string} schoolSubject				The school subject of the material
	 * @property {string} isbn						The isbn code of the material
	 * @property {string} description				The description of the material
	 * @property {string} title						The title of the material
	 * @property {string} type						The type of the material
	 * @property {string} locale					The locale of the material
	 * @property {string} classLevel				The classLevel of the material
	 * @property {Object[]} materialTypeMetadata	An array of arbitrary metadata
	 * @property {string} basenumber				The base number of the material

	/**A single page in a playlist
	 * @memberof material
	 * @typedef {Object} PlaylistPage
	 * @property {string} materialId			The material ID of this playlist page
	 * @property {string} pageId				The page ID of this playlist page
	 * @property {string} [relatedContentId]	The related content ID of this playlist page*/

	/**A source for pageIds to use with the {@link changeToNextPage} and {@link changeToPreviousPage} functions
	 * @memberof material
	 * @typedef {Object} PageSource
	 * @property {material.pageIDProvider} getNextPageId		Gets the ID of the next page
	 * @property {material.pageIDProvider} getPreviousPageId	Gets the ID of the previous page*/

	/**A function that provides a page ID
	 * @memberof material
	 * @typedef {Function} pageIDProvider
	 * @param {material.pageCallback} callback	A function to receive the ID*/

	/**A function that determines achievements based on page data
	 * @memberof material
	 * @typedef {Function} AchievementCalculator
	 * @param {material.Page} page	The page data
	 * @return {Object}	The achievement data*/

	/**A function that renders pages of given content type.
	 * @memberof material
	 * @typedef {Function} PageContentTypeRenderer
	 * @param {material.Page} page	The page data to render
	 * @param {string} containerId  The id of the DOM element to render the page into.
	 * @param {Function} callback  Function to call when page has been rendered.*/

	/**Indicates permissions that a user has to a material. Possible values;
	 * <ul>
	 * <li><b>DELETE</b>: The user can delete the material</li>
	 * <li><b>DUPLICATE</b>: The user can duplicate the material</li>
	 * <li><b>EDIT</b>: The user can edit the material</li>
	 * <li><b>PARTICIPATE</b>: The user can view the material</li>
	 * <li><b>PUBLISH</b>: The user can publish the material</li>
	 * <li><b>SHARE</b>: The user can share the material</li>
	 * <li><b>REPORT</b>: The user can view reports in the material</li>
	 * @memberof material
	 * @typedef {string} Permission*/


	var loadedPages = {};
	var pageLoadingInProgress = false;
	var loadedPageCallbackBuffer = {};
	var gamification = {};
	var performanceHints = {
			skipLoadingScores: false
	};

	var extraPageChangeListeners = [];

	var currentPageId = null;
	var lastPageId = null;
	var pageMappers = {};
	var pageChangeListeners = [];
	var pageStartsLoadingListeners = [];
	var pageUpdatedListeners = [];
	var renderers = {};
	var pageCustomDatas = {};
	var ajaxLoadEnabled = true;
	var fontSize = 0;
	var fontSizeListeners = [];
	var materialReadyListeners = [];
	var pageContentTypeRenderers = {};

	/**The ID of the material containing the current page*/
	var currentMaterialId = null;
	/**The content type of the material containing the current page*/
	var currentMaterialContentType = null;
	/**@deprecated call getPage with an object containing the materialId instead.
	 * If not null, overrides the requestedMaterial from getRequestedMaterial*/
	var currentRequestedMaterial = null;
	/**An array of listener functions called whenever the current playlist changes*/
	var playlistChangeListeners = [];
	/**The currently active playlist, if any*/
	var currentPlaylist = null;

	/**The object currently used to get the next and previous pages*/
	var currentPageSource = new DefaultPageSource();

	/**An array of permissions that the user has for the current material*/
	var materialPermissions = null;

	/**An object of metadata for the current material */
	var metadata = null;

	/**Creates an object that traverses through the current material*/
	function DefaultPageSource(){};
	//Gets the next page in the material
	DefaultPageSource.prototype.getNextPageId = function(callback){

		getCurrentPage( function( currentPage ){

			if ( currentPage != null ) {

				getPageLevelPages( currentPage.id, function( pages ){
					var pageIndex = getPageIndex(currentPage, pages);
					console.log(pages, pageIndex)
					while ( pageIndex < pages.length - 1 ){
						pageIndex++;
						var possible = pages[pageIndex];
						if (!possible.inactive && possible.lockState !== 'LOCKED' && possible.lockState !== 'SHOW_IN_NAVIGATION_ONLY'){
							callback(possible.id);
							return;
						}
					}
					callback(null);

				});

			}

		});
	}
	//Gets the previous page in the material
	DefaultPageSource.prototype.getPreviousPageId = function(callback){
		getCurrentPage( function( currentPage ){

			if ( currentPage != null ) {

				getPageLevelPages( currentPage.id, function( pages ){
					var pageIndex = getPageIndex(currentPage, pages);
					while ( pageIndex > 0 ){
						pageIndex--;
						var possible = pages[pageIndex];
						if (!possible.inactive && possible.lockState !== 'LOCKED' && possible.lockState !== 'SHOW_IN_NAVIGATION_ONLY'){
							callback(possible.id);
							return;
						}
					}
					callback(null);

				});

			}

		});
	}
	/**Creates an object that traverses through pages from the current playlist*/
	function PlaylistPageSource(){
		//Initialize page index to -1 so that the first call to getNextPageId()
		//returns the ID of the first page
		this.pageIndex = -1;
	}
	//Gets the ID of the next playlist page
	PlaylistPageSource.prototype.getNextPageId = function (callback){
		//Stop if we've reached the end of the playlist
		if (this.pageIndex >= currentPlaylist.pages.length -1){
			callback(null);
		}
		else {
			//Find the next page
			var nextPage = currentPlaylist.pages[this.pageIndex +1];
			//Increment current page index
			this.pageIndex++;

			//Format page data
			var pageData = {
					materialId: nextPage.materialId,
					pageId: nextPage.pageId,
					urlParams: {
						openPlaylist: currentPlaylist.id,
						playlistPage: this.pageIndex
					},
					numericMaterialId: nextPage.numericMaterialId
			}
			//Include any related content data
			if (nextPage.relatedContentId){
				pageData.data = {
						relatedContentId: nextPage.relatedContentId,
						relatedContentShowInline: true,
						playlistId : currentPlaylist.id
				}
				pageData.urlParams.relcontent = nextPage.relatedContentId
			}

			//Send back an object containing the material and page IDs of the next page
			callback(pageData);
		}
	}
	//Gets the ID of the previous playlist page
	PlaylistPageSource.prototype.getPreviousPageId = function (callback){
		//Stop if we've reached the beginning of the playlist
		if (this.pageIndex <= 0){
			callback(null);
		}
		else {
			//Find the previous page
			var prevPage = currentPlaylist.pages[this.pageIndex -1];
			//Decrement current page index
			this.pageIndex--;

			//Format page data
			var pageData = {
					materialId: prevPage.materialId,
					pageId: prevPage.pageId,
					urlParams: {
						openPlaylist: currentPlaylist.id,
						playlistPage: this.pageIndex
					},
					numericMaterialId: prevPage.numericMaterialId
			}
			//Include any related content data
			if (prevPage.relatedContentId){
				pageData.data = {
						relatedContentId: prevPage.relatedContentId,
						relatedContentShowInline: true,
						playlistId : currentPlaylist.id
				}
				pageData.urlParams.relcontent = prevPage.relatedContentId
			}

			//Send back an object containing the material and page IDs of the previous page
			callback(pageData);
		}
	}

	PlaylistPageSource.prototype.setCurrentPageIndex = function(index){
		this.pageIndex = index;
	}

	PlaylistPageSource.prototype.getCurrentPageIndex = function(){
		return this.pageIndex;
	}

	var _achievementCalculator = function(page) {

		var achievement = {
			elements: 0,
			elementsMax: 0
		};

		if ( page.scores ) {

			var scores = page.scores;

			if ( scores.scoreMax > 0 ) {

				achievement.elementsMax = 3;

				var percentage = (scores.score / scores.scoreMax) * 100;

				achievement.elements = percentage == 0 ? 0 : percentage <= 34 ? 1 : percentage <=67 ? 2 : 3;

			} else {

				achievement.elementsMax = 1;

				// is visited
				if ( scores.visited ) {
					achievement.elements = 1;
				}

			}

		}

		return achievement;

	};

	/**Gets the requested material string of the current page.
	 * The requested material string encodes both the material ID as well as the view mode.
	 * @memberof material
	 * @return {?string}	The requested material string, if available*/
	function getRequestedMaterial() {
		//Use an override material if one has been set
		if (currentRequestedMaterial){
			return currentRequestedMaterial;
		}
		//Otherwise get the material from the URL
		var requestedMaterial = utils.getUrlParameter("material");

		if ( requestedMaterial ) {
			return requestedMaterial;
		} else {
			var start = location.pathname.indexOf("/state-");
			if ( start != -1 ) {
				var end = location.pathname.indexOf("/", start+1);
				return location.pathname.substring(start+7, end);
			}
		}

		return null;

	}

	/**Gets the page loading status for a page if and only if it exists.
	 * @param {string} materialId	The ID of the material containing the page
	 * @param {string} pageId		The ID of the page
	 * @return {material.LoadingStatus|undefined}	The loading status for the page or undefined if the status has not been set*/
	function readLoadingStatus(materialId, pageId){
		if (loadedPageCallbackBuffer[materialId]){
			return loadedPageCallbackBuffer[materialId][pageId];
		}
		else {
			return undefined;
		}
	}

	/**Sets the page loading status for a page.
	 * @param {string} materialId				The ID of the material containing the page
	 * @param {string} pageId					The ID of the page
	 * @param {material.LoadingStatus} status	The loading status to set for the page*/
	function writeLoadingStatus(materialId, pageId, status){
		//If the buffer has no entry for this material, create one
		if (!loadedPageCallbackBuffer[materialId]){
			loadedPageCallbackBuffer[materialId] = {};
		}
		//Add the status to the buffer
		loadedPageCallbackBuffer[materialId][pageId] = status;
	}

	/**Gets the loading status for a material page
	 * @param {string|material.PageID} page	Either the string ID of the page or a page data object identifying the material and the page
	 * @return {material.LoadingStatus}	The loading status for the specified page*/
	function getPageLoadingStatus(page) {
		//Resolve page & material IDs
		var pageId;
		var materialId;

		if (typeof(page) === "object"){
			pageId = page.pageId;
			materialId = page.materialId;
		}
		else {
			pageId = page;
			materialId = getRequestedMaterial();
		}

		//If no status exists, create an empty one
		if ( !readLoadingStatus(materialId, pageId) ) {

			writeLoadingStatus(materialId, pageId, {
				failed: false,
				buffer: []
			});

		}

		return readLoadingStatus(materialId, pageId);

	}

	function loadPagesWithLevel(loadPagesByLevel, callback) {
		if ( currentPageId ) {
			loadPage(currentPageId, loadPagesByLevel, callback);
		} else {
			callback(null);
		}
	}

	function loadPage(pageId, loadPagesByLevel, callback) {
		//Get current loading status
		var loadingStatus = getPageLoadingStatus(pageId);

		//If we've already attempted to load the page and failed, return null
		if ( loadingStatus.failed ) {
			callback(null);
			return;
		}

		//Otherwise add the callback to a buffer of functions to call when the page loads
		loadingStatus.buffer.push(callback);

		//If we're currently loading a page, wait for the load to finish
		if ( pageLoadingInProgress ) {
			return;
		}

		//Otherwise load the page immediately
		doLoadPage(pageId, loadPagesByLevel);

	}

	function doLoadPage(page, loadPagesByLevel) {
		var pageId;
		var requestedMaterial;

		if (typeof(page) === "object"){
			pageId = page.pageId;
			requestedMaterial = page.materialId;
		}
		else {
			pageId = page;
			requestedMaterial = getRequestedMaterial();
		}
	
		pageLoadingInProgress = true;

		/* If Analytics Framework is installed, pages-for-analytics endpoint is called. If the server is 
		configured to not load scores, pages-for-analytics endpoint is also called, but without the Framework. */
		var action = "pages-for-analytics";

		/* If Analytics Framework is not installed and skipLoadingScores is false,
		pages-with-scores endpoint will be called, if it so configured on the server. */
		if (loadPageScores() && !performanceHints.skipLoadingScores) {
			if (!isAnalyticsFrameworkInstalled()) {
				action = "pages-with-scores";
			}
		/* If the theme wants to skip loading scores completely, pages endpoint is called. */
		} else if (performanceHints.skipLoadingScores) {
			action = "pages";
		}

		/* Fetch page scores with getTaskStatus() with the payload if Analytics Framework
		is installed and if skipLoadingScores is false. */
		var scores;
		if(!performanceHints.skipLoadingScores) {
			if (isAnalyticsFrameworkInstalled() && !doNotLoadFromAnalytics()) {
				var payload = {
					material: Cloubi.currentMaterial.uuid,
					users: [Cloubi.currentUser.uuid]
				}
				scores = getTaskStatus(payload);
			}
		}

		var url = "/o/site-material-api/" + action + "/" + encodeURIComponent(requestedMaterial) + "/" + encodeURIComponent(pageId);
		if (loadPagesByLevel) {
			url = url + "/" + encodeURIComponent(loadPagesByLevel);
		}
		
		utils.get(url, function(data) {
			/* If Analytics Framework is installed and scores are ready, 
			then calculate the scores for each page using data from AF. */
			if (typeof(scores) != "undefined" && !performanceHints.skipLoadingScores) {
				scores.then(
					function(taskStatus) {
						for(var pageProperty in data.pages) {
							var pageObject = data.pages[pageProperty];
							var pageScores = taskStatus.filter(function(value) {
								return value.pageId === pageObject.uuid;
							});

							// Ignore ATP-packages since their scores are not stored in analytics
							if(pageScores && pageScores.length
								&& pageObject.contentType !== 'cloubi/adaptivetaskpackage') {
								computePageScores(pageObject.scores, pageScores);
							}
						}
						loadPages();
					},
					function(error) {
						console.log(error);
					}
				)
			} else {
				/* If Analytics Framework is not installed, or skipLoadingScores or
				doNotLoadFromAnalytics are true, just load pages. */
				loadPages();
			}

			function loadPages() {
				pageLoadingInProgress = false;
				if (!loadedPages[requestedMaterial]){
					loadedPages[requestedMaterial] = {};
				}
	
				var hasRequestedPage = false;
				if ( data.pages ) {
					var existing = 0;
					var newPages = 0;
					jQuery.each(data.pages, function(id, page) {
						if ( id == pageId ) {
							hasRequestedPage = true;
						}
						if ( loadedPages[requestedMaterial][id] ) {
							existing++;
						} else {
							newPages++;
							loadedPages[requestedMaterial][id] = page;
						}
					});
				}
	
				//Store material info
				if ( data.materialId ) {
					loadedPages[requestedMaterial]._materialId = data.materialId;
				}
				if ( data.materialContentType ) {
					loadedPages[requestedMaterial]._contentType = data.materialContentType;
				}
				if ( data.lastPageId ) {
					lastPageId = data.lastPageId;
				}
				if (!hasRequestedPage){
					// console.log("WARNING: Requested page " + pageId + " was not present in response");
					if ( readLoadingStatus(requestedMaterial, pageId) ){
						/* If the specific page requested was not in the response, mark loading
						status as failed. Otherwise invokeBufferedPageLoads() may attempt
						to load it again, causing an infinite loop. */
						readLoadingStatus(requestedMaterial, pageId).failed = true;
					}
				}
				invokeBufferedPageLoads();
			}
		});
	}

	/* Fetches page scores from task status microservice. */
	function getTaskStatus(payload) {
		return new Promise(function(resolve, reject) {
			utils.post("/o/analytics-framework/progress-status", payload,
				function(response) {
					resolve(response);
				},
				function() {
					reject("Error while fetching task scores");
				}
			);
        });
	}

	/* Computes the sum of scores, progress and stars for each page from the tasks. */
	function computePageScores(scores, taskStatus) {
		var scoreSum = 0;
		var progressSum = 0;
		taskStatus.forEach(function(taskScore) {
			scoreSum += taskScore.score;
			progressSum += taskScore.progress;		
		});
		//If the page has any task data, assume that it is visited
		//(this is strictly speaking not true because of linked tasks, but there's no way to check for sure
		//without sacrificing performance yet).
		if (taskStatus.length > 0) {
		    scores.visited = true;
		}
		scores.score = scoreSum;
		// Calculate progress
		if (scores.tasks > 0) {
		    //Analytics returns scores as percentages, so divide by 100 to get a value between 0-1
			scores.progress = (progressSum / scores.tasks) / 100;
		} else {
			scores.progress = 0;
		}
		// Calculate stars
		var percent;
		if (scores.scoreMax > 0) {
			percent = (scoreSum / scores.scoreMax);
		} else {
			percent = 0;
		}
		if ( percent < 0.01 ) {
			scores.stars = 0;
		} else if ( percent < 0.34 ) {
			scores.stars = 1;
		} else if ( percent < 0.67 ) {
			scores.stars = 2;
		} else {
			scores.stars = 3;
		}
	}

	/** Gets list of material's ISBNs as {@link MaterialISBNs} object
	 * @memberof material
	 * @param {material.materialISBNsCallback} callback		A callback to receive the data*/
	function getMaterialISBNs(callback) {
		if ( self.Cloubi && Cloubi.currentMaterial && Cloubi.currentMaterial.isbns ) {
			callback(Cloubi.currentMaterial.isbns);
		}
		else {
			callback([]);
		}
	}

	/**Gets a page with specific material and page IDs if and only if the page is cached.
	 * @param {string} requestedMaterial	The encoded material ID of the material containing the page
	 * @param {string} pageId				The page ID of the page
	 * @return {material.Page|undefined}	An object representing the page or undefined if no such page exists in the cache*/
	function getCachedPage(requestedMaterial, pageId){
		if (loadedPages[requestedMaterial]){
			return loadedPages[requestedMaterial][pageId];
		}
		else {
			return undefined;
		}
	}

	function invokeBufferedPageLoads() {

		var nextToLoad = null;
		var callbacksToInvoke = [];

		jQuery.each(loadedPageCallbackBuffer, function(requestedMaterial, pages) {
			jQuery.each(pages, function(pageId, status) {
				var buffer = status.buffer;
				if ( buffer.length > 0 ) {
					var cachedPage = getCachedPage(requestedMaterial, pageId);
					if ( status.failed || cachedPage ) {
						status.buffer = [];
						var page = null;
						if ( cachedPage ) {
							page = cachedPage;
						}
						jQuery.each(buffer, function(index, callback) {
							callbacksToInvoke.push({callback: callback, page: page});
						});
					} else {
						nextToLoad = {pageId: pageId, materialId: requestedMaterial};
					}
				}
			});
		});

		jQuery.each(callbacksToInvoke, function(index, what) {
			what.callback(what.page);
		});

		if ( nextToLoad && !pageLoadingInProgress ) {
			doLoadPage(nextToLoad, null);
		}

	}


	/**Gets the current gamification status
	 * @memberof material
	 * @param {material.anyCallback} callback	A callback to receive the data*/
	function getGamificationStatus(callback) {

		var requestedMaterial = getRequestedMaterial();

		if ( requestedMaterial ) {

			utils.get("/o/cloubi-gamification/status/" + encodeURIComponent(requestedMaterial), function(data) {

				gamification['status'] = data;

				callback(data);

			});

		} else {

			callback( gamification['status'] );

		}

	}

	/**Locally updates the scores of a page.
	 * NOTE: the scores are updated in the frontend only and are not persisted in any way.
	 * @memberof material
	 * @param {material.Page} page	The page object to update
	 * @param {int} score			The user score to set
	 * @param {int} scoreMax		The maximum page score to set
	 * @param {float} progress		The user progress in the page, from 0 (not started) to 1 (finished)
	 * @param {boolean} visited		True if the user has visited the page, false otherwise
	 * @param {int} stars			The number of stars the user has earned on the page
	 * @param {int} starsMax		The maximum number of stars the user can earn on the page*/
	function updatePageScore(page, score, scoreMax, progress, visited, stars, starsMax) {

		page.scores = page.scores || {};

		console.log("Scores updated on page " + page.id + ": score " + score + "/" + scoreMax + ", progress " + progress + ", visited " + visited + ", stars " + stars + ", starsMax " + starsMax);

		page.scores.scoreMax = scoreMax;
		page.scores.score = score;
		page.scores.progress = progress;
		page.scores.visited = visited;
		page.scores.stars = stars;
		page.scores.starsMax = starsMax;

		triggerPageChanged(page, ["scores"]);

	}
	
	/**Updates the lock state of a page
	 * @memberof material
	 * @param {string} pageId						The ID of the page to update
	 * @param {material.LockState} lockState		The new lock state of the page
	 * @param {material.LockReason[]} lockReasons	The new lock reasons of the page*/
	function updatePageLockState(pageId, lockState, lockReasons){
		var promise = new $.Deferred();
		if (lockState !== 'LOCKED') {
			var loadingStatus = readLoadingStatus(getRequestedMaterial(), pageId);
			if (loadingStatus){
				loadingStatus.failed = false; //If we tried to load the page before and failed, retry
			}
			//Load page
			getPage(pageId, function(page) {
				if (page) {
					//Ensure the page is at the correct index in its parent's child pages
					var parentPageId = getParentPageId(page);
					if (parentPageId){
						getPage(parentPageId, function(parent){
							if (parent && parent.childPages && !parent.childPages.includes(pageId) ){
								getPageChildPages(parentPageId, {includeHiddenChildPages: true}, function(children){
									parent.childPages.splice(getPageIndex(page, children), 0, pageId);
									triggerPageChanged(parent, ["childPages"]);
								})
							}
							promise.resolve(page);
						})
					}
					else {
						promise.resolve(page);
					}
				}
				else {
					promise.resolve();
				}
			});
		}
		else {
			getPage(pageId, promise.resolve);
		}
		promise.then(function(page){
			if (page) {
				page.lockState = lockState;
				page.lockReasons = lockReasons;
				page.inactive = (lockState === "LOCKED");
				
				triggerPageChanged(page, ["lockState", "lockReasons", "inactive"]);
			}
		});
	}
	
	function getPageIndex(page, pages) {
		for (var i = 0; i < pages.length; i++){
			if (page.id === pages[i].id || pages[i].pageIndex > page.pageIndex){
				return i;
			}
		}
		return pages.length;
	}
	
	function updatePage(page, data){
		var updated = [];
		$.each(data, function(key, val){
			if (page.hasOwnProperty(key) && !utils.deepEqual(page[key], val)) {
				console.log("updating field " + key, page[key], "->", val)
				page[key] = val;
				updated.push(key);
			}
		})
		console.log("Updated fields ", updated)
		triggerPageChanged(page, updated);
	}

	/**Locally marks a page as visited
	 * NOTE: the page is marked in the frontend only and the change is not persisted in any way
	 * @memberof material
	 * @param {material.Page} page	The page to mark*/
	function markPageVisited(page) {

		page.scores = page.scores || {};

		console.log("Mark page " + page.id + " as visited");

		page.scores.visited = true;

		triggerPageChanged(page, ["scores.visited"]);

	}

	/**Locally updates a page's scores from a JS object
	 * NOTE: the scores are updated in the frontend only and are not persisted in any way.
	 * @memberof material
	 * @param {material.Page} page		The page to update
	 * @param {material.Page#scores} data	The updated scores*/
	function updatePageScoreFromJSON(page, data) {

		updatePageScore(page, data.score, data.scoreMax, data.progress, data.visited, data.stars, data.starsMax);

	}

	/**Gets the latest scores for a page from the server
	 * @memberof material
	 * @param {material.Page} page	The page to refresh*/
	function refreshPageScores(page) {

		if ( !page ) {
			return;
		}

		var requestedMaterial = getRequestedMaterial();

		var url = "/o/site-material-api/page-scores/" + encodeURIComponent(requestedMaterial) + "/" + encodeURIComponent(page.id);

		utils.get(url, function(data) {
			page.scores = Object.assign(page.scores || {}, data);
			triggerPageChanged(page, ["scores"]);
		});

	}

	/**Calls listeners to signal that page data has changed
	 * @memberof material
	 * @param {material.Page} page	The updated page
	 * @param {string[]} [fields]	A list of fields that were updated*/
	function triggerPageChanged(page, fields) {

		jQuery.each(pageUpdatedListeners, function(index, func) {
			func(page, fields);
		});

	}

	/**Gets a list containing the requested page's child pages
	 * @memberof material
	 * @param {string|material.PageID} parentPageId	The ID of the parent page
	 * @param {Object} [options]					An object specifying additional options on the pages to include
	 * @param {boolean} [options.includeHiddenChildPages=false]	If true, hidden pages will be included in the results
	 * @param {material.pageListCallback} callback	A callback function that receives the list of child pages*/
	function getPageChildPages(parentPageId, options, callback) {

		var childPages = [];

		if (!options) options = {};

		options = jQuery.extend({includeHiddenChildPages: false}, options);

		getPage(parentPageId, function(parentPage) {
			
			if (parentPage.childPages.length > 0) {

				var hideChildPages = !options.includeHiddenChildPages && parentPage.hideFromChildren ? true : false;
				
				var promises = []
				// get pages
				jQuery.each(parentPage.childPages, function(_, pageId) {
					var promise = new jQuery.Deferred()
					getPage(pageId,function(childPage) {
						if (!hideChildPages && !childPage.hidden && !childPage.inactive) {
							childPages.push(childPage);
						}
						
						promise.resolve();
					});
				
					promises.push(promise);
				});

				jQuery.when.apply(jQuery, promises).then(function() {
					callback(childPages)
				});
				
			} else {
				callback(childPages);
			}


		});
	}

	/**Gets a list containing the requested page and all of its sibling pages
	 * @memberof material
	 * @param {string|material.PageID} pageId		The ID of the page
	 * @param {material.pageListCallback} callback	A callback function that receives the list of sibling pages*/
	function getPageLevelPages(pageId, callback) {

		var levelPages = [];

		getPage( pageId, function(page) {

			if ( page &&  page.breadcrump.length > 1 ) {

				var parentPageId = page.breadcrump[page.breadcrump.length-2];

				getPageChildPages(parentPageId, {includeHiddenChildPages: true}, callback);

			} else {

				callback(levelPages);

			}

		} );

	}

	/**Gets a material page object, loading it from the server if necessary
	 * @memberof material
	 * @param {string|material.PageID} page		Either the page ID string of a page in the current material or an object identifying the page
	 * @param {material.pageCallback} callback	A function to be called with the result after this function finishes.*/
	function getPage(page, callback) {

		var pageId;
		var materialId;

		if (typeof(page) === "object"){
			pageId = page.pageId;
			materialId = page.materialId;
		}
		else {
			pageId = page;
			materialId = getRequestedMaterial();
		}

		if ( getCachedPage(materialId, pageId) ) {

			callback( getCachedPage(materialId, pageId) );

		} else {

			loadPage(page, null, callback);

		}

	}

	/**Gets the root {@link Page} object of the current material structure
	 * @memberof material
	 * @param {material.pageCallback} callback  A callback function to invoke with the page*/
	function getRootPage(callback) {

		getCurrentPage(function(page) {
			if (page) {
				var rootPageId = page.breadcrump[0];
				getPage(rootPageId, callback);
			} else {
				callback(null);
			}
		});

	}

	/**Gets the {@link Page} object of the currently visible material page
	 * @memberof material
	 * @param {material.pageCallback} callback	A callback function to invoke with the page*/
	function getCurrentPage(callback) {

		if ( currentPageId ) {
			getPage(currentPageId, callback);
		} else {
			callback(null);
		}

	}

	/**Sets the ID of the current page.
	 * NOTE: this will not automatically load the page. To change to the specified page, use {@link material.changePage} instead
	 * @memberof material
	 * @param pageId {string}	The page ID to set as current*/
	function setCurrentPageId(pageId) {

		currentPageId = pageId;

	}

	/**Sets a specific page within the current material as the last viewed page
	 * @memberof material
	 * @param {string} pageId	The ID of the page to set as the last viewed page*/
	function setLastPageId(pageId) {

		getPage(pageId, function(page) {

			if ( page ) {

				jQuery.each(loadedPages[getRequestedMaterial()], function(otherPageId, otherPage) {
					otherPage.lastPage = false;
				});

				page.lastPage = true;
				lastPageId = pageId;

			}

		});

	}

	/**Gets the {@link material.Page} object of the last viewed page
	 * @memberof material
	 * @param {material.pageCallback} callback	A function to pass the page object*/
	function getLastPage(callback) {

		if ( lastPageId ) {

			getPage(lastPageId, callback);

		} else {

			console.log("Last page is not available");

		}

	}

	/**Gets a page that has the specified identifier
	 * @memberof material
	 * @param {string} identifier				The identifier to search for
	 * @param {material.pageCallback} callback	A callback to handle the page*/
	function getPageWithIdentifier(identifier, callback) {

		var loadedPageWithIdentifier = null;
		var requestedMaterial = getRequestedMaterial();

		jQuery.each(loadedPages[requestedMaterial], function(pageId, page) {

			if ( page.hasOwnProperty("identifier") ) {

				if ( page.identifier == identifier ) {
					loadedPageWithIdentifier = page;
				}

			}

		});

		if ( loadedPageWithIdentifier ) {

			callback(loadedPageWithIdentifier);

		} else {

			utils.post("/o/site-material-api/find-pages/" + encodeURIComponent(requestedMaterial), {identifier: identifier}, function(data) {

				if ( data.pageId ) {

					getPage(data.pageId, callback);

				}

			});

		}

	}

	/**Gets a list of all pages with the specified tag
	 * @memberof material
	 * @param {string} tag							The tag to search for
	 * @param {material.pageListCallback} callback	The callback to pass the resultsk*/
	function getPagesWithTag(tag, callback) {

		getCurrentPage(function(page) {

			var loadedPagesWithTag = [];
			var currentPageValid = false;
			var foundLocalPages = false;
			var requestedMaterial = getRequestedMaterial();

			if ( jQuery.inArray( tag, page.contentTags ) > -1 ) {
				currentPageValid = true;
			}

			jQuery.each(loadedPages[requestedMaterial], function(pageId, page) {

				if ( jQuery.inArray( tag, page.contentTags ) > -1 ) {
					loadedPagesWithTag.push(page);
					foundLocalPages = true;
				}

			});

			if ( foundLocalPages ) {

				console.log("Found " + loadedPagesWithTag.length + " pages with tag " + tag + " locally");

				callback(loadedPagesWithTag, currentPageValid);

			} else {

				utils.post("/o/site-material-api/find-pages/" + encodeURIComponent(requestedMaterial), {tag: tag}, function(data) {

					if ( data.pageIds ) {

						var pages = [];

						jQuery.each(data.pageIds, function(index, pageId) {
							getPage(pageId, function(page) {
								pages.push(page);
								if ( pages.length == data.pageIds.length ) {
									callback(pages, currentPageValid);
								}
							});
						});

					}

				});

			}

		});

	}

	/**Changes the page to a page in the current material that has the specified tag.
	 * If multiple pages have the tag, the first will be loaded.
	 * @memberof material
	 * @param {string} tag								The content tag of the page to change to
	 * @param {material.PageChangeOptions} [options]	Extra options for the page change operation*/
	function changePageWithContentTag(tag, options) {

		getPagesWithTag( tag, function(validPages, currentPageValid) {

			if ( validPages.length > 0 && !currentPageValid ) {
				changePage( validPages[0].id, options );
			}

		} );

	}

	/**Opens the nearest visible ancestor of the currently open page
	 * @memberof material*/
	function upOneLevel() {

		getCurrentPage(function(page) {

			backToPage( getParentPageId(page) );

		});

	}

	/**Opens the specified page or its first visible ancestor if it's hidden
	 * @memberof material
	 * @param {string|PageID} pageId		The ID of the page to open
	 * @param {pageChangeOptions} [options]	Additional page change options*/
	function backToPage(pageId, options) {

		options = jQuery.extend( { back: true }, options );

		changePage(pageId, options);

	}

	function getParentPageId(page) {

		if ( page.breadcrump.length > 1 ) {

			return page.breadcrump[ page.breadcrump.length - 2 ];

		} else {

			return null;

		}

	}

	/**Gets a {@link Page} that is the parent of the given page.
	 * @memberof material
	 * @param {material.Page} page				The page whose parent to get.
	 * @param {material.pageCallback} callback	A callback to handle the page*/
	function getParentPage(page, callback) {

		var parentId = getParentPageId(page);

		if ( parentId != null ) {
			getPage(parentId, callback);
		}

	}




	/**Get information about current material.
	 * @memberof material
	 * @param {materialCallback} callback 	A callback to handle the material.
	 */
	function getCurrentMaterial(callback) {
		if ( self.Cloubi && Cloubi.currentMaterial ) {
			callback(Cloubi.currentMaterial);
		}
	}

	/**Replaces the current browser history URL
	 * @memberof material
	 * @param {Object} stateObj	The object to associate with the current history state
	 * @param {string} url		The replacement URL*/
	function replaceCurrentHistoryUrl(stateObj, url) {
		//history.replaceState({pageId: page.id}, "", page.url);
		history.replaceState(stateObj, "", url + window.location.hash);
	}

	/**Loads an extra page
	 * @memberof material
	 * @param {material.ExtraPage} extraPage		The extra page object
	 * @param {material.PageChangeOptions} options	Extra options for the page change
	 * @parma {material.extraPageCallback} callback	A callback that is invoked after the page changes*/
	function changeToExtraPage(extraPage, options, callback) {

		options = jQuery.extend( { addPageToHistory: true }, options );


		var previousPageUrl = self.location.href;

		getCurrentPage(function(page) {


			if (page) {

				extraPage.pageUrl = utils.addUrlParameter(extraPage.pageUrl, 'pageid', page.id);
			} else {

				extraPage.pageUrl = utils.addUrlParameter(extraPage.pageUrl, 'previousurl', previousPageUrl);
			}



			if (options.addPageToHistory) {

				history.pushState( {extraPage: extraPage}, "", extraPage.pageUrl );
			}

			// We are opening page with AJAX, call loading listeners

			var promises = [];

			jQuery.each( pageStartsLoadingListeners, function(index, func) {
				promises.push( func(extraPage, options) );
			} );

			pageStartsLoadingListeners = pageStartsLoadingListeners.filter(function(func){return !func._removeOnPageChange});
			pageUpdatedListeners = pageUpdatedListeners.filter(function(func){return !func._removeOnPageChange});
			fontSizeListeners = fontSizeListeners.filter(function(func){return !func._removeOnPageChange});

			// Wait for all onPageStartsLoading promises to resolve.
			jQuery.when.apply(null, promises).done(function() {

				currentPageId = null;

				jQuery("#content").empty().load(extraPage.pageContentUrl, function() {

					jQuery.each(extraPageChangeListeners, function(index, func) {
						func(extraPage, null);
					});

					extraPageChangeListeners = extraPageChangeListeners.filter(function(func){return !func._removeOnPageChange});
					pageChangeListeners = pageChangeListeners.filter(function(func){return !func._removeOnPageChange});

					if (callback) callback(extraPage);

				});
			});
		});

	}

	/**Checks if the currently visible page is an extra page
	 * @memberof material
	 * @return {boolean}	True if an extra page is visible*/
	function isExtraPageVisible() {
		return utils.hasUrlPathPart('extra-page') || utils.hasUrlPathPart('my-page');
	}

	function invokePageChangeListeners(page, options, data){
		jQuery.each(pageChangeListeners, function(index, func) {
			func(page, options, data);
		});

		extraPageChangeListeners = extraPageChangeListeners.filter(function(func){return !func._removeOnPageChange});
		pageChangeListeners = pageChangeListeners.filter(function(func){return !func._removeOnPageChange});
	}

	/**Changes the currently open material page, loading the data from the server if necessary
	 * @memberof material
	 * @param {string|material.PageID} pageId				The ID of the page to change to
	 * @param {material.PageChangeOptions} [options]		Contains extra options for the page change operation*/
	function changePage(pageId, options) {

		options = jQuery.extend( { addPageToHistory: true, ignorePageMappers: false, loadContent: true, back: false }, options );

		var mapperFunc = pageMappers[pageId];

		if ( !options.ignorePageMappers && jQuery.isFunction(mapperFunc) ) {

			// A mapper function exists for this pageId. Just delegate everything to it.
			mapperFunc(pageId);

		} else {

			getPage(pageId, function(page) {

				if ( page.hideFromNavigation ) {

					// This page is hidden from navigation, so we cannot change directly to it.
					// Instead, we change either to the parent page or first child page, depending
					// on whether we are moving "up" or "down" in the navigation hierarchy.

					var optionsWithoutBack = jQuery.extend( {}, options, { back: false } );

					if ( options.back ) {

						// We are moving up in navigation hierarchy, open parent page instead.
						changePage( getParentPageId(page), options );

					} else {
						// We are moving down in navigation hierarchy, open first child page instead.
						getPageChildPages(page.id, {}, function(pages){
							pages = pages.filter(function(page){
								return !page.inactive && page.lockState !== 'LOCKED' && page.lockState !== 'SHOW_IN_NAVIGATION_ONLY';
							});
							
							if ( pages.length > 0 ) {
								changePage( pages[0].id, optionsWithoutBack );
							}
						})

						

					}

				} else {

					if ( ajaxLoadEnabled && sameMaterial(pageId) ) {

						// We are opening page with AJAX from current material.
						// This is the default case.

						var promises = [];

						jQuery.each( pageStartsLoadingListeners, function(index, func) {
							promises.push( func(page, options) );
						} );
						pageStartsLoadingListeners = pageStartsLoadingListeners.filter(function(func){return !func._removeOnPageChange});
						pageUpdatedListeners = pageUpdatedListeners.filter(function(func){return !func._removeOnPageChange});
						fontSizeListeners = fontSizeListeners.filter(function(func){return !func._removeOnPageChange});

						// Wait for all onPageStartsLoading promises to resolve.
						jQuery.when.apply(null, promises).done(function() {

							if ( options.addPageToHistory ) {
								history.pushState( {pageId: page.id}, "", page.url );
							}

							//Get any data parameter from pageId and forward it to listeners
							var data = {};
							if (typeof(pageId) === "object" && pageId.data){
								data = pageId.data;
							}

							if ( options.loadContent ) {

								var renderer = pageContentTypeRenderers[page.contentType ? page.contentType : 'navigation/menu'];

								if ( renderer ) {

									// We have a custom renderer for this type of page, no
									// need to load it from the server. Just call the renderer.
									jQuery("#content").empty();
									setTimeout(function() {
										renderer(page, "content", function() {
											invokePageChangeListeners(page, options, data);
										});
									}, 1);

								} else {

									// Load up-to-date version of the new page from server and then
									// call any listeners.

									// Adding cache bust to URL to prevent iOS to fetch the content from cache.
									var url = page.contentUrl;
									url.indexOf("?") == -1 ? url += "?" : url += "&";
									url += "c=" + ((new Date()).getTime());

									jQuery("#content").empty().load(url, function() {
										invokePageChangeListeners(page, options, data);
									});

								}

								// Toggle language attribute in the elements with "content" id
								if (page.language) {
									jQuery("#content").attr({lang: page.language});
								}
								else {
									jQuery("#content").removeAttr("lang");
								}


							} else {

								// Skip loading the actual page content. Just leave current page content
								// as it is and call listeners that we have "changed" the page.

								invokePageChangeListeners(page, options, data);

							}

							setCurrentPageId(typeof(pageId) === 'object' ? pageId.pageId : pageId);

						});

					} else {

						// Either we are not using AJAX (we should!) or the target page
						// is not from current material. Anyway, we must do full page load.

						//Still invoke listeners to make sure everything is saved
						var promises = [];
						jQuery.each( pageStartsLoadingListeners, function(index, func) {
							promises.push( func(page, options) );
						} );

						jQuery.when.apply(null, promises).done(function() {

							var url = page.url; 	// This is the full URL of the page.

							if ( typeof(pageId) === 'object' && pageId.urlParams ) {
								// Page has some URL parameters. Append them to the URL.
								jQuery.each(pageId.urlParams, function(key, value) {
									url = utils.addUrlParameter(url, key, value);
								})
							}

							self.location = url;

						});
					}

				}

			});

		}

		/**Checks if the page to open is in the same material as the one currently open
		 * @param {String|material.PageId} page	The ID of the page to open
		 * @return {Boolean}	true if the page is in the same material as the currently open page*/
		function sameMaterial(pageId){
			//If the ID is not an object, assume that it is a string ID in the current material
			if (typeof(pageId) !== 'object'){
				return true;
			}
			//Check if the numeric ID matches, if present
			if (pageId.numericMaterialId){
				return pageId.numericMaterialId == getCurrentMaterialId();
			}
			//Check if the
			return pageId.materialId == getRequestedMaterial();
		}

	}

	/**Registers a listener that is called whenever an extra page is shown
	 * @memberof material
	 * @param {material.extraPageCallback} func	The listener function
	 * @param {Boolean} removeOnPageChange		If true, the listener will automatically be removed after the page is changed.
	 * 											Set this to true for listeners set by page content*/
	function onExtraPageChange(func, removeOnPageChange) {
		func._removeOnPageChange = removeOnPageChange;
		extraPageChangeListeners.push(func);
	}

	/**Registers a callback listener to be invoked whenever the currently displayed page changes
	 * @memberof material
	 * @param {material.pageChangeListener} func	The callback function to invoke on page change
	 * @param {Boolean} removeOnPageChange		If true, the listener will automatically be removed after the page is changed.
	 * 											Set this to true for listeners set by page content*/
	function onPageChange(func, removeOnPageChange) {
		func._removeOnPageChange = removeOnPageChange;
		pageChangeListeners.push(func);

	}
	
	/**Removes a callback listener to be invoked when the page changes
	 * @param {material.pageChangeListener} func	A registered page load callback function*/
	function offPageChange(func) {
		var index = pageChangeListeners.indexOf(func);
		if (index > -1) {
			pageChangeListeners.splice(index, 1);
		}
	}

	/**Registers a callback listener to be invoked when a page change is requested, but before it actually takes place
	 * @memberof material
	 * @param {material.beforePageChangeListener} func	The callback function to invoke before page change
	 * @param {Boolean} removeOnPageChange				If true, the listener will automatically be removed immediately
	 * 													before the page is changed (after being invoked).
	 * 													Set this to true for listeners set by page content*/
	function onPageStartsLoading(func, removeOnPageChange) {
		func._removeOnPageChange = removeOnPageChange;
		pageStartsLoadingListeners.push(func);

	}

	/**Removes a callback listener to be invoked when a page change is requested, but before it actually takes place
	 * @memberof material
	 * @param {material.beforePageChangeListener} func	A registered page load callback function*/
	function offPageStartsLoading(func) {

		var index = pageStartsLoadingListeners.indexOf(func);
		if (index > -1) {
			pageStartsLoadingListeners.splice(index, 1);
		}

	}

	/**Registers a mapper function to redirect the user from certain pages to others
	 * @memberof material
	 * @param {string} pageId				The ID of the page to redirect from
	 * @param {material.pageMapper} func	The function to use to determine where to redirect*/
	function registerPageMapper(pageId, func) {

		pageMappers[pageId] = func;

	}

	/**Registers a callback to listen for changes in page data
	 * @memberof material
	 * @param {material.pageUpdateCallback} func	A function that is invoked whenever page data changes
	 * @param {Boolean} removeOnPageChange			If true, the listener will automatically be removed immediately before the page is changed.
	 * 												Set this to true for listeners set by page content*/
	function onPageUpdated(func, removeOnPageChange) {
		func._removeOnPageChange = removeOnPageChange;
		pageUpdatedListeners.push(func);

	}

	/**Removes a callback to listen for changes in page data
	 * @memberof material
	 * @param {material.pageCallback} func	A registered page update callback function*/
	function offPageUpdated(func) {

		var index = pageUpdatedListeners.indexOf(func);
		if (index > -1) {
			pageUpdatedListeners.splice(index, 1);
		}

	}

	/**Sets up a playlist change listener
	 * @memberof material
	 * @param {material.playlistCallback} func	A function that will be called whenever a playlist is set or removed.
	 * 											The function parameter is the newly set playlist.
	 * 											When the playlist is removed, the function will be invoked with null.*/
	function onPlaylistChange(func) {
		playlistChangeListeners.push(func);
	}

	function getWaitingObj(type, waitingObjs) {
		var waitingObj = waitingObjs[type];

		if (!waitingObj) {
			waitingObj = {};
			waitingObjs[type] = waitingObj;
			waitingObj.promise = new $.Deferred();
		}

		return waitingObj;
	}

	function setWaitingObjReady(waitingObj, property, value) {
		waitingObj[property] = value;
		waitingObj.promise.resolve();
	}

	function getWaitingObjProperty(waitingObj, property, callback) {

		waitingObj.promise.then(function() {
			callback(waitingObj[property]);
		});

	}

	/**Sets a renderer
	 * @memberof material
	 * @param {string} type		The type of the renderer
	 * @param {any} renderer	The renderer*/
	function setRenderer(type, renderer) {

		var rendererObj = getWaitingObj(type, renderers);
		setWaitingObjReady(rendererObj, 'renderer', renderer);

	}

	/**Gets a renderer when it becomes available
	 * @memberof material
	 * @param {string} type							The type of renderer to get
	 * @param {material.anyCallback} getCallback	A callback to receive the renderer*/
	function getRenderer(type, getCallback) {

		getWaitingObjProperty( getWaitingObj(type, renderers), 'renderer', getCallback );

	}

	/**Sets custom page data
	 * @memberof material
	 * @param {string} type		The type of data
	 * @param {any} renderer	The data*/
	function setPageCustomData(type, customPageData) {

		var waitingObj = getWaitingObj(type, pageCustomDatas);
		setWaitingObjReady(waitingObj, 'customPageData', customPageData);
	}

	/**Sets custom page data when it becomes available
	 * @memberof material
	 * @param {string} type							The type of data to get
	 * @param {material.anyCallback} getCallback	A callback to receive the data*/
	function getPageCustomData(type, getCallback) {

		getWaitingObjProperty( getWaitingObj(type, pageCustomDatas), 'customPageData', getCallback );
	}

	/**Adds or removes a bookmark on a page
	 * @memberof material
	 * @param {string} pageId	The ID of a page in the current material
	 * @param {boolean} enabled	true if the bookmark should be set, false if it should be removed*/
	function setBookmark(pageId, enabled) {

		var requestedMaterial = getRequestedMaterial();

		if ( requestedMaterial ) {

			var data = {};

			data[pageId] = enabled;

			utils.post("/o/site-material-api/set-bookmarks/" + encodeURIComponent(requestedMaterial), data);

			getPage(pageId, function(page) {

				page.bookmarked = enabled;

				triggerPageChanged(page, ["bookmarked"]);

			});

		}

	}

	/**Sets whether the content of material pages can be loaded with AJAX and inserted into the current page or if the browser should
	 * actually navigate to the content URL
	 * @memberof material
	 * @param {boolean} value	If true, new page content will be loaded with AJAX, if false, the browser will load the content as a full web page*/
	function setAjaxLoadEnabled(value) {

		ajaxLoadEnabled = value;

	}

	/**Gets the achievements for a page
	 * @memberof material
	 * @param {material.Page} page	The page data object
	 * @return {Object}	The achievements for the page, as determined by the current {@link material.AchievementCalculator}*/
	function getAchievements(page) {
		return _achievementCalculator(page);
	}

	/**Sets the achievement calculator
	 * @memberof material
	 * @param {material.AchievementCalculator} calculator	The calculator to register*/
	function registerAchievementCalculator(calculator) {
		_achievementCalculator = calculator;
	}


	/**Sets a renderer for give page content type. Whenever a page changes and the content type of the
	 * new page is as given, this renderer function will be called instead of loading page content from the server.
	 * @memberof material
	 * @param {string} contentType  The content type to register the renderer with. For example, 'navigation/menu'.
	 * @param {material.PageContentTypeRenderer} renderer 	The renderer function.
	 */
	function registerPageContentTypeRenderer(contentType, renderer) {
		pageContentTypeRenderers[contentType] = renderer;
	}


	/**Gets the current custom font size
	 * @memberof material
	 * @return {int}	The current font size*/
	function getFontSize() {
		return fontSize;
	}

	/**Sets a custom font size and notifies listeners
	 * @memberof material
	 * @param {int} size	The size to set*/
	function setFontSize(size) {
		fontSize = size;
		jQuery.each(fontSizeListeners, function(index, func) {
			func(size);
		});
	}

	/**Registers a listener for font size changes
	 * @memberof material
	 * @param {material.intCallback} callback	The callback to receive the new font value*/
	function onFontSizeChange(callback, removeOnPageChange) {
		callback._removeOnPageChange = removeOnPageChange;
		fontSizeListeners.push(callback);
	}

	/**Initializes the material state, sets up event listeners and calls all {@link materialReadyListener}s
	 * @memberof material
	 * @param {string} currentPageId	The ID of the initial page
	 * @param {string} materialId		The ID of the initial material
	 * @param {int} loadPagesByLevel 	Tells server how many levels down are loaded with root page*/
	function init(currentPageId, materialId, loadPagesByLevel) {
		if ( currentPageId ) {
			setCurrentPageId(currentPageId);
		}

		if ( materialId ) {
			currentMaterialId = materialId;
		}

		window.onpopstate = function(event) {

			if ( event.state ) {

				if ( event.state.pageId ) {

					changePage( event.state.pageId, {
						addPageToHistory: false,
						ignorePageMappers: true
					} );
				} else if (event.state.extraPage) {
					changeToExtraPage(event.state.extraPage, {addPageToHistory: false});

				}

			}

		}

		if ( currentMaterialId ) {

			jQuery.each(materialReadyListeners, function(index, func) {
				func();
			});

			materialReadyListeners = null;

		} else {
			if(loadPagesByLevel) {
				loadPagesWithLevel(loadPagesByLevel, function() {

					jQuery.each(materialReadyListeners, function(index, func) {
						func();
					});
	
					materialReadyListeners = null;
	
				});
			}
			else {
				getCurrentPage(function() {

					jQuery.each(materialReadyListeners, function(index, func) {
						func();
					});
	
					materialReadyListeners = null;
	
				});
			}	
		}
	}

	/**Registers a callback to be invoked when the material becomes availabe
	 * @memberof material
	 * @param {Function} callback	A function to invoke when the material is available*/
	function onMaterialReady(callback) {
		if ( materialReadyListeners ) {
			materialReadyListeners.push(callback);
		} else {
			callback();
		}
	}

	/**Gets the numeric ID of the material containing the current page
	 * @memberof material
	 * @return {long}	The ID of the current material*/
	function getCurrentMaterialId(){
		return loadedPages[getRequestedMaterial()]._materialId;
	}

	/**Gets the page ID of the current page
	 * @memberof material
	 * @return {string}	The ID of the current page*/
	function getCurrentPageId(){
		return currentPageId;
	}

	/**Gets the content type string of the material containing the current page
	 * @memberof material
	 * @return {string}	The content type of the current material*/
	function getCurrentMaterialContentType(){
		return loadedPages[getRequestedMaterial()]._contentType;
	}

	/**Sets a playlist as the currently active playlist
	 * @memberof material
	 * @param {?material.Playlist} playlist	An object representing a playlist or null if the current playlist should be removed
	 * @param {?integer} pageIndex			The number of the initial page to show*/
	function setCurrentPlaylist(playlist, pageIndex){
		currentPlaylist = playlist;

		var pageBeforePlaylistChange = {
			pageId: currentPageId,
			materialId: getRequestedMaterial()
		};	

		if (playlist){	

			//Use the playlist as a page source and load the first page
			currentPageSource = new PlaylistPageSource();
			if ( typeof(pageIndex) === 'number' ){
				currentPageSource.setCurrentPageIndex(pageIndex -1);
			}
			else {
				pageIndex = 0;
			}
			changeToNextPage();
		}
		else {
			//Switch back to default material page source
			currentPageSource = new DefaultPageSource();
					
		}

		//Inform listeners about playlist change
		jQuery.each(playlistChangeListeners, function(index, func) {
			func(playlist, pageBeforePlaylistChange, pageIndex);
		});
	}

	/**Gets the currently active playlist
	 * @memberof material
	 * @return {?material.Playlist}	An object representing the currently active playlist or null if no playlist is active*/
	function getCurrentPlaylist(){
		return currentPlaylist;
	}

	/**Moves to the next page as determined by the current {@link material.PageSource}
	 * @memberof material*/
	function changeToNextPage(){
		currentPageSource.getNextPageId(function(id){
			if (id){
				changePage(id, {});
			}
		});
	}

	/**Moves to the previous page as determined by the current {@link material.PageSource}
	 * @memberof material*/
	function changeToPreviousPage(){
		currentPageSource.getPreviousPageId(function(id){
			if (id){
				changePage(id, {});
			}
		});
	}

	/**Sets the current {@link material.PageSource}
	 * @memberof material
	 * @param {material.PageSource} source	The page source to set*/
	function registerPageSource(source){
		currentPageSource = source;
	}

	/**Gets the current {@link material.PageSource}, is any.
	 * @memberof material
	 * @return {material.PageSource} The page source.*/
	function getPageSource() {
		return currentPageSource;
	}

	/**@deprecated call {@link material.changePage} with a {@link material.PageID} object instead
	 * @memberof material*/
	function changeMaterial(requestedMaterial, callback){
		currentRequestedMaterial = requestedMaterial;
		callback();
	}

	/**Gets the permissions that the current user has for the current material
	 * @memberof material
	 * @param {material.permissionListCallback} callback	A callback to handle the permissions*/
	function getCurrentMaterialPermissions(callback){
		if (materialPermissions){
			callback(materialPermissions);
		}
		else {
			var requestedMaterial = getRequestedMaterial();
			if (requestedMaterial){
				utils.get("/o/site-material-api/permissions/" + encodeURIComponent(requestedMaterial), function(response){
					if (response.permissions){
						materialPermissions = response.permissions;
						callback(materialPermissions);
					}
					else {
						callback([]);
					}
				});
			}
			else {
				callback([]);
			}
		}
	}

	/**Tells wheter or not load scores along with the pages. If the theme never uses
	 * page.scores attribute, then this can be set to true.
	 * @memberof material
	 * @param {boolean} skipLoadingScores	True, to not load page scores along with pages.*/
	function setSkipLoadingScores(skipLoadingScores) {
		performanceHints.skipLoadingScores = skipLoadingScores;
	}

	/** If Analytics Framework isn't installed on the server, the server can be configured
	 * to either use the pages-with-scores endpoint or not load scores at all in material.json.
	 * Returns true to use the pages-with-scores endpoint, false to not load scores.
	 * @memberof material 
	 * @return {boolean} */
	function loadPageScores() {
		return Cloubi.pageScoreSettingLoadScores;
	}

	/** If Analytics Framework is installed on the server, this can be used to not load scores from it.
	 * True to not use Analytics Framework, false to use it. Configurable on the server.
	 * @memberof material 
	 * @return {boolean} */
	function doNotLoadFromAnalytics() {
		return Cloubi.doNotLoadScoresFromAnalytics;
	}

	/** Tells whether or not Analytics Framework is installed by reading a global JS variable
	 * from the document head, which can be utilized to load PagesScores from 
	 * the Analytics Framework instead of an endpoint. Also,
	 * if the user isn't logged into Cloubi, such as with Otava's open demoproducts,
	 * set isAnalyticsFrameworkInstalled to false to not load scores from the task-status microservice.
	 * @memberof material 
	 * @return {boolean}	True, if Analytics Framework is installed on the server. */
	function isAnalyticsFrameworkInstalled() {
		if(Cloubi.analyticsFrameworkAvailable && themeDisplay.isSignedIn()) {
			return Cloubi.analyticsFrameworkAvailable;
		} else {
			return false;
		}
	}
	
	/**Gets metadata of the current material
	 * @memberof material
	 * @param {material.metadataCallback} callback	A callback function to handle metadata*/
	function getMetadataForCurrentMaterial(callback) {
		if (metadata){
			callback(metadata);
		}
		else {
			var requestedMaterial = getRequestedMaterial();

			if ( requestedMaterial ) {

				var url = "/o/site-material-api/metadata-for-current-material/" + encodeURIComponent(requestedMaterial);

				utils.get(url, function(response){
					if (response){
						metadata = response;
						callback(metadata);
					}
					else {
						callback({});
					}
				});
			}
			else {
				callback({});
			}
		}
	}

	return {
		init: init,
		getPage: getPage,
		getRootPage: getRootPage,
		getCurrentPage: getCurrentPage,
		getCurrentMaterialId: getCurrentMaterialId,
		getCurrentMaterialContentType: getCurrentMaterialContentType,
		getCurrentPageId: getCurrentPageId,
		setCurrentPageId: setCurrentPageId,
		setLastPageId: setLastPageId,
		changePage: changePage,
		onPageChange: onPageChange,
		offPageChange: offPageChange,
		onPageStartsLoading: onPageStartsLoading,
		offPageStartsLoading: offPageStartsLoading,
		setAjaxLoadEnabled: setAjaxLoadEnabled,
		changePageWithContentTag: changePageWithContentTag,
		registerPageMapper: registerPageMapper,
		getPageLevelPages: getPageLevelPages,
		getPageChildPages: getPageChildPages,
		onPageUpdated: onPageUpdated,
		offPageUpdated: offPageUpdated,
		setBookmark: setBookmark,
		getRequestedMaterial: getRequestedMaterial,
		updatePageScore: updatePageScore,
		markPageVisited: markPageVisited,
		updatePageScoreFromJSON: updatePageScoreFromJSON,
		updatePageLockState: updatePageLockState,
		updatePage: updatePage,
		backToPage: backToPage,
		upOneLevel: upOneLevel,
		setRenderer: setRenderer,
		getRenderer: getRenderer,
		setPageCustomData: setPageCustomData,
		getPageCustomData: getPageCustomData,
		getLastPage: getLastPage,
		registerAchievementCalculator: registerAchievementCalculator,
		getAchievements: getAchievements,
		getFontSize: getFontSize,
		setFontSize: setFontSize,
		onFontSizeChange: onFontSizeChange,
		getGamificationStatus: getGamificationStatus,
		onExtraPageChange: onExtraPageChange,
		changeToExtraPage: changeToExtraPage,
		isExtraPageVisible: isExtraPageVisible,
		onMaterialReady: onMaterialReady,
		replaceCurrentHistoryUrl: replaceCurrentHistoryUrl,
		triggerPageChanged: triggerPageChanged,
		getPageWithIdentifier: getPageWithIdentifier,
		getPagesWithTag: getPagesWithTag,
		refreshPageScores: refreshPageScores,
		onPlaylistChange: onPlaylistChange,
		setCurrentPlaylist: setCurrentPlaylist,
		getCurrentPlaylist: getCurrentPlaylist,
		changeToNextPage: changeToNextPage,
		changeToPreviousPage: changeToPreviousPage,
		registerPageSource: registerPageSource,
		getPageSource: getPageSource,
		changeMaterial: changeMaterial,
		registerPageContentTypeRenderer: registerPageContentTypeRenderer,
		getParentPage: getParentPage,
		getCurrentMaterial: getCurrentMaterial,
		getCurrentMaterialPermissions: getCurrentMaterialPermissions,
		setSkipLoadingScores: setSkipLoadingScores,
		getMaterialISBNs: getMaterialISBNs,
		getMetadataForCurrentMaterial: getMetadataForCurrentMaterial
	};



});





define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/adaptivity', ['./utils', './material'], function(utils, material) {

	/**
	 Contains functions for interacting with Cloubi's adaptivity features such as task packages.
	 <br><br>
	 These function are intended to be used within materials. If used outside materials, make sure to always manually provide material and page IDs.
	 <br><br>

	 To use this API, load it like this:

	 <pre><code>
	require(['fi.cloubi.frontend/adaptivity'], function(adaptivity) {
		adaptivity.getCurrentTaskPackagePage(function(response) {
			console.log(response);
		});
	});
	 </code></pre>

	 * @namespace adaptivity */

	/**Represents the current state of a task package
	 * @memberof adaptivity
	 * @typedef {object} TaskPackageState
	 * @property {string} [pageId]			The ID of the page that should be shown to the user
	 * @property {string} [url]				A URL that can be used to load the contents of the page
	 * @property {boolean} canSkip			True if the user can skip ahead and load the next page without finishing the current one
	 * @property {boolean} canReverse		True if the user can go backwards in the task package
	 * @property {boolean} canReset			True if the user is currently allowed to reset their progress in the task package
	 * @property {boolean} hasNext			True if there are more pages in the package after the current one
	 * @property {number} currentSection	The number of the task package section that the user is in
	 * @property {number} sectionCount		The total number of sections in this package
	 * @property {string} strategyId 		The selected strategy ID
	 * @property {number} [currentLevel]	The user's current level
	 * @property {object} [strategyConfig]	The selected strategy's config*/


	/**Represents a keycard that can be used to access locked parts of the material
	 * @memberof adaptivity
	 * @typedef {object} Keycard
	 * @property {number} id			The ID of the keycard
	 * @property {string} name			The name of the keycard
	 * @property {string} description	The description of the keycard
	 * @property {string} imageUrl		An URL that can be used to show an image representing this keycard
	 * @property {boolean} owned		true if the current user has this keycard, false otherwise*/

	/**A server response object
	 * @memberof adaptivity
	 * @mixin
	 * @typedef {Object} Response
	 * @property {boolean} success		True if the request was successful
	 * @property {string[]} [errors]	An array of errors that were encountered while processing the request*/

	/**A generic callback that receives information about an operation's success or failure
	 * @memberof adaptivity
	 * @callback GenericCallback
	 * @param {adaptivity.Response} response	The server response*/

	/**A callback that receives information about a task package's state
	 * @memberof adaptivity
	 * @callback TaskStateCallback
	 * @param {adaptivity.Response} response					The server response
	 * @param {adaptivity.TaskPackageState} [response.state]	The current task package state*/

	/**A callback that receives information about the user's keycards
	 * @memberof adaptivity
	 * @callback KeycardsCallback
	 * @param {adaptivity.Response} response				The server response
	 * @param {adaptivity.Keycard[]} [response.keycards]	An array of keycards*/

	/**A callback that receives information about the user's keycards as well as a list of pages affected by those keycards
	 * @memberof adaptivity
	 * @callback PendingKeycardsCallback
	 * @param {adaptivity.Response} response							The server response
	 * @param {adaptivity.Keycard[]} [response.keycards]				An array of keycards
	 * @param {Object.<number, material.LockAndReason>} affectedPages	An object mapping IDs of affected pages to their current lock states*/

	/**Material ID request parameter*/
	var PARAM_MATERIAL = "materialId";
	/**Page ID request parameter*/
	var PARAM_PAGE = "pageId";

	var PARAM_KEYCARDS = "keycards";

	var PARAM_AFFECTED_PAGES = "affectedPages";
	var PARAM_LOCK_STATE = "lockState";
	var PARAM_LOCK_REASONS = "lockReasons";

	/**Task package servlet endpoint*/
	var TASK_PACKAGE_ENDPOINT = "/o/adaptive-task-package/";

	var KEYCARDS_ENDPOINT = "/o/adaptivity-keycards/"

	/**ID of currently active task package page*/
	var currentTaskPage = null;
	/**Page ID of last active task package*/
	var activePackage = null;
	/**Callbacks for finished tasks*/
	var taskDoneListeners = [];
	/**Callbacks for next task package page request*/
	var requestChangeToNextTaskPackagePageListeners = [];
	/**Callbacks for previous task package page request*/
	var requestChangeToPreviousTaskPackagePageListeners = [];

	material.onPageChange(function(page){
		if (page.id !== activePackage){
			//Reset visible task
			currentTaskPage = null;
			//remove any single-page callbacks
			taskDoneListeners = taskDoneListeners.filter(function(listener){
				return !listener.cleanOnPageChange;
			});
			requestChangeToNextTaskPackagePageListeners = requestChangeToNextTaskPackagePageListeners.filter(function(listener){
				return !listener.cleanOnPageChange;
			});
			requestChangeToPreviousTaskPackagePageListeners = requestChangeToPreviousTaskPackagePageListeners.filter(function(listener){
				return !listener.cleanOnPageChange;
			});
		}
	});
	//Listen to score updates
	material.onPageUpdated(function(page){
		//Don't do anything unless a task package page is currently visible
		if (currentTaskPage){
			//If the page is done, invoke listeners
			if (currentTaskPage === page.id && (page.scores.progress === 1 || page.scores.scoreMax === 0)){
				$.each(taskDoneListeners, function(index, listener){
					listener(page);
				});
			}
			//If the page is the package page, get up-to-date scores for the currently visible task
			else if (page.id === material.getCurrentPageId()){
				material.getPage(currentTaskPage, function(taskPage){
					material.refreshPageScores(taskPage);
				});
			}
		}
	});

	/**Registers a callback to be invoked whenever the user finishes a task package page or this API is used to load a task package page
	 * that contains no unfinished tasks.
	 * @memberof adaptivity
	 * @param {material.pageCallback} callback	The callback to invoke. Receives the page object of the finished task package page.
	 * @param {boolean} [cleanOnPageChange]		If true, the callback will be unregistered when the user navigates to a different material page*/
	function onTaskPackageTaskFinished(callback, cleanOnPageChange){
		callback.cleanOnPageChange = cleanOnPageChange;
		taskDoneListeners.push(callback);
	}

	/**Gets the page ID of the last task package page loaded through this API
	 * @memberof adaptivity
	 * @return {?string} The currently active task package page or null if no task package page has been loaded on the current material page*/
	function getCurrentTaskPackagePageId(){
		return currentTaskPage;
	}

	/**Loads the next page from the task package.
	 * Causes the error "invalid-page" if the specified page is not an adaptive task package page.
	 * @memberof adaptivity
	 * @param {adaptivity.TaskStateCallback} callback	A callback to receive the task package state after moving to the next page
	 * @param {string} [requestedMaterial]				The requested material ID of the material containing the page (default: current material)
	 * @param {string} [pageId]							The page ID of the task package page (default: current page ID)*/
	function getNextTaskPackagePage(callback, requestedMaterial, pageId){
		taskPackageAction("getNext", callback, requestedMaterial, pageId);
	}

	/**Loads the current page from the task package.
	 * Causes the error "invalid-page" if the specified page is not an adaptive task package page.
	 * @memberof adaptivity
	 * @param {adaptivity.TaskStateCallback} callback	A callback to receive the task package state
	 * @param {string} [requestedMaterial]				The requested material ID of the material containing the page (default: current material)
	 * @param {string} [pageId]							The page ID of the task package page (default: current page ID)*/
	function getCurrentTaskPackagePage(callback, requestedMaterial, pageId){
		taskPackageAction("getCurrent", callback, requestedMaterial, pageId);
	}
	/**Loads the previous page from the task package.
	 * Causes the error "invalid-page" if the specified page is not an adaptive task package page.
	 * @memberof adaptivity
	 * @param {adaptivity.TaskStateCallback} callback	A callback to receive the task package state
	 * @param {string} [requestedMaterial]				The requested material ID of the material containing the page (default: current material)
	 * @param {string} [pageId]							The page ID of the task package page (default: current page ID)*/
	function getPreviousTaskPackagePage(callback, requestedMaterial, pageId){
		taskPackageAction("getPrevious", callback, requestedMaterial, pageId);
	}
	/**Resets the user's progress in a task package.
	 * Causes the error "invalid-page" if the specified page is not an adaptive task package page.
	 * @memberof adaptivity
	 * @param {adaptivity.GenericCallback} callback		A callback to invoke after the package has been reset
	 * @param {string} [requestedMaterial]				The requested material ID of the material containing the page (default: current material)
	 * @param {string} [pageId]							The page ID of the task package page (default: current page ID)*/
	function resetTaskPackage(callback, requestedMaterial, pageId){
		taskPackageAction("reset", function(response){
			pageId = pageId || material.getCurrentPageId();
			material.getPage(pageId, function(page){
				function refreshChildrenRecursively(parentPage) {
					parentPage.childPages.forEach(function(childPageId) {
						material.getPage(childPageId, function(childPage) { 
							material.refreshPageScores(childPage);
							refreshChildrenRecursively(childPage);
						});

					});
				}
				refreshChildrenRecursively(page);
			});
			if (callback) {
				callback(response);
			}
		}, requestedMaterial, pageId);
	}

	/**Sends a request to the task package JSON API
	 * @param {string} action							The action name to append to the base servlet URL
	 * @param {adaptivity.TaskStateCallback} callback	A callback to handle the response
	 * @param {string} [requestedMaterial]				The requested material ID of the material containing the page (default: current material)
	 * @param {string} [pageId]							The page ID of the task package page (default: current page ID)*/
	function taskPackageAction(action, callback, requestedMaterial, pageId){
		var params = {}
		params[PARAM_MATERIAL] = requestedMaterial || material.getRequestedMaterial();
		params[PARAM_PAGE] = pageId || material.getCurrentPageId();
		activePackage = params[PARAM_PAGE];

		//Send request
		utils.post(TASK_PACKAGE_ENDPOINT + action, params, function(response){
			//If the response has a package state, set the response page as the current task package page
			if (response.state && response.state.pageId){
				currentTaskPage = response.state.pageId;
				callback(response);
			}
			else {
				callback(response);
			}
			//Refresh package page scores to update task package progress
			material.getPage(params[PARAM_PAGE], function(page){
				material.refreshPageScores(page);
			});
		});
	}

	/**Gets a list of all keycards in a material
	 * @memberof adaptivity
	 * @param {adaptivity.KeycardsCallback} [callback]	A callback to receive the keycards
	 * @param {number} [materialId=current material ID]	The ID of the material whose keycards should be retrieved*/
	function getAllKeycards(callback, materialId){
		keycardsAction('allKeycards', callback, materialId);
	}

	/**Gets a list of all keycards that the user has in a material
	 * @memberof adaptivity
	 * @param {adaptivity.KeycardsCallback} [callback]	A callback to receive the keycards
	 * @param {number} [materialId=current material ID]	The ID of the material whose keycards should be retrieved*/
	function getOwnedKeycards(callback, materialId){
		keycardsAction('ownedKeycards', callback, materialId);
	}

	/**Gets a list of all keycards in a material that have not yet been presented to the user
	 * @memberof adaptivity
	 * @param {adaptivity.PendingKeycardsCallback} callback	A callback to receive the keycards
	 * @param {object} [options]							An object containing extra options
	 * @param {boolean} [options.autoUpdatePageState=true]	If true, this function will automatically update page state to reflect any changes to lock status
	 * @param {boolean} [options.autoNotify=true]			If true, this function will automatically call markKeycards for all received keycards
	 * @param {number} [materialId=current material ID]		The ID of the material whose keycards should be retrieved*/
	function getPendingKeycards(callback, options, materialId){
		options = $.extend({
			autoUpdatePageState: true,
			autoNotify: true
		}, options);
		keycardsAction('pendingKeycards', function(response){
			if (response.success){
				if (options.autoUpdatePageState && response[PARAM_AFFECTED_PAGES]) {
					$.each(response[PARAM_AFFECTED_PAGES], function(id, state) {
						material.updatePageLockState(id, state[PARAM_LOCK_STATE], state[PARAM_LOCK_REASONS]);
					});
				}
				if (options.autoNotify && response[PARAM_KEYCARDS] && response[PARAM_KEYCARDS].length > 0) {
					markKeycards( response[PARAM_KEYCARDS].map(function (kc){
						return kc.id;
					}) );
				}
			}
			if (callback) {
				callback(response);
			}
		}, materialId);
	}

	/**Sends a request to the keycards API
	 * @param {string} action								The action URL parameter of the request
	 * @param {function} [callback]							A callback to handle the response
	 * @param {number} [materialId=current material ID]		The ID of the material*/
	function keycardsAction(action, callback, materialId){
		var params = {}
		params[PARAM_MATERIAL] = materialId || material.getCurrentMaterialId();

		utils.post(KEYCARDS_ENDPOINT + action, params, function(response){
			if (callback) {
				callback(response);
			}
		});
	}

	/**Marks keycards as notified. Notified keycards will not be fetched with getPendingKeycards.
	 * @memberof adaptivity
	 * @param {number[]} ids							The IDs of the keycards to mark as notified
	 * @param {adaptivity.GenericCallback} callback		A callback to invoke after the keycards have been marked*/
	function markKeycards(ids, callback){
		var params = {}
		params[PARAM_KEYCARDS] = ids;

		utils.post(KEYCARDS_ENDPOINT + "markKeycards", params, function(response){
			if (callback) {
				callback(response);
			}
		});
	}

	/**Registers a callback to be invoked whenever some component calls requestChangeToNextTaskPackagePage method
	 * @memberof adaptivity
	 * @param {function} callback	The callback to invoke.
	 * @param {boolean} [cleanOnPageChange]		If true, the callback will be unregistered when the user navigates to a different material page*/
	function onRequestChangeToNextTaskPackagePage(callback, cleanOnPageChange){
		callback.cleanOnPageChange = cleanOnPageChange;
		requestChangeToNextTaskPackagePageListeners.push(callback);
	}

	/**Registers a callback to be invoked whenever some component calls requestChangeToPreviousTaskPackagePage method
	 * @memberof adaptivity
	 * @param {function} callback	The callback to invoke.
	 * @param {boolean} [cleanOnPageChange]		If true, the callback will be unregistered when the user navigates to a different material page*/
	function onRequestChangeToPreviousTaskPackagePage(callback, cleanOnPageChange){
		callback.cleanOnPageChange = cleanOnPageChange;
		requestChangeToPreviousTaskPackagePageListeners.push(callback);
	}

	/**Components outside of adaptive tasks package's user interface can request moving to next page.
	 * It's up to user interface implementation if it wants to support this by registering listener with onRequestChangeToNextTaskPackagePage
	 * @memberof adaptivity
	 */
	function requestChangeToNextTaskPackagePage() {
		$.each(requestChangeToNextTaskPackagePageListeners, function(index, listener){
			listener();
		});
	}

	/**Components outside of adaptive tasks packages user interface can request moving to previous page.
	 * It's up to user interface implementation if it wants to support this by registering listener with onRequestChangeToPreviousTaskPackagePage
	 * @memberof adaptivity
	 */
	function requestChangeToPreviousTaskPackagePage() {
		$.each(requestChangeToPreviousTaskPackagePageListeners, function(index, listener){
			listener();
		});
	}

	return {
		onTaskPackageTaskFinished: onTaskPackageTaskFinished,
		getNextTaskPackagePage: getNextTaskPackagePage,
		getCurrentTaskPackagePage: getCurrentTaskPackagePage,
		getPreviousTaskPackagePage: getPreviousTaskPackagePage,
		resetTaskPackage: resetTaskPackage,
		getCurrentTaskPackagePageId: getCurrentTaskPackagePageId,
		onRequestChangeToNextTaskPackagePage: onRequestChangeToNextTaskPackagePage,
		onRequestChangeToPreviousTaskPackagePage: onRequestChangeToPreviousTaskPackagePage,
		requestChangeToNextTaskPackagePage: requestChangeToNextTaskPackagePage,
		requestChangeToPreviousTaskPackagePage: requestChangeToPreviousTaskPackagePage,
		getAllKeycards: getAllKeycards,
		getOwnedKeycards: getOwnedKeycards,
		getPendingKeycards: getPendingKeycards,
		markKeycards: markKeycards
	}
});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/search', ['./utils', './material'], function(utils, material) {
	
	/**Contains functions for searching materials and notes. To use this API, load it like this:
	 
	 <pre><code>
	require(['fi.cloubi.frontend/search'], function(search) {
		search.searchMaterial(function(response) {
			console.log(response);
		});
	});
	 </code></pre>
	 
	 * @namespace search */
	
	/**Represents a single search result
	 * @memberof search
	 * @typedef {object} Result
	 * @property {string} material						The ID of the material containing the result, in requested material format
	 * @property {string} page							The ID of the material page containing the result
	 * @property {string} [relatedContent]				The ID of the related content file containing the result
	 * @property {object} highlights					An array containing the matching fields with the matching terms highlighted 
	 * 													with <code>&lt;span class="term"&gt;match&lt;/span&gt;</code>
	 * @property {string} highlights.title				An HTML fragment containing the title with highlights
	 * @property {string} highlights.contents			An HTML fragment containing the contents with highlights
	 * @property {string} highlights.description		An HTML fragment containing the description with highlights
	 * @property {string} highlights.notes				An HTML fragment containing a note with highlights
	 * @property {string} [time]						A human-readable timestamp to display with the result
	 * @property {object} tags							An object mapping page tags to booleans indicating whether the tag matches the query or not
	 * @property {search.BreadcrumbItem[]} breadcrumb	The breadcrumb of this page
	 * @property {boolean} bookmarked					True if this page is bookmarked, false otherwise
	 * @property {string} materialTitle					The title of the material containing this page
	 * @property {string} url							An URL that can be used to open this page*/
	
	/**Represents an item in a page breadcrumb
	 * @memberof search
	 * @typedef {object} BreadcrumbItem
	 * @property {string} page	The page ID of this breadcrumb item
	 * @property {string} title	The title of this breadcrumb item*/
	
	/**Represents errors that can occur while using this API
	 * Possible values:
	 * <ul>
	 * <li><b>empty-query</b>: No search terms provided</li>
	 * <li><b>invalid-material</b>: The material specified does not exist or is inaccessible</li>
	 * </ul>
	 * @memberof search
	 * @typedef {string} Error*/
	
	/**Represents different fields that can be searched
	 * Possible values:
	 * <ul>
	 * <li><b>title</b>: Page title</li>
	 * <li><b>contents</b>: Page content</li>
	 * <li><b>description</b>: Page description</li>
	 * <li><b>notes</b>: The user's notes on the page</li>
	 * <li><b>tags</b>: Page tags</li>
	 * </ul>
	 * @memberof search
	 * @typedef {string} Filter*/
	
	/**A callback for search results
	 * @memberof search
	 * @callback ResultsCallback
	 * @param {object} response						The server response object
	 * @param {search.Result[]} [response.results]	The search results
	 * @param {search.Error[]} response.errors		Contains any errors encountered during the search*/
	
	/**A callback for an array of filters
	 * @memberof search
	 * @callback FiltersCallback
	 * @param {search.Filter[]} filters		The filter list*/
	
	/**Server endpoint base URL*/
	var ENDPOINT = "/o/search/";
	
	/**Material ID parameter name*/
	var PARAM_MATERIAL = "material";
	/**Search query parameter name*/
	var PARAM_QUERY = "query";
	/**Filter array parameter name*/
	var PARAM_FILTERS = "filters";
	
	/**Currently enabled filters*/
	var enabledFilters = null;
	
	/**Searches a material
	 * @memberof search
	 * @param {string} query							The search query
	 * @param {search.ResultsCallback} [callback]		The callback for the results
	 * @param {search.Filter[]} [filters]				A list of filters determining which fields to search. 
	 * 													If empty or null, all enabled fields will be searched.
	 * @param {number} [materialId=Current material ID]	The ID of the material to search in*/
	function searchMaterial(query, callback, filters, materialId){
		materialId = materialId || material.getCurrentMaterialId();
		var data = {}
		data[PARAM_QUERY] = query;
		data[PARAM_FILTERS] = filters;
		data[PARAM_MATERIAL] = materialId;
		utils.post(ENDPOINT + "search-material", data, callback);
	}
	
	/**Searches all materials
	 * @memberof search
	 * @param {string} query							The search query
	 * @param {search.ResultsCallback} [callback]		The callback for the results
	 * @param {search.Filter[]} [filters]				A list of filters determining which fields to search. 
	 * 													If empty or null, all enabled fields will be searched.*/
	function searchAll(query, callback, filters){
		var data = {}
		data[PARAM_QUERY] = query;
		data[PARAM_FILTERS] = filters;
		utils.post(ENDPOINT + "search-all", data, callback);
	}
	
	/**Reindexes a material. This is intended to be used by editors who need to manually update the search index to reflect the current
	 * state of the material and therefore works only if the user has edit rights to the material.
	 * @memberof search
	 * @param {function} [callback]						A callback that is invoked after the reindexing has been requested. 
	 * 													Receives a single boolean parameter indicating whether the reindexing was started.
	 * @param {number} [materialId=Current material ID]	The ID of the material to reindex*/
	function reindex(callback, materialId){
		materialId = materialId || material.getCurrentMaterialId();
		var data = {}
		data[PARAM_MATERIAL] = materialId;
		utils.post(ENDPOINT + "reindex", data, function(){callback(true)}, function(){callback(false)});
	}
	
	/**Gets the list of currently available search filters
	 * @memberof search
	 * @param {search.FiltersCallback} callback	A callback to receive the list of enabled filters*/
	function getEnabledFilters(callback){
		if (enabledFilters == null){
			utils.get(ENDPOINT + "enabled-filters", function(res){
				enabledFilters = res[PARAM_FILTERS];
				callback(enabledFilters);
			});
		}
		else {
			callback(enabledFilters);
		}
	}
	
	return {
		searchMaterial: searchMaterial,
		searchAll: searchAll,
		reindex: reindex,
		getEnabledFilters: getEnabledFilters
	}
});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/dialog', ['./utils'], function(utils) {

	var dialogMap = {};
	var resizeListenerCreated = false;

	function postActionAndPollUntilReady(dialog, actionUrl, pollUrl, data, callback) {

		callback = callback || utils.reload;

		loading(dialog);

		utils.post(actionUrl, data, function() {

			utils.pollUntilReady(pollUrl, callback, function(progressInformation) {

				loadingStatus(dialog, progressInformation);

			});

		});

	}

	function loading(dialog, keep) {

		dialog = resolveDialog(dialog);

		var loadingAnimation = jQuery('<div class="cloubi-modal-dialog-loading-animation"><i class="fa fa-circle-o-notch fa-spin"></i></div>');

		dialog.dialog.find('.cloubi-modal-dialog-footer input').attr("disabled", "disabled");

		if ( keep ) {
			dialog.dialog.find('.cloubi-modal-dialog-content').hide();
			dialog.dialog.find('.cloubi-modal-dialog-content-wrapper').append(loadingAnimation);
		} else {
			dialog.dialog.find('.cloubi-modal-dialog-content').empty().append(loadingAnimation);
		}

	}

	function removeLoading(dialog) {

		dialog = resolveDialog(dialog);

		dialog.dialog.find('.cloubi-modal-dialog-footer input').removeAttr("disabled");

		dialog.dialog.find('.cloubi-modal-dialog-content').show();

		dialog.dialog.find('.cloubi-modal-dialog-loading-animation').remove();

	}

	function loadingStatus(dialog, data) {

		dialog = resolveDialog(dialog);

		var statusText = dialog.dialog.find(".cloubi-modal-dialog-status-text");

		if ( statusText.length == 0 ) {

			statusText = jQuery('<div class="cloubi-modal-dialog-status-text"></div>');

			dialog.dialog.find('.cloubi-modal-dialog-content').append(statusText);

		}

		var text = "";

		if ( data.percent ) {
			text = data.percent + "% " + Liferay.Language.get('cloubi-dialog-percent-complete');
		} else {
			text = Liferay.Language.get('cloubi-dialog-job-is-running');
		}

		statusText.text(text);

	}

	function clearFooter(dialog) {

		var footer = dialog.dialog.find(".cloubi-modal-dialog-footer");

		footer.empty();

	}

	function createButton(dialog, callback, text, extraClass, saveDisabled) {

		var button = jQuery('<input type="button" class="btn btn-primary" value="" />');

		if ( extraClass ) {
			button.addClass(extraClass);
		}

		button.attr("value", text);

		var footer = dialog.dialog.find(".cloubi-modal-dialog-footer");

		if ( callback ) {
			button.click(function() {
				callback(dialog);
			});
		}

		footer.append(button);

		if ( text === Liferay.Language.get('cloubi-dialog-save') && saveDisabled ) {
			setSaveEnabled(dialog, false);
		}

	}

	function createButtons(dialog, callback, saveText, cancelText, saveDisabled) {

		clearFooter(dialog);

		createButton(dialog, callback, saveText, "save-button", saveDisabled);

		createButton(dialog, function() {
			closeDialog(dialog);
		}, cancelText, "cancel-button");

	}

	function closeDialog(dialog) {

		dialog = resolveDialog(dialog);

		if ( dialog.closeCallback ) {
			dialog.closeCallback();
		}

		dialog.curtain.remove();

		dialogMap[dialog.name] = null;

	}

	function resolveDialog(dialog) {

		if ( jQuery.type(dialog) === "string" ) {
			return dialogMap[dialog];
		} else {
			return dialog;
		}

	}

	function getDialog(name) {

		return dialogMap[name];

	}

	function setDialogHeader(dialog, title) {

		if ( title ) {

			var header = dialog.dialog.find(".cloubi-modal-dialog-header");

			header.text(title);

		}

	}

	function saveOnly(dialog, callback, title, saveDisabled) {

		dialog = resolveDialog(dialog);

		clearFooter(dialog);

		createButton(dialog, callback, Liferay.Language.get('cloubi-dialog-save'), "save-button", saveDisabled);

		setDialogHeader(dialog, title);

	}

	function saveAndCancel(dialog, callback, title, saveDisabled) {

		dialog = resolveDialog(dialog);

		createButtons(dialog, callback,
				Liferay.Language.get('cloubi-dialog-save'),
				Liferay.Language.get('cloubi-dialog-cancel'), saveDisabled);

		setDialogHeader(dialog, title);

	}

	function setSaveEnabled(dialog, enabled) {

		dialog = resolveDialog(dialog);

		var footer = dialog.dialog.find(".cloubi-modal-dialog-footer");
		var button = footer.find(".save-button");

		button.prop( "disabled", !enabled );

	}

	function yesAndNo(dialog, callback, title) {

		dialog = resolveDialog(dialog);

		createButtons(dialog, callback,
				Liferay.Language.get('cloubi-dialog-yes'),
				Liferay.Language.get('cloubi-dialog-no'));

		setDialogHeader(dialog, title);

	}

	function closeOnly(dialog, title, callback) {

		dialog = resolveDialog(dialog);

		clearFooter(dialog);

		if ( callback ) {
			createButton(dialog, callback, Liferay.Language.get('cloubi-dialog-close'));
		} else {
			createButton(dialog, function() {
				dialog.curtain.remove();
			}, Liferay.Language.get('cloubi-dialog-close'));
		}

		setDialogHeader(dialog, title);

	}

	/** Creates a dialog with a save button and a cross button that closes the dialog without saving
	 * dialog 	A string identifying the dialog
	 * callback	The callback function that is called when the dialog is saved
	 * title	The title of the dialog
	 * Any functions pushed to the dialog's closeListeners array will be executed when the dialog is closed with the cross button*/
	function saveAndCross(dialog, callback, title) {

		dialog = resolveDialog(dialog);

		clearFooter(dialog);

		createButton(dialog, callback, Liferay.Language.get('cloubi-dialog-save'), 'save-button');

		setDialogHeader(dialog, title);

		var cross = jQuery('<div class="cloubi-modal-dialog-cross"><i class="fa fa-times"></i></div>');

		cross.click( function() {
			//Call the close listeners and then close the dialog
			if (dialog.closeListeners && dialog.closeListeners.forEach){
				dialog.closeListeners.forEach(function (elem){
					elem();
				});
			}
			dialog.curtain.remove();
		});

		var header = dialog.dialog.find(".cloubi-modal-dialog-header");

		header.append(cross);

	}
	
	function createCross(dialog, callback){
		dialog = resolveDialog(dialog);
		
		//Create the cross
		var cross = jQuery('<div class="cloubi-modal-dialog-cross"><i class="fa fa-times"></i></div>');

		//When the cross is clicked, execute the callback or just close
		cross.click( function() {
			if (callback){
				callback();
			}
			else {
				dialog.curtain.remove();
			}
		});

		//Add the cross to header
		var header = dialog.dialog.find(".cloubi-modal-dialog-header");
		header.append(cross);
	}

	/**Configures dialog with a header with a cross in the upper right corner and no footer
	 * @param dialog	The name of the dialog to configure
	 * @param title		The dialog title to display in the header
	 * @param callback	A function to call when the cross is clicked, before the dialog closes*/
	function crossOnly(dialog, title, callback) {

		//Get dialog object
		dialog = resolveDialog(dialog);

		//Empty and hide footer
		clearFooter(dialog);
		var footer = dialog.dialog.find(".cloubi-modal-dialog-footer");
		footer.hide();

		//Set dialog title
		setDialogHeader(dialog, title);

		//Create the cross
		var cross = jQuery('<div class="cloubi-modal-dialog-cross"><i class="fa fa-times"></i></div>');

		//When the cross is clicked, execute the callback and close
		cross.click( function() {
			if (callback){
				callback();
			}
			dialog.curtain.remove();
		});

		//Add the cross to header
		var header = dialog.dialog.find(".cloubi-modal-dialog-header");
		header.append(cross);

	}

	function crossOnlyWithOptions(dialog,title,options,callback) {
		//Get dialog object
		dialog = resolveDialog(dialog);

		//Empty and hide footer
		clearFooter(dialog);
		var footer = dialog.dialog.find(".cloubi-modal-dialog-footer");
		footer.hide();

		//Set dialog title
		setDialogHeader(dialog, title);

		//Create the cross
		var cross = jQuery('<div class="cloubi-modal-dialog-cross"><i class="fa fa-times"></i></div>');

		if (options && options.crossText) {
			var crossText = jQuery('<span class="cloubi-modal-dialog-cross-text"></span>');
			crossText.text(options.crossText);
		}

		cross.prepend(crossText);

		//When the cross is clicked, execute the callback and close
		cross.click( function() {
			if (callback){
				callback();
			}
			dialog.curtain.remove();
		});

		//Add the cross to header
		var header = dialog.dialog.find(".cloubi-modal-dialog-header");
		header.append(cross);
	}

	function confirm(message, yesCallback, noCallback) {

		var dialog = create(undefined, 'confirmDialog');

		yesAndNo(dialog, function() {
			closeDialog(dialog);
			yesCallback();
		}, Liferay.Language.get('cloubi-dialog-confirm-dialog-title'));

		dialog.closeCallback = noCallback;

		var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');

		wrapper.text(message);

		var content = dialog.dialog.find(".cloubi-modal-dialog-content");

		content.append(wrapper);

	}

	function info(message, html, callback) {

		var dialog = create(undefined, 'infoDialog');

		closeOnly(dialog, Liferay.Language.get('cloubi-dialog-info-dialog-title'), callback);

		var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');

		if ( html ) {
			wrapper.html(message);
		} else {
			wrapper.text(message);
		}

		var content = dialog.dialog.find(".cloubi-modal-dialog-content");

		content.append(wrapper);

	}

	function resize() {

		var height = jQuery(window).innerHeight() - 200;

		jQuery(".cloubi-modal-dialog-content-wrapper").css("max-height", height + "px");

	}

	function initResize() {

		if ( !resizeListenerCreated ) {

			resizeListenerCreated = true;

			jQuery(window).resize(resize);

		}

		resize();

	}

	function waiting(name) {

		var curtain = jQuery('<div class="cloubi-modal-dialog-curtain cloubi-modal-dialog-old"></div>');
		var dialog = jQuery('<div class="cloubi-modal-dialog"></div>');
		var contentWrapper = jQuery('<div class="cloubi-modal-dialog-content-wrapper"></div>');
		var content = jQuery('<div class="cloubi-modal-dialog-content"></div>');
		var loadingAnimation = jQuery('<div class="cloubi-modal-dialog-loading-animation"><i class="fa fa-circle-o-notch fa-spin"></i></div>');

		curtain.append(dialog);

		contentWrapper.append(content);

		dialog.append(contentWrapper);

		curtain.appendTo('body');

		loadingAnimation.appendTo(content);

		var dialogData = {
			dialog: dialog,
			curtain: curtain,
			name: name
		};

		if ( name ) {
			dialogMap[name] = dialogData;
		}

		initResize();

		return dialogData;

	}

	/**Creates a new modal dialog
	 * @param url		The url used to get the contents of the dialog
	 * @param name		The name used to identify the dialog
	 * @param optional	(optional)
	 * @param parent	(optional) A jQuery element to which the dialog is appended.
	 * 					If not specified, the dialog will be appended to body.*/
	function create(url, name, optional, parent) {
		//Create the HTML elements of the dialog
		var curtain = jQuery('<div class="cloubi-modal-dialog-curtain cloubi-modal-dialog-old"></div>');
		var dialog = jQuery('<div class="cloubi-modal-dialog"></div>');
		var header = jQuery('<div class="cloubi-modal-dialog-header"></div>');
		var contentWrapper = jQuery('<div class="cloubi-modal-dialog-content-wrapper"></div>');
		var content = jQuery('<div class="cloubi-modal-dialog-content"></div>');
		var footer = jQuery('<div class="cloubi-modal-dialog-footer"></div>');
		var loadingAnimation = jQuery('<div class="cloubi-modal-dialog-loading-animation"><i class="fa fa-circle-o-notch fa-spin"></i></div>');

		//Nest the created elements
		curtain.append(dialog);

		contentWrapper.append(content);

		dialog.append(header).append(contentWrapper).append(footer);

		//If a parent element was supplied, append the dialog to it, otherwise append the dialog to the document body
		if (parent){
			curtain.appendTo(parent);
		}
		else {
			curtain.appendTo('body');
		}

		//Load the content HTML from the supplied url
		if ( url ) {
			loadingAnimation.appendTo(content);
			//Do html POST request if the url parameter looks like an object
			if ( url.post && url.url && url.data ) {
				utils.post(url.url, url.data, function(html) {
					content.html(html);
				}, undefined, 'html');
			} else {
				content.load(url);
			}
		}

		var dialogData = {
			dialog: dialog,
			curtain: curtain,
			name: name,
			url: url,
			optional: optional
		};

		//Save the dialog object locally so that it can be referenced from inside the dialog
		if ( name ) {
			dialogMap[name] = dialogData;
		}

		initResize();

		return dialogData;

	}

	function reloadDialog(dialog) {

		dialog = resolveDialog(dialog);

		if ( dialog.url ) {

			clearFooter(dialog);

			var loadingAnimation = jQuery('<div class="cloubi-modal-dialog-loading-animation"><i class="fa fa-circle-o-notch fa-spin"></i></div>');

			var content = dialog.dialog.find(".cloubi-modal-dialog-content");

			content.empty().append(loadingAnimation).load(dialog.url);

		}

	}


	function forceSize(dialog, width, height) {

		dialog = resolveDialog(dialog);

		var container = dialog.dialog;
		var wrapper = container.find(".cloubi-modal-dialog-content-wrapper");

		wrapper.css("height", height + "px");
		container.css("width", width + "%");

	}

	/**Maximizes the size of a dialog, making it take up as much size as it needs (up to window size -100 on both axes)
	 * @param dialog	The name of the dialog*/
	function maximize(dialog) {
		dialog = resolveDialog(dialog);

		var container = dialog.dialog;
		var wrapper = container.find(".cloubi-modal-dialog-content-wrapper");

		//calculate maximum size
		var height = window.innerHeight - 200;
		var width = window.innerWidth - 200;

		//maximize the dialog
		wrapper.css("max-height", height + "px");
		container.css("max-width", width + "px");
	}

	function showErrorMessage(elem, text) {
		var parent = elem.parent();
		var wrapper = parent.find(".alert.alert-danger");

		if (wrapper.length == 0) {
			wrapper = jQuery("<div class='alert alert-danger'></div>");
			parent.prepend(wrapper);
		}

		wrapper.text(text);
	}

	function removeErrorMessage(elem) {

		if ( elem != undefined && elem != null ) {
			elem.parent().find(".alert-danger").remove();
		}

	}

	function addClass(dialog, className) {

		dialog = resolveDialog(dialog);

		dialog.dialog.addClass(className);

	}

	function addCurtainClass(dialog, className) {
		
		dialog = resolveDialog(dialog);
		
		dialog.curtain.addClass(className);
		
	}
	
	function getContentElem(dialog){
		dialog = resolveDialog(dialog);
		return dialog.curtain.find(".cloubi-modal-dialog-content");
	}
	
	function showLargeStaticContent(contentType, content, title, desc) {

		var popup = jQuery('<div class="cloubi-large-content-popup"></div>');
		var close = jQuery('<div class="cloubi-large-content-popup-close">X</div>');
		var contentElem = jQuery('<div class="cloubi-large-content-popup-content"></div>');
		var wrapper = jQuery('<div class="cloubi-large-content-wrapper"></div>');

		wrapper.append(close);

		var closeCallback = function() { popup.remove(); jQuery(window).off('.largecontent'); };
		var ignoreCallback = function(e) { e.stopPropagation(); };

		if ( contentType == 'image' ) {

			if ( title ) {
				var titleElem = jQuery('<div class="cloubi-large-content-popup-content-title"></div>');
				titleElem.text(title).appendTo(contentElem);
				titleElem.click(ignoreCallback);
			}

			var image = jQuery('<img class="cloubi-large-content-image" />');
			image.attr("src", content);
			image.appendTo(wrapper);
			image.click(ignoreCallback);

			if ( desc ) {
				var descElem = jQuery('<div class="cloubi-large-content-popup-content-desc"></div>');
				descElem.text(desc).appendTo(contentElem);
				descElem.click(ignoreCallback);
			}

			var adjustSize = function() {

				var margin = 40;
				if (window.innerWidth < 768) {
					margin = 10;
				}

				image.css("max-height", popup.height() - margin);
				image.css("max-width", popup.width() - margin);
			}

			setTimeout(adjustSize, 100);

			jQuery(window).on('resize.largecontent', adjustSize);

		} else if ( contentType == 'html' ) {

			contentElem.html(content);

		}

		close.click(closeCallback);
		popup.click(closeCallback);

		contentElem.append(wrapper);
		popup.append(contentElem).appendTo("body");

	}

	return {
		create: create,
		saveAndCancel: saveAndCancel,
		saveOnly: saveOnly,
		yesAndNo: yesAndNo,
		closeOnly: closeOnly,
		saveAndCross: saveAndCross,
		crossOnly: crossOnly,
		crossOnlyWithOptions: crossOnlyWithOptions,
		loading: loading,
		removeLoading: removeLoading,
		getDialog: getDialog,
		forceSize: forceSize,
		maximize: maximize,
		closeDialog: closeDialog,
		waiting: waiting,
		setSaveEnabled: setSaveEnabled,
		showErrorMessage: showErrorMessage,
		removeErrorMessage: removeErrorMessage,
		loadingStatus: loadingStatus,
		postActionAndPollUntilReady: postActionAndPollUntilReady,
		confirm: confirm,
		info: info,
		reloadDialog: reloadDialog,
		addClass: addClass,
		addCurtainClass: addCurtainClass,
		createButton: createButton,
		createCross: createCross,
		setDialogHeader: setDialogHeader,
		showLargeStaticContent: showLargeStaticContent,
		getContentElem: getContentElem
	};

});



define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/translations', ['fi.cloubi.frontend.common.js/rest-client'], function (RestClient) {

  var url = window.location.origin + "/o/rest/v1/";
  var restClient = new RestClient(url);
  var locale = null;
  
  function translateKeys() {
    return translateAll(Array.prototype.slice.call(arguments));
  }

  function translateAll(keyArray) {
    var data = {
      locale: locale,
      keys: Array.isArray(keyArray) ? keyArray : [keyArray]
    };
    
    return restClient.POST("translations", data);
  }

  function setLocale(l) {
    locale = l;
  }
  
  function getLocale() {
    return locale;
  }

  return {
    translateKeys: translateKeys,
    translateAll: translateAll,
    setLocale: setLocale,
    getLocale: getLocale
  };

});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/utils', ['fi.cloubi.frontend.common.js/translations'], function(translationsJS) {

	/** Offers utility functions for other JavaScript classes
	 * @namespace utils
	 */
	var cssFileCache = null;
	var extensions = {};

	if (typeof String.prototype.endsWith !== 'function') {
	    String.prototype.endsWith = function(suffix) {
	        return this.indexOf(suffix, this.length - suffix.length) !== -1;
	    };
	}

	

	var Language = {};

	if ( self.Liferay && self.Liferay.Language && self.Liferay.Language.cloubi ) {
		
		Language.get = Liferay.Language.get;
		
	} else {
		
		var AUI = YUI();
		
		Language.get = function(key) {
			return key;
		};

		AUI.use(
			'io-base',
			function(AUI) {
				Language.get = AUI.cached(
					function(key, languageId, extraParams) {
						var instance = this;

						var url = Liferay.ThemeDisplay.getPathContext() + '/language/' + languageId + '/' + key + '/';

						if (extraParams) {
							if (typeof extraParams == 'string') {
								url += extraParams;
							}
							else if (Array.isArray(extraParams)) {
								url += extraParams.join('/');
							}
						}

						var headers = {
							'X-CSRF-Token': Liferay.authToken
						};

						var value = '';

						AUI.io(
							url,
							{
								headers: headers,
								method: 'GET',
								on: {
									complete: function(i, o) {
										value = o.responseText;
									}
								},
								sync: true
							}
						);

						return value;
					}
				);
			}
		);
		
	}
	
	var _draggingOn = false;

	$("body").on("touchstart", function(){
		_draggingOn = false;
	});

	$("body").on("touchmove", function(){
		_draggingOn = true;
	});

	/**
	 * Checks if dragging is enable
	 * @memberof utils
	 * @return {boolean} True if dragging is enabled
	 *
	 */
	function isDraggingOn() {
		return _draggingOn;
	}

	/**
	 * Sends a get request to the given url
	 * @memberof utils
	 * @param url				URL where the request is sent
	 * @param successCallback	A function that is invoked on request success
	 * @param failureCallback	A function that is invoked on request failure
	 */
	function get(url, successCallback, failureCallback, allowCache) {

		var settings = {
			url: url,
			dataType: 'json',
			type: 'GET',
			timeout: 5 * 60 * 1000,
			success: function(responseJSON) {
				if ( successCallback != null ) {
					successCallback.call(this, responseJSON);
				}
			},
			error: function() {
				if ( failureCallback != null ) {
					failureCallback.call(this);
				}
			}
		}

		if(!allowCache)
			settings.cache = false;

		jQuery.ajax(settings);

	}

	/**
	 * Returns html content from given url
	 * @memberof utils
	 * @param url				URL where the request is sent
	 * @param successCallback	A function that is invoked on request success
	 * @param failureCallback	A function that is invoked on request failure
	 */
	function getHtml(url, successCallback, failureCallback, allowCache) {
		var settings = {
			url: url,
			dataType: 'html',
			type: 'GET',
			timeout: 5 * 60 * 1000,
			success: function(html) {
				if ( successCallback != null ) {
					successCallback.call(this, html);
				}
			},
			error: function(xhr, error) {
				if ( failureCallback != null ) {
					failureCallback.call(this, error);
				}
			}
		};

		if(!allowCache)
			settings.cache = false;

		jQuery.ajax(settings);

	}

	/**
	 * Sends a post request to the given url
	 * @memberof utils
	 * @param url				URL where the request is sent
	 * @param data				The data that is sent in the request
	 * @param successCallback	A function that is called on request success
	 * @param failureCallback	A function that is called on request failure
	 * @param responseDataType	Data type of the data that is sent
	 */
	function post(url, data, successCallback, failureCallback, responseDataType) {

		if ( !responseDataType ) {
			responseDataType = 'json';
		}

		jQuery.ajax({
			url: url,
			dataType: responseDataType,
			contentType: 'application/json; charset=UTF-8',
			type: 'POST',
			timeout: 5 * 60 * 1000,
			data: JSON.stringify(data),
			headers: {
				'X-CSRF-Token': Liferay.authToken
			},
			success: function(responseData) {
				if ( successCallback != null ) {
					successCallback.call(this, responseData);
				}
			},
			error: function(xhr, status) {
				if ( failureCallback != null ) {
					failureCallback.call(this, status);
				}
			},
			skipReconnectCheck: failureCallback != null
		});

	}

	// This version of post also returns request data for cases where the request info is required in resolution
	function postWithRequestData(url, data, successCallback, failureCallback, responseDataType) {

		if ( !responseDataType ) {
			responseDataType = 'json';
		}

		return jQuery.ajax({
			url: url,
			dataType: responseDataType,
			contentType: 'application/json; charset=UTF-8',
			type: 'POST',
			timeout: 5 * 60 * 1000,
			data: JSON.stringify(data),
			headers: {
				'X-CSRF-Token': Liferay.authToken
			},
			success: function(responseData) {
				if ( successCallback != null ) {
					successCallback.call(this, data, responseData);
				}
			},
			error: function(xhr, status) {
				if ( failureCallback != null ) {
					failureCallback.call(this, status);
				}
			},
			skipReconnectCheck: failureCallback != null
		});

	}

	var failingRequests = [];
	var beforeUnload = function(event) {
        event.preventDefault();
        return '';
    };
    var spinnerTimeout = null;
	var loadingSpinner = null;
	var pendingRequests = 0;

	var translatedLoadingText = Language.get('cloubi-dialog-job-is-running', translationsJS.getLocale());
	var loadingSpinnerTemplate = '<div id="cloubi-utils-unsaved-data-flash-message"><span class="saving-in-progress"><i class="cloubi-utils-unsaved-data-flash-message-spinner fa-spin"></i><span id="cloubi-utils-unsaved-data-flash-message-text">' + translatedLoadingText + '</span></span></div>';

	function postUntilSuccessful(url, data, successCallback, failureCallback, responseDataType) {

        //Make request object so we can store the parameters and redo the request later
        var request = {
            url: url,
            data: data,
            successCallback: successCallback,
            failureCallback: failureCallback,
            responseDataType: responseDataType
        }
        pendingRequests++;
        if (pendingRequests == 1) {
            //If this is the first request, setup safety features

            //Show spinner on timeout
            spinnerTimeout = setTimeout(function() {
                if (!loadingSpinner) {
                    loadingSpinner = $(loadingSpinnerTemplate);
                    $(document.body).append(loadingSpinner);
                }
            }, 2000);

            //Register before unload handler
            $(window).on('beforeunload', beforeUnload);
        }

        // Success handler
        var finishRequest = function(originalRequest, responseData) {
            //Finish the original request
            originalRequest.successCallback(responseData);
            pendingRequests--;

            //If there are no more requests, clear safety features
            if (pendingRequests == 0) {
                //Clear spinner timeout
                clearTimeout(spinnerTimeout);
                //Remove loading spinner if it was already shown
                if (loadingSpinner) {
                    loadingSpinner.remove();
                    loadingSpinner = null;
                }
                //Clear before unload function
                $(window).off('beforeunload', beforeUnload);
            }

        }

        // Failure handler: retries the request until it completes
        var retryPost = function(failingRequest, delay) {
            // Post the request, retry if it fails
            post(failingRequest.url, failingRequest.data,
            function(response) {
                finishRequest(failingRequest, response)

                //If there are more failing requests, play back the next one on the list
                if (failingRequests.length > 0) {
                    var next = failingRequests.shift();
                    retryPost(next, 1);
                }
            },
            function() {
                // On failure, increase delay and retry after timeout
                if (delay < 15) {
                    delay++;
                }
                console.log("Post failed, retrying in " + delay + " seconds")
                setTimeout(function() {retryPost(failingRequest, delay)}, delay * 1000);
            }, failingRequest.responseDataType)
        }

        // If no requests have failed, run the request as normal
	    if (failingRequests.length == 0) {
	        post(url, data,
	        function(response) {
	            finishRequest(request, response)
	        },
	        function() {
	            //If the request fails, push it to the failed request list
	            failingRequests.push(request)

	            if (failingRequests.length == 1) {
                    //If this was the first failed request, start the retry loop
                    retryPost(request, 1);
	            }
	        }, responseDataType)
	    }
	    else {
	        //If there are already failing requests, add this to the list so it will be processed when previous ones are done
	        failingRequests.push(request)
	    }
	}
	
	/**
	 * Uploads a file to the given url
	 * @memberof utils
	 * @param url				URL where the request is sent
	 * @param params			The data that is sent in the request
	 * @param file				The file that is uploaded with the request
	 * @param successCallback	A function that is called on request success
	 * @param failureCallback	A function that is called on request failure
	 * @param filename			The part name of the file (default 'file')
	 * @param responseDataType	Data type of the data that is sent
	 */
	function upload(url, params, file, successCallback, failureCallback, filename, responseDataType) {
		responseDataType = responseDataType || 'json';
		filename = filename || "file";
		
		var data = new FormData();
		data.append(filename, file);
		$.each(params, function(name, value){
			data.append(name, value);
		});

		jQuery.ajax({
			url: url,
			dataType: responseDataType,
			contentType: false,
			enctype: 'multipart/form-data',
			async: true,
			type: 'POST',
			timeout: 5 * 60 * 1000,
			data: data,
			processData: false,
			headers: {
				'X-CSRF-Token': Liferay.authToken
			},
			success: function(responseData) {
				if ( successCallback != null ) {
					successCallback.call(this, responseData);
				}
			},
			error: function(xhr, status) {
				if ( failureCallback != null ) {
					failureCallback.call(this, status);
				}
			},
			skipReconnectCheck: failureCallback != null
		});
	}

	/**
	 * Reloads the current page
	 * @memberof utils
	 */
	function reload() {

		self.location.reload();

	}

	/**
	 * Polls URL until it is ready to complete the given callback function
	 * @memberof utils
	 * @param url		The URL that is being polled
	 * @param callback	The callback function that is called when the URL is ready
	 * @param tick
	 */
	function pollUntilReady(url, callback, tick) {

		jQuery.ajax({
			url: url,
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8',
			type: 'GET',
			timeout: 5 * 60 * 1000,
			data: '',
			success: function(data) {
				if ( data.hasJob ) {
					if ( tick ) {
						tick(data);
					}
					setTimeout( function() {
						pollUntilReady(url, callback, tick);
					}, 1000 );
				} else {
					callback();
				}
			},
			error: function() {
				callback();
			},
			cache: false
		});

	}

	/** Returns a list of parameters in a function invocation
	 * @memberof utils
	 * @param invocation	The invocation
	 * @return				A list of parameters in the invocation
	 */
	function parseFunctionInvocation(invocation) {

		var start = invocation.indexOf("(");
		var end = invocation.indexOf(")");

		if ( start == -1 ) {
			return {
				name: invocation,
				params: []
			};
		} else {
			var name = invocation.substring(0, start);
			var paramsStr = null;
			if ( end == -1 ) {
				paramsStr = invocation.substring(start+1);
			} else {
				paramsStr = invocation.substring(start+1, end);
			}
			var params = paramsStr.split(",");
			return {
				name: name,
				params: params
			};
		}

	}

	/** This function seeks the specified DOM element and all it's child elements to see if they have a data-on-click attribute.
	 * @memberof utils
	 * @param container	The DOM element.
	 * @param functions Object of functions that will listen events defined in trigger() -method or data-on-click attributes.
	 * @param name		The name of the events that are listened to
	 */
	function attachListeners(container, functions, name) {

		var attrName = "data-on-" + name;
		var namespaced = name + ".from-data-attr";

		container.find("[" + attrName + "]").each( function() {
			var element = jQuery(this);
			var invocation = parseFunctionInvocation(element.attr(attrName));
			var func = functions[invocation.name];
			if ( func ) {
				element.on(namespaced, function(event) {
					var params = invocation.params.slice(0);
					params.push(event);
					func.apply(this, params);
				});
			}
		} );

	}

	/** Specifies listeners for events defined in trigger() method or directly in DOM using a special data-attributes.
	 * @memberof utils
	 * @param containerId	The id of the DOM element.
	 * @param functions		Object of functions that will listen events defined in trigger() -method or data-on-click attributes.
	 * @param onReady		Function that is executed when DOM is ready
	 */
	function listeners(containerId, functions, onReady) {

		var container = jQuery("#" + containerId);

		attachListeners(container, functions, "click");
		attachListeners(container, functions, "dblclick");
		attachListeners(container, functions, "change");
		attachListeners(container, functions, "keyup");
		attachListeners(container, functions, "touchend");

		container.on("cloubi:custom-event.from-data-attr", function(event, name, data) {
			var func = functions[name];
			if ( func ) {
				func(data);
			}
		});

		if ( onReady ) {
			jQuery(document).ready(onReady);
		}

	}

	/**
	 * Clears event listeners from the DOM element defined in listeners() -method.
	 * @memberof utils
	 * @param container	The container from which listeners are cleared from
	 * @param name		The type of listeners that are being removed
	 */
	function clearListenersOfType(container, name) {

		var attrName = "data-on-" + name;
		var namespaced = name + ".from-data-attr";

		container.find("[" + attrName + "]").off(namespaced);

	}

	/**
	 * Clears listeners from container
	 * @memberof utils
	 * @param containerId	The id of the container for which listeners are cleared for
	 */
	function clearListeners(containerId) {

		var container = jQuery("#" + containerId);

		clearListenersOfType(container, "click");
		clearListenersOfType(container, "change");
		clearListenersOfType(container, "keyup");
		clearListenersOfType(container, "touchend");

		container.off("cloubi:custom-event.from-data-attr");

	}

	/**
	 * Triggers Cloubi custom event for given DOM element.
	 * @memberof utils
	 * @param containerId	The id of the DOM element.
	 * @param name			The name of the event
	 * @param data			The event data.
	 */
	function trigger(containerId, name, data) {

		var container = jQuery("#" + containerId);

		container.trigger("cloubi:custom-event", [name, data]);

	}

	/**	Sets the given element as editable
	 * @memberof utils
	 * @param element	The element that is going to be edited
	 * @param callback	Callback function that is called once the element has been edited
	 */
	function editable(element, callback) {

		var text = element.text();

		var editor = jQuery('<div class="cloubi-text-editable"></div>');
		var field = jQuery('<input type="text" />');
		var saveButton = jQuery('<button class="btn"><span class="fa fa-check"></span></button>');
		var cancelButton = jQuery('<button class="btn"><span class="fa fa-times"></span></button>');

		field.val(text);
		editor.append(field, saveButton, cancelButton);

		function doSave() {
			callback(field.val(), element);
			element.show();
			editor.remove();
		}

		field.keyup( function(e) {
			if ( e.keyCode == 13 ) {
				doSave();
			}
		});

		cancelButton.click(function() {
			element.show();
			editor.remove();
		});

		saveButton.click(doSave);

		element.hide();

		element.parent().append(editor);

	}

	/**
	 * Returns session storage for the current page
	 * @memberof utils
	 * @return {Object} Session storage, if available
	 */
	function getStorage() {

		try {

			if ( window.sessionStorage ) {
				var json = window.sessionStorage.getItem("Cloubi");
				if ( json != null ) {
					return JSON.parse(json);
				}
			}

		} catch ( error ) {}

		return {};

	}

	/**
	 * Sets the session storage for the current page
	 * @memberof utils
	 * @param data	Session storage data
	 */
	function setStorage(data) {

		try {

			if ( window.sessionStorage ) {
				window.sessionStorage.setItem("Cloubi", JSON.stringify(data));
			}

		} catch ( error ) {}

	}

	/**
	 * This is a helper method to handle window.sessionStorage.
	 *	If one wants to use the session storage, this method has to be used so that the session storage works perfectly in Cloubi 2.0.
	 *	The namespace ensures that there can be multiple separate stores within the session storage.
	 *	Puts value to session store.
	 * @memberof utils
	 * @param namespace		The name of the store.
	 * @param key			The name for the value in the store.
	 * @param value			The value put into the store.
	 */
	function putToSessionStore( namespace, key, value ) {
		var data = getStorage();
		data[namespace] = data[namespace] || {};
		data[namespace][key] = value;
		setStorage(data);
	}

	/**
	 * Gets value from session store.
	 * @memberof utils
	 * @param namespace	The name of the store
	 * @param key		The name for the value in the store.
	 * @return {object}	The value put in the store. If the store has no value for the specified namespace and the key then null is returned.
	 *
	 */
	function getFromSessionStore( namespace, key ) {
		var data = getStorage();
		if ( data[namespace] ) {
			return data[namespace][key];
		}
		return null;
	}

	/**
	 * Clears the store for the specified namespace from the session storage.
	 * @memberof utils
	 * @param namespace	The name of the store to clear
	 */
	function clearSessionStore( namespace ) {
		var data = getStorage();
		data[namespace] = {};
		setStorage(data);
	}

	/**
	 * Adds query parameter to url.
	 * @memberof utils
	 * @param url		Url where the query parameter is added
	 * @param name		This will be set as query parameter name. Assumes that name complies with the query parameter name syntax rules
	 * @param value		This will be set as query parameter value. Value is uri encoded so it can contain URI reserved characters
	 * @return {string}	Url with the new query parameter added on it.
	 */
	function addUrlParameter(url, name, value) {
	    if (url.indexOf('?') == -1) {
	    	url = url + '?';
	    }

	    if (url.indexOf('=') >= 0) {
	    	url = url + '&';
	    }

	    url = url + name + '=' + encodeURIComponent(value);
	    return url;
	}

	/**
	 * This method fetches GET parameter values.
	 * @memberof utils
	 * @param name		The name of the parameter that is returned
	 * @return {string}	Parameter value
	 */
	function getUrlParameter(name) {
	    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
	    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
	}

	/**
	 * Checks if the url has pathPart in its path. Here pathPart means the string between slashes in the path.
	 * @memberof utils
	 * @param name			Specifies the part of the path to find from the url path.
	 * @return {boolean}	true, if the path part was found, otherwise false
	 */
	function hasUrlPathPart(name) {
	    var pathParts = window.location.pathname.split('/');
	    if (pathParts.length == 0)return false;

	    return pathParts.indexOf(name) >= 0;

	}

	/**
	 * Removes all css classes from element that starts with wildcard -parameter
	 * @memberof utils
	 * @param wildcard		Key used in removal operation of the element css classes
	 * @param obj			The object from which classes are removed from
	 * @return {function}
	 */
	function removeClassesWithWildcard(wildcard, obj) {

		var patt = new RegExp('\\b' + wildcard + '\\S+',"g");

		obj.removeClass(function (index, className) {
			return (className.match(patt) || []).join(' ');
		});

	}

	/**
	 * Checks if a string starts with a certain prefix
	 * @memberof utils
	 * @param str			The string that is being checked for the prefix
	 * @param prefix		The prefix for which the string is being checked for
	 * @return {boolean}	True if string starts with the given prefix
	 */
	function stringStartsWith( str, prefix ) {

		return str.indexOf(prefix) === 0;

	}


	function initCssFileCache() {
		if ( cssFileCache == null ) {
			cssFileCache = {};
			jQuery("head link").each(function() {
				var href = jQuery(this).attr("href");
				cssFileCache[href] = true;
			});
		}
	}

	/**
	 * Links given css file to the document
	 * @memberof utils
	 * @param cssFile	The css file that is being linked to the document
	 */
	function loadCSS(cssFile) {

		initCssFileCache();

		if ( cssFileCache[cssFile] ) {
			return;
		}

		cssFileCache[cssFile] = true;

		jQuery("<link>").appendTo("head").attr({type: "text/css", rel: "stylesheet"}).attr("href", cssFile);

	}
	
	/**
	 * Makes the loadCSS function ignore given css file. Use this if the css declarations are already loaded some other way.
	 * @memberof utils
	 * @param cssFile	The css file to be ignored.
	 */
	function markCSSLoaded(cssFile) {
		initCssFileCache();
		cssFileCache[cssFile] = true;
	}

	/** Registers an extension
	 * @memberof utils
	 * @param name		Name of the extension being registered
	 * @param callback
	 */
	function registerExtension(name, callback) {

		if ( extensions[name] ) {

			extensions[name].callbacks.push(callback);

			if ( extensions[name].data ) {
				callback(extensions[name].data);
			}

		} else {

			extensions[name] = {
				callbacks: [callback]
			};

		}

	}

	/**
	 * @memberof utils
	 * @param name
	 * @param data
	 */
	function extensionReady(name, data) {

		if ( extensions[name] ) {

			extensions[name].data = data;

			jQuery.each(extensions[name].callbacks, function(index, func) {
				func(data);
			});

		} else {

			extensions[name] = {
				callbacks: [],
				data: data
			};

		}

	}

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not be triggered.
	 * The function will be called after it stops being invoked for N milliseconds.
	 * If 'immediate' is passed, trigger the function on the leading edge, instead of trailing.
	 * @memberof utils
	 * @param func			The function that is returned
	 * @param wait
	 * @param immediate		Is function triggered on the leading edge
	 * @return {function}	The function that is called after it stops being invoked
	 */
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	}

	/**
	 * Loops all properties of JS -object. Property handler is called for each looped property.
	 * @memberof utils
	 * @param obj	JavaScript object whose properties are looped.
	 * @param func	TThis handler is called for each property.
	 */
	function loopProperties(obj, func) {


	    for (var prop in obj) {

	    	// skip loop if the property is from prototype
	        if(!obj.hasOwnProperty(prop)) continue;

	        func(obj, prop);
		}
	}

	/**
	 * Returns an array of visible pages that are set as checked in the given table
	 * @memberof utils
	 * @param table
	 */
	function getVisibleSelectedPages(table) {

		var pageIds = [];

		var inputs = jQuery(table).find(".page-selected:checked");

		jQuery.each(inputs, function() {

			if ( jQuery(this).closest("tr").is(":visible") ) {
				pageIds.push(jQuery(this).attr("data-tt-id"));
			}


		});

		return pageIds;

	}


	/**
	 * Returns translation for the wanted language based on key and languageId
	 * @memberof utils
	 * @param key			Key of the sentence/word that is being returned
	 * @param languageId	Language Id
	 * @param extraParams	Extra parameters
	 * @return {string} 	The translated sentence/word for the wanted language based on given language Id
	 *
	 */
	function getLanguageValue(key, languageId, extraParams) {
		return Language.get(key, languageId, extraParams);
	}

	/**Generates a render url
	 * @memberof utils
	 * @param namespace	A portlet namespace as generated by the portlet:namespace tag
	 * @param view		The name of the view to load
	 * @return	A url that can be used to load the specified view*/
	function getRenderUrl(namespace, view){
		//Strip leading and trailing underscores
		if (namespace.startsWith("_")){
			namespace = namespace.substr(1);
		}
		if (namespace.endsWith("_")){
			namespace = namespace.slice(0, -1);
		}
		//Use current location as a base
		var url = location.href;
		//Add portlet ID
		url = addUrlParameter(url, "p_p_id", namespace);
		//Lifecycle 0 == view
		url = addUrlParameter(url, "p_p_lifecycle", 0);
		url = addUrlParameter(url, "p_p_state", "exclusive");
		url = addUrlParameter(url, "p_p_mode", "view");
		//Add view identifier
		url = addUrlParameter(url, "_" + namespace + "_view", view);
		return url;
	}

	/**Generates an action url
	 * @memberof utils
	 * @param namespace	A portlet namespace as generated by the portlet:namespace tag
	 * @param action	The name of the action
	 * @return	A url that can be used to execute the action*/
	function getActionUrl(namespace, action){
		//Strip leading and trailing underscores
		if (namespace.startsWith("_")){
			namespace = namespace.substr(1);
		}
		if (namespace.endsWith("_")){
			namespace = namespace.slice(0, -1);
		}
		//Use current location as a base
		var url = location.href;
		//Add portlet ID
		url = addUrlParameter(url, "p_p_id", namespace);
		//Lifecycle 1 == action
		url = addUrlParameter(url, "p_p_lifecycle", 1);
		url = addUrlParameter(url, "p_p_state", "exclusive");
		url = addUrlParameter(url, "p_p_mode", "view");
		//Add action identifier
		url = addUrlParameter(url, "_" + namespace + "_javax.portlet.action", action);
		//Add auth token
		url = addUrlParameter(url, "p_auth", Liferay.authToken);
		return url;
	}

	/**Transplants query parameters from an URL to the current URL
	 * @memberof utils
	 * @param url	A URL that has query parameters
	 * @return	The current base URL with the query parameters of the specified URL*/
	function moveParamsToCurrentUrl(url){
		var params = url.split("?")[1];
		return location.href.split("?")[0] + "?" + params;
	}

	/**Scrolls the page until the specified element is visible. If the element is larger than screen height, the screen will be scrolled to show the
	 * top of the element and as much of its body as possible
	 * @memberof utils
	 * @param $elem	A jQuery object specifying the element to show
	 * @param topOffset	The number of pixels to leave at the top for header bars etc. (default: 110)*/
	function scrollElementIntoView($elem, topOffset){
		topOffset = topOffset || 110;

		//Get the top edge of the element
		var elemTop = $elem.offset().top;
		//Calculate position of the element's bottom edge
    	var elemBottom = elemTop + $elem.height();
    	//Get the top edge of the screen
    	var screenTop = window.scrollY;
    	//Calculate the current position of the screen's bottom edge
    	var screenBottom = screenTop + window.innerHeight;

    	//Check if the top of the screen is visible
    	if (elemTop < screenTop + topOffset){
    		//If not, scroll up until the element is in view
    		$("html, body").animate({ scrollTop: elemTop - 10 - topOffset }, 250);
    	}
    	//Check if the bottom of the element is visible
    	else if (elemBottom > screenBottom){
    		var target;
    		//If the element doesn't fit on the screen, show as much as possible
    		if ($elem.height() > window.innerHeight){
    			target = elemTop - 10 - topOffset;
    		}
    		else {
    			//Otherwise scroll down to show the entire element
    			target = elemBottom - window.innerHeight + 10;
    		}
    		//scroll the element into view
    		$("html, body").animate({ scrollTop: target }, 250);
    	}
    }

    /**
     * Generates a random UUID.
     * @memberOf utils
     * @return {string} The generated UUID.
     */
	function randomUUID() {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function(c) {
			return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
		});
	}
	
	function deepEqual(a, b){
		if (a === b) return true;
		if (typeof a !== typeof b) return false;
		if (typeof a === 'object' || typeof a === 'array') {
			var equal = true;
			$.each(a, function(key){
				if (!deepEqual(a[key], b[key])){
					equal = false;
					return false; //break
				}
			});
			return equal;
		}
		return false;
	}
	
	function deepExtend(target, source) {
		for (var property in source) {
			if (property in target && typeof target[property] === 'object') {
				deepExtend(target[property], source[property]);
			} else {
				target[property] = source[property];
			}
		}
		return target;
	}

	return {
		get: get,
		getHtml: getHtml,
		post: post,
		postWithRequestData: postWithRequestData,
		postUntilSuccessful: postUntilSuccessful,
		upload: upload,
		reload: reload,
		listeners: listeners,
		clearListeners: clearListeners,
		pollUntilReady: pollUntilReady,
		editable: editable,
		trigger: trigger,
		putToSessionStore: putToSessionStore,
		getFromSessionStore: getFromSessionStore,
		clearSessionStore: clearSessionStore,
		addUrlParameter: addUrlParameter,
		getUrlParameter: getUrlParameter,
		hasUrlPathPart: hasUrlPathPart,
		removeClassesWithWildcard: removeClassesWithWildcard,
		stringStartsWith: stringStartsWith,
		loadCSS: loadCSS,
		markCSSLoaded: markCSSLoaded,
		debounce: debounce,
		loopProperties: loopProperties,
		getVisibleSelectedPages: getVisibleSelectedPages,
		registerExtension: registerExtension,
		extensionReady: extensionReady,
		getLanguageValue: getLanguageValue,
		isDraggingOn: isDraggingOn,
		attachListeners: attachListeners,
		getRenderUrl: getRenderUrl,
		getActionUrl: getActionUrl,
		moveParamsToCurrentUrl: moveParamsToCurrentUrl,
		scrollElementIntoView: scrollElementIntoView,
		randomUUID: randomUUID,
		deepEqual: deepEqual,
		deepExtend: deepExtend
	};

});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/playlists', ['./utils', './material'], function(utils, material) {

	/**
	 *
	 * Contains functions for loading and manipulating playlists.
	 * A playlist is a named list of product pages, created by users, usually teachers.
	 * When students view a playlist, they only see the pages in the playlist and are only
	 * able to move back and forward in the playlist. <br><br>A 'page' in playlist can either be
	 * an actual page of Cloubi product, file in media bank or file uploaded by the teacher.
	 * Support for media bank and teacher uploaded files requires the Related Content API. Without
	 * it, playlists can contain only normal pages.
	 * <br><br>
	 *
	 * To use this API, load it like this:
	 * <pre><code>
	 * require(['fi.cloubi.frontend/playlists'], function(playlists) {
	 * 	playlists.getPlaylists(function(lists) {
	 * 		console.log(lists);
	 * 	});
	 * });
	 * </code></pre>
	 *
	 * This API focuses mainly on manipulating the actual playlists. To view a playlist, coordinated
	 * effort of this API, material.js API and the theme itself is required. It's done like this:
	 *
	 * <ol>
	 * 	<li>Register a listener with <code>material.onPlaylistChange()</code> function.</li>
	 * 	<li>Call <code>viewPlaylist(id)</code> or <code>viewPlaylistByCode(id)</code> function.</li>
	 *  <li>Callback registered with material.onPlaylistChange will be called. Change the theme to playlist mode:
	 *  	hide navigation and tools, show playlist title and progress indicator.</li>
	 *  <li>To navigate the playlist, use <code>material.changeToNextPage()</code> and
	 *  	<code>changeToPreviousPage()</code> functions. These functions should be used anyways to
	 *  	change to next and previous page, whether in playlist mode or not.</li>
	 *  <li>Whenever page changes (listen with material.onPageChange function), call
	 *  	<code>getActivePlaylistStatus()</code> and update playlist progress indicator with the information returned.</li>
	 *  <li>Close playlist mode by calling <code>closePlaylist()</code>. This will again trigger the listener
	 *  	registed previously with <code>material.onPlaylistChange()</code>.</li>
	 * </ol>
	 *
	 * So the theme must actually implement a separate playlist view mode. In this mode, normal navigation
	 * is disabled, only the previous and next buttons are visible. Then there is some sort of playlist
	 * progress indicator, which tells what playlist is open. Playlist mode is kinda like a separate product
	 * with only those pages in that order.
	 * <br><br>
	 *
	 * A single playlist can contain pages from multiple products, or be associated with a particular material. Students can open
	 * playlist created by teachers (this is the whole point of playlists). If a playlist has a page that students do not have a permission
	 * to view, that page is trimmed from the playlist when student loads it.
	 *
	 * @namespace playlists
	 *
	 **/



	/* TYPE DEFINITIONS */

	/**An object representing a playlist
	 * @memberof playlists
	 * @mixes playlists.PlaylistMeta
	 * @typedef {Object} Playlist
	 * @property {string} shareCode						The share code of the playlist
	 * @property {string} shareURL						The URL to open this playlist
	 * @property {playlists.PlaylistPage[]} pages		An array of pages in the list*/

	/**A single page in a playlist
	 * @memberof playlists
	 * @typedef {Object} PlaylistPage
	 * @property {string} materialId					The material ID of this playlist page
	 * @property {string} pageId						The page ID of this playlist page
	 * @property {string} [relatedContentId]			The related content ID of this playlist page
	 * @property {string} [pageTitle]					Title of the page, if available is true.
	 * @property {string} [materialTitle]				Title of the material, if available is true.
	 * @property {string} [relatedContantTitle]			Title of the related content, if available is true.
	 * @property {boolean} available					True, if current user still has access to this page/related content.*/


	/**An object representing a playlist metadata.
	 * @memberof playlists
	 * @mixin
	 * @typedef {Object} PlaylistMeta
	 * @property {string} id							The ID of the playlist
	 * @property {string} name							The name of the playlist
	 * @property {string} description					The description of the playlist
	 * @property {boolean} visible						If true, anyone with the code can open the playlist*/




	/* CALLBACK DEFINITIONS */

	/**A callback to receives playlists.
	 * @memberof playlists
	 * @callback PlaylistsCallback
	 * @param {playlists.Playlist[]} playlists	An array containing the playlists*/

	/**A callback to receive a playlist.
	 * @memberof playlists
	 * @callback PlaylistCallback
	 * @param {playlists.Playlist} playlist		The playlist or null if no such playlist exists.*/

	/**A callback to receive information about playlist deletion.
	 * @memberof playlists
	 * @callback DeleteCallback
	 * @param {boolean} success					True, if the playlist was successfully deleted.
	 * @param {string[]} [errors]				Array of errors in case success if false: <ul><li>'missing-data' <li>'no-such-playlist'</ul>*/

	/**A callback to receive information about playlist update.
	 * @memberof playlists
	 * @callback UpdateCallback
	 * @param {boolean} success					True, if the playlist was successfully updated.
	 * @param {string[]} [errors]				Array of errors in case success if false: <ul><li>'missing-data' <li>'no-such-playlist' <li>'cannot-associate-playlist-with-material'</ul>*/

	/**A callback to receive information about playlist creation.
	 * @memberof playlists
	 * @callback CreateCallback
	 * @param {boolean} success					True, if the playlist was successfully created.
	 * @param {playlists.Playlist} [playlist]	The just created playlist.
	 * @param {string[]} [errors]				Array of errors in case success if false: <ul><li>'missing-data' <li>'no-such-playlist' <li>'no-permission-to-create-playlist' <li>'failed-to-create-playlist'</ul>*/

	/**A callback to receive information about adding page to a playlist.
	 * @memberof playlists
	 * @callback AddCallback
	 * @param {boolean} success					True, if the page was successfully added.
	 * @param {string[]} [errors]				Array of errors in case success if false: <ul><li>'missing-data' <li>'no-such-playlist' <li>'page-already-in-playlist' <li>'invalid-page' <li>'page-from-unassociated-material'</ul>*/

	/**A callback to receive information about removing page from a playlist.
	 * @memberof playlists
	 * @callback RemoveCallback
	 * @param {boolean} success					True, if the page was successfully removed.
	 * @param {string[]} [errors]				Array of errors in case success if false: <ul><li>'missing-data' <li>'no-such-playlist' <li>'page-not-in-playlist' <li>'invalid-page'</ul>*/

	/**A callback to receive information about moving a page in a playlist.
	 * @memberof playlists
	 * @callback SortCallback
	 * @param {boolean} success					True, if the page was successfully moved.
	 * @param {string[]} [errors]				Array of errors in case success if false: <ul><li>'missing-data' <li>'no-such-playlist' <li>'page-not-in-playlist' <li>'invalid-page'</ul>*/

	/**A callback to be called when playlist is in view mode.
	 * @memberof playlists
	 * @callback ViewCallback
	 * @param success							True of the playlist was successfully opened, false otherwise*/

	/**A callback to get the playlist status.
	 * @memberof playlists
	 * @callback StatusCallback
	 * @param {boolean} hasPlaylist						True, if there is an active playlist.
	 * @param {playlists.PlaylistMeta} [playlist]		Metadata of the current playlist.
	 * @param {number} [pageIndex]						Index of the current page in playlist. Zero means the first page.
	 * @param {number} [pagesTotal]						Number of the pages in current playlist.
	 * */

	/**A callback to be called when playlist is closed.
	 * @memberof playlists
	 * @callback CloseCallback*/



	/* FUNCTION IMPLEMENTATIONS */


	/**
	 * Get all the playlist created by current user.
	 * @memberof playlists
	 * @param {playlists.PlaylistsCallback} callback			A callback to receive the playlists.
	 */
	function getPlaylists(callback) {
		utils.get('/o/playlists/playlists', function(response) {
			callback(response.playlists);
		});
	}

	/**
	 * Get all playlists associated with the given material id.
	 * @memberof playlists
	 * @param {number}                     materialId           The ID of a Cloubi material.
	 * @param {playlists.PlaylistCallback} callback             A callback to receive the playlists.
	 */
	function getPlaylistsForMaterial(materialId, callback) {
		utils.get('/o/playlists/playlists?materialId=' + materialId, function(response) {
			callback(response.playlists);
		});
	}

	/**
	 * Get a playlist with given id.
	 * @memberof playlists
	 * @param {string} playlistId								The ID of the playlist
	 * @param {playlists.PlaylistCallback} callback				A callback to receive the playlist.
	 */
	function getPlaylist(playlistId, callback) {
		doGetPlaylist(playlistId, null, false, callback);
	}


	/**
	 * Get a playlist with given share code.
	 * @memberof playlists
	 * @param {string} code										The share code of the playlist
	 * @param {playlists.PlaylistCallback} callback				A callback to receive the playlist.
	 */
	function getPlaylistByCode(code, callback) {
		doGetPlaylist(null, code, false, callback);
	}


	function doGetPlaylist(playlistId, code, trimPages, callback) {
		var data = { trim: trimPages };
		if ( playlistId ) {
			data.id = playlistId;
		}
		if ( code ) {
			data.code = code;
		}
		utils.post('/o/playlists/playlist', data, function(response) {
			callback(response.playlist ? response.playlist : null);
		});
	}



	/**
	 * Checks is current user is allowed to create and modify playlists. All users can
	 * view playlists, but usually only teachers are allowed to create them.
	 * @memberof playlists
	 * @return {boolean}										True, if current user can create new playlists.
	 */
	function isAllowedToCreatePlaylists() {
		return Cloubi.playlists.canCreatePlaylists;
	}


	/**
	 * Deletes a playlist with given id.
	 * @memberof playlists
	 * @param {string} playlistId								The ID of the playlist to delete.
	 * @param {playlists.DeleteCallback} callback				A callback to be called when operation is completed.
	 */
	function deletePlaylist(playlistId, callback) {
		utils.post('/o/playlists/delete', {id: playlistId}, function(response) {
			callback(response.success);
		});
	}


	/**
	 * Updates metadata of a playlist with given id.
	 * @memberof playlists
	 * @param {string} playlistId								The ID of the playlist to update.
	 * @param {playlists.PlaylistMeta} data						The new metadata. The id attribute is ignored and
	 * 															missing attributes are not updated.
	 * @param {playlists.UpdateCallback} callback				A callback to be called when operation is completed.
	 */
	function updatePlaylist(playlistId, data, callback) {
		utils.post('/o/playlists/update', {id: playlistId, data: data}, function(response) {
			callback(response.success);
		});
	}


	/**
	 * Creates a new, empty playlist.
	 * @memberof playlists
	 * @param {playlists.PlaylistMeta} data						The metadata for the new playlist. The id attribute is ignored.
	 * @param {playlists.CreateCallback} callback				A callback to be called when operation is completed.
	 */
	function createPlaylist(data, callback) {
		utils.post('/o/playlists/create', data, function(response) {
			callback(response.success, response.playlist);
		});
	}



	/**
	 * Adds a page to the end of existing playlist. If the page already exists in the playlist,
	 * this function does nothing.
	 * @memberof playlists
	 * @param {playlists.PlaylistPage} page						The page to be added.
	 * @param {string} playlistId								The ID of the playlist to add the page to.
	 * @param {playlists.AddCallback} callback					A callback to be called when operation is completed.
	 */
	function addToPlaylist(page, playlistId, callback) {
		utils.post('/o/playlists/add', {id: playlistId, page: page}, function(response) {
			callback(response.success);
		});
	}


	/**
	 * Adds the current page to the end of existing playlist. If the page already exists in the playlist,
	 * this function does nothing.
	 * @memberof playlists
	 * @param {string} playlistId								The ID of the playlist to add the page to.
	 * @param {playlists.AddCallback} callback					A callback to be called when operation is completed.
	 */
	function addCurrentPageToPlaylist(playlistId, callback) {
		addToPlaylist({
			materialId: material.getCurrentMaterialId(),
			pageId: material.getCurrentPageId()
		}, playlistId, callback);
	}



	/**
	 * Removes a page from existing playlist. If the page does not exists in the playlist,
	 * this function does nothing.
	 * @memberof playlists
	 * @param {playlists.PlaylistPage} page						The page to be removed. This must be a page object from a playlist returned by this API.
	 * @param {string} playlistId								The ID of the playlist to remove the page from.
	 * @param {playlists.RemoveCallback} callback				A callback to be called when operation is completed.
	 */
	function removeFromPlaylist(page, playlistId, callback) {
		utils.post('/o/playlists/remove', {id: playlistId, page: page}, function(response) {
			callback(response.success);
		});
	}


	/**
	 * Moves a page to a new location within a playlist.
	 * @memberof playlists
	 * @param {playlists.PlaylistPage} page						The page to be moved. This must be a page object from a playlist returned by this API.
	 * @param {number} index									New location, or index, for the page. Zero means the first page of the playlist.
	 * @param {string} playlistId								The ID of the playlist.
	 * @param {playlists.SortCallback} callback					A callback to be called when operation is completed.
	 */
	function sortPlaylistItem(page, index, playlistId, callback) {
		utils.post('/o/playlists/sort', {id: playlistId, index: index, page: page}, function(response) {
			callback(response.success);
		});
	}


	/**
	 * Opens a playlist for viewing.
	 * @memberof playlists
	 * @param {string} playlistId								The ID of the playlist.
	 * @param {playlists.ViewCallback} callback					A callback to be called when playlist view mode is open.
	 * 															Listeners registered with <code>material.onPlaylistChange()</code>
	 * 															will be called before this.
	 * @param {?integer} pageNumber								The number of the page to start from
	 */
	function viewPlaylist(playlistId, callback, pageNumber) {
		doGetPlaylist(playlistId, null, true, function(playlist) {
			if ( playlist ) {
				material.setCurrentPlaylist(playlist, pageNumber);
				callback(true);
			}
			else {
				callback(false);
			}
		});
	}


	/**
	 * Opens a playlist for viewing.
	 * @memberof playlists
	 * @param {string} code										The share code of the playlist
	 * @param {playlists.ViewCallback} callback					A callback to be called when playlist view mode is open.
	 * 															Listeners registered with <code>material.onPlaylistChange()</code>
	 * 															will be called before this.
	 */
	function viewPlaylistByCode(code, callback) {
		doGetPlaylist(null, code, true, function(playlist) {
			if ( playlist ) {
				material.setCurrentPlaylist(playlist);
				callback(true);
			}
			else {
				callback(false);
			}
		});
	}


	/**
	 * Gets information about current playlist, if there is one.
	 * @memberof playlists
	 * @param {playlists.StatusCallback} callback					A callback to receive the status information.
	 */
	function getActivePlaylistStatus(callback) {
		var current = material.getCurrentPlaylist();
		if ( current ) {
			var pageSource = material.getPageSource();
			callback(true, current, pageSource.getCurrentPageIndex(), current.pages.length);
		} else {
			callback(false);
		}
	}


	/**
	 * Closes currently open playlist, if there is one.
	 * @memberof playlists
	 * @param {playlists.CloseCallback} callback					A callback to be called when playlist is closed.
	 * 																Listeners registered with <code>material.onPlaylistChange()</code>
	 * 																will be called before this.
	 */
	function closePlaylist(callback) {
		material.setCurrentPlaylist(null);
		callback();
	}


	/**
	 * Open playlist automatically if user opened /o/open-playlist/<id> URL.
	 */
	material.onMaterialReady(function() {

		// Do we have a playlist to automatically open?
		if ( Cloubi.playlists.playlistId ) {

			// This should prevent the playlist from being opened twice or something..
			var id = Cloubi.playlists.playlistId;
			Cloubi.playlists.playlistId = null;

			var pageNum = Cloubi.playlists.playlistPage;

			// Check if the playlist portlet is also on the page,
			// as it will also try to automatically open the playlist.
			if ( jQuery('#portlet_fi_cloubi_portlet_playlist_PlaylistPortlet').length == 0 ) {
				viewPlaylist(id, function() {}, pageNum);
			}

		}

	});


	/* PUBLIC FUNCTIONS */

	return {
		getPlaylists: getPlaylists,
		getPlaylistsForMaterial: getPlaylistsForMaterial,
		getPlaylist: getPlaylist,
		getPlaylistByCode: getPlaylistByCode,
		isAllowedToCreatePlaylists: isAllowedToCreatePlaylists,
		deletePlaylist: deletePlaylist,
		updatePlaylist: updatePlaylist,
		createPlaylist: createPlaylist,
		addToPlaylist: addToPlaylist,
		addCurrentPageToPlaylist: addCurrentPageToPlaylist,
		removeFromPlaylist: removeFromPlaylist,
		sortPlaylistItem: sortPlaylistItem,
		viewPlaylist: viewPlaylist,
		viewPlaylistByCode: viewPlaylistByCode,
		getActivePlaylistStatus: getActivePlaylistStatus,
		closePlaylist: closePlaylist
	};

});



define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/user-accounts', ['./utils'], function(utils) {

	/**
	 Contains functions for creating new user accounts, logging in, logging out and updating current user's details.
	 <br><br>
	 These function are intended to be used within the materials. For example, students could first start using a material 
	 anonymously, i.e. without logging in, and then at later time register a new Cloubi user account so he/she can continue later.
	 <br><br>
	 
	 To use this API, load it like this:
	 
	 <pre><code>
require(['fi.cloubi.frontend/account'], function(accounts) {
	accounts.getUserInfo(function(info) {
		console.log(info);
	});
});
	 </code></pre>
	 
	 * @namespace accounts */
	
	/**A callback for functions that will produce an UserInfo object.
	 * @memberof accounts
	 * @callback userInfoCallback
	 * @param {?accounts.UserInfo} info		Information about current account or null if user is not logged in.*/
	
	/**A callback that will receive information about login attempt.
	 * @memberof accounts
	 * @callback loginCallback
	 * @param {boolean} success					True, if the login attempt was successful. False, if user account does not exists or password is invalid.
	 * 											For security reasons, missing account and wrong password produce the same error.
	 */
	
	/**A callback that will be called after user has logged out.
	 * @memberof accounts
	 * @callback logoutCallback*/
	
	/**A callback that will receive information about user account update attempt.
	 * @memberof accounts
	 * @callback updateUserCallback
	 * @param {boolean} success					True, if the login attempt was successful.
	 * @param {Array.<string>} errors			If <code>success</code> is false, this array contains one or more of the following
	  											error conditions: 'invalid-email', 'duplicate-email', 'first-name-empty', 'last-name-empty',
	 											'invalid-password', 'passwords-do-not-match', 'too-short-password', 'too-trivial-password',
	 											'edit-accounts-not-enabled', 'duplicate-username'.
	 */
	
	/**A callback that will receive information about user account creation.
	 * @memberof accounts
	 * @callback registerUserCallback
	 * @param {boolean} success					True, if the new user account was successfully created and user logged in. If false, possible
	 											current user was not logged out.
	 * @param {Array.<string>} errors			If <code>success</code> is false, this array contains one or more of the following
	  											error conditions: 'invalid-email', 'duplicate-email', 'first-name-empty', 'last-name-empty',
	 											'passwords-do-not-match', 'too-short-password', 'too-trivial-password', 'signup-not-enabled',
	 											'duplicate-username'.
	 */
	
	/**A callback that will called after a password reset link has been sent.
	 * @memberof accounts
	 * @callback resetLinkCallback
	 */
	
	
	
	
	/**An object representing the user account for logged in user. Some attributes are only used when updating the user account,
	 * like password and newPassword. Some attributes cannot be updated, like the id. It depends on the server's configuration
	 * wheter or not the email address can be changed.
	 * @memberof accounts
	 * @typedef {Object} UserInfo
	 * @property {?string} id					The user ID.
	 * @property {?string} firstName			First name of the user.
	 * @property {?string} lastName				Last name of the user.
	 * @property {?string} username				The username of the user.
	 * @property {?string} email				Email address of the user.
	 * @property {?string} password				User's current password.
	 * @property {?string} newPassword			New password for the user.
	 * @property {?string} newPasswordAgain		New password again.
	 */
	
	
	/**An object representing the global configuration of user accounts, such as wheter is possible to create new accounts or not.
	 * @memberof accounts
	 * @typedef {Object} Configuration
	 * @property {boolean} signup				True, if its possible to create new accounts.
	 * @property {boolean} editAccounts			True, if its possible to edit existing accounts.
	 * @property {boolean} emailLogin			True, if login should be done with email address instead of username.
	 */
	
	
	
	// This variable is used to hold transient information about user's state (logged in or not)
	// after logIn, logOut or registerUser has been called. Before calling those functions,
	// this variable must be null.
	var loggedInState = null;
	
	
	
	/**Gets the current global configuration for user accounts.
	 * @memberof accounts
	 * @return {accounts.Configuration} The configuration.*/
	function getConfiguration() {
		return {
			signup: Cloubi.userAccountConfig.signup,
			editAccounts: Cloubi.userAccountConfig.editAccounts,
			emailLogin: Cloubi.userAccountConfig.emailLogin
		};
	}
	
	
	/**Gets information about currently logged in user, if there is one. 
	 * @memberof accounts
	 * @param {accounts.userInfoCallback} callback		A callback function that receives the user account info.*/
	function getUserInfo(callback) {
		if ( loggedInState ) {
			callback(loggedInState.user);
		} else {
			if ( themeDisplay.isSignedIn() ) {
				callback({
					id: Cloubi.currentUser.userId,
					firstName: Cloubi.currentUser.firstName,
					lastName: Cloubi.currentUser.lastName,
					email: Cloubi.currentUser.email,
					username: Cloubi.currentUser.screenName,
				});
			} else {
				callback(null);
			}
		}
	}
	
	/**Checks if there is a logged in user. 
	 * If there is, then the <code>getUserInfo()</code> function will provide a non-null UserInfo object. 
	 * @memberof accounts
	 * @return {boolean} True, if there is a logged in user.*/
	function isLoggedIn() {
		if ( loggedInState ) {
			return loggedInState.loggedIn;
		} else {
			return themeDisplay.isSignedIn();
		}
	}
	
	/**Logins user with provided email address/username and password. If the user is already logged in with another user account,
	 * then he/she will be first logged out. If the user has already logged in with this account, then this function does nothing.
	 * Only email address or username can be used, depending on the configuration. See <code>getConfiguration</code>.
	 * A callback will be called after the user has either successfully logged in or there is an error, like incorrect password.
	 * It is highly recommended to reload the page after successful login, as rest of the page will be in invalid state.
	 * @memberof accounts
	 * @param email {string}						The email address of the user, or null if not used.
	 * @param username {string}						The username of the user, or null if not used. 
	 * @param password {string}						The password of the user.
	 * @param callback {accounts.loginCallback}		A callback function for when the login attempt is completed.
	 */
	function logIn(email, username, password, callback) {
		var loginData = null;
		if ( getConfiguration().emailLogin ) {
			if ( email ) {
				loginData = { email: email, password: password };
			}
		} else {
			if ( username ) {
				loginData = { username: username, password: password };
			}
		}
		if ( loginData ) {
			utils.post('/o/user-accounts/sign-in', loginData, function(data) {
				if (data.success) {
					loggedInState = { loggedIn: true, user: data.user };
				}
				callback(data.success);
			});
		} else {
			callback(false);
		}
	}
	
	/**Logs out current user. 
	 * @memberof accounts
	 * @param callback {accounts.logoutCallback}	A callback function for when the user has logged out. If the user has already logged out, this
	 												will be called immediately.
	   @param stayOnPage {boolean}					If true, the browser will stay on the current page and the callback will be triggered after the user has been logged out. 
	   												Otherwise it will be immediately redirected to the default logout location*/
	function logOut(callback, stayOnPage) {
		if ( themeDisplay.isSignedIn() ) {
			if (stayOnPage) {
				utils.getHtml('/c/portal/logout', function() {
					loggedInState = { loggedIn: false, user: null };
					callback();
				});
			}
			else {
				window.open('/c/portal/logout', '_self');
			}
		} else {
			callback();
		}
	}
	
	/**Updates current user's account, like changes the first name or password. 
	 * @memberof accounts
	 * @param info {accounts.UserInfo}					The settings to change. Only include the attributes you wish to update. To change the password, you
	  													must include password, newPassword and newPasswordAgain. Must not contain id attribute.
	 * @param callback {accounts.updateUserCallback}	A callback function for when the update is completed.
	 */
	function updateUser(info, callback) {
		utils.post('/o/user-accounts/update-account', info, function(data) {
			callback(data.success, data.errors);
		});
	}
	
	/**Creates new user's account, and if successful, logins that new user. It is highly recommended to reload the page after successful 
	 * login, as rest of the page will be in invalid state.
	 * @memberof accounts
	 * @param info {accounts.UserInfo}					Settings for the new user account. Must not contain id or password attributes. 
	 													Must contain newPassword, newPasswordAgain, firstName, and lastName attributes.
	 													If login by email is enabled, must contains email attribute, otherwise must contain
	 										 			username attribute.
	 * @param callback {accounts.registerUserCallback}	A callback function for when the registration is completed.*/
	function registerUser(info, callback) {
		utils.post('/o/user-accounts/create-account', info, function(data) {
			if (data.success) {
				loggedInState = { loggedIn: true, user: data.user };
			}
			callback(data.success, data.errors);
		});
	}
	
	
	/**Requests a password reset link to be sent to given email address.
	 * @memberof accounts
	 * @param email {string}							The email address to send the reset link. 
	 * @param callback {accounts.resetLinkCallback}		A callback function for when the link has been sent.*/
	function passwordRecovery(email, callback) {
		utils.post('/o/user-accounts/password-recovery', {
			email: email, lang: Cloubi.currentUser.languageId
		}, function(data) {
			callback();
		});
	} 
	
	
	return {
		getConfiguration: getConfiguration,
		getUserInfo: getUserInfo,
		isLoggedIn: isLoggedIn,
		logIn: logIn,
		logOut: logOut,
		updateUser: updateUser,
		registerUser: registerUser,
		passwordRecovery: passwordRecovery
	};

});



define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/notifications', ["./utils", "./dialog", "fi.cloubi.lib.js/offline", "fi.cloubi.lib.js/modernizr-custom", "fi.cloubi.lib.js/jquery-ui"], function(utils, dialogs) {	
		
	jQuery(document).ajaxError(function(event, jqxhr, settings, thrownError){
				
		if ( settings.skipReconnectCheck ) {
			return;
		}
		
		createReconnectNotification();
								
	});
			
	var cloubiOfflineCallbacks = [];
	var customCloubiOfflineCallbacks = [];
	var offlineCallbacks = [];
	var customOfflineCallbacks = [];
	var onlineCallbacks = [];
	var customOnlineCallbacks = [];
	var customReconnectCallbacks = [];
	var reconnectCallbacks = [];
	var smallScreenResolutionCallbacks = [];
	var customSmallScreenResolutionCallbacks = [];
	var slowConnectionCallbacks = [];	
	var browserNotSupportedCallbacks = [];	
	var customBrowserNotSupportedCallbacks = [];
	
	var smallScreenResolutionLimit = 480;

	var googleUrl = 'https://www.google.fi/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
	
	//var url = window.location.origin + "/html/icons/default.png";			
	/*
	if ( window.location.hostname === "localhost" ) {
		//url = "https://cloubi-frame-dev.ubilabs.fi/html/icons/default.png";
	}
	*/	
	
	/* SLOW CONNECTION SPEED 
	function onSlowConnection(callback) {
		slowConnectionCallbacks.push(callback);		
	}	
	
	
	var slowConnectionTimeout = setTimeout(function(){
				
		trigger(slowConnectionCallbacks);
				
	}, 1000);
	
	window.addEventListener( 'load', function() {
		
		try {
            window.clearTimeout( slowConnectionTimeout );
        } catch (e){
        }

    });
	*/
	
	/* ONLINE/OFFLINE CHECK */
	Offline.options = {
		checkOnLoad: true,
		interceptRequests: true,		
		reconnect: { 
			initialDelay: 3,
			delay: 10
		},		
		checks: {	
			image: {
				url: googleUrl + "?_=" + ((new Date()).getTime())
			},
			active: 'image'
		},
		requests: false,
		game: false		
	}	
	
	Offline.on("confirmed-up", function(){			
		
		if ( window.navigator.onLine ) {
			
			if ( customOnlineCallbacks.length > 0 ) {
				trigger(customOnlineCallbacks);
			} else {
				trigger(onlineCallbacks);
			}
			
			changeImageUrl();
			
		} else {
			
			Offline.state = 'down;'
			Offline.check();
		
		}
		
	});
	
	function setCheckOnLoad(value) {
		Offline.options.checkOnLoad = value;
	}
	
	function changeImageUrl() {		
		Offline.options.checks.image['url'] = googleUrl + "?_=" + ((new Date()).getTime());
	}	
		
	var timeOnDown = 0;	
	function timeElapsed(ms) {
				
		return ms - timeOnDown;
		
	}
	
	function _trapFocusKeyup(ev){
		if (ev.key === "Tab"){
			var trap = jQuery(".cloubi-notifications-focus-trap");
			if (!jQuery.contains(trap[0], document.activeElement)){
				if (ev.shiftKey){
					trap.find(":focusable").last().focus();
				}
				else {
					trap.find(":focusable").first().focus();
				}
			}
		}
	}
	
	function _trapFocusKeydown(ev){
		if (ev.key === "Tab"){
			var trap = jQuery(".cloubi-notifications-focus-trap");
			var focusables = trap.find(":focusable");
			if (ev.shiftKey && focusables.first().is(jQuery(document.activeElement))){
				focusables.last().focus();
				ev.preventDefault();
				ev.stopPropagation();
			}
			else if (!ev.shiftKey && focusables.last().is(jQuery(document.activeElement))){
				focusables.first().focus();
				ev.preventDefault();
				ev.stopPropagation();
			}
			
		}
	}
	
	function _trapIframeFocus(){
		jQuery(".cloubi-notifications-focus-trap :focusable").first().focus();
	}
	
	function _setupFocusTrap(){
		setTimeout(function(){
			jQuery(".cloubi-notifications-focus-trap:visible :focusable").first().focus();
		});
		
		jQuery(window).on("keydown", _trapFocusKeydown);
		jQuery(window).on("keyup", _trapFocusKeyup);
		var frames = jQuery("iframe");		
		frames.each(function(index, elem){
			var self = jQuery(elem);
			self.attr("data-tabindex-cache", self.attr("tabindex"));
			self.attr("tabindex", -1);
		});
	}
	
	function _teardownFocusTrap(){
		jQuery(window).off("keydown", _trapFocusKeydown);
		jQuery(window).off("keyup", _trapFocusKeyup);
		var frames = jQuery("iframe");		
		frames.each(function(index, elem){
			var self = jQuery(elem);
			if (elem.hasAttribute("data-tabindex-cache")){
				self.attr("tabindex", self.attr("data-tabindex-cache"));
			}
			else {
				self.removeAttr("tabindex");
			}
		});
	}
	
	function createReconnectNotification() {
		
		if ( jQuery(".cloubi-notifications-reconnect-notification").length > 0 ) {
			return;
		}
		
		var curtain = jQuery("<div class='cloubi-notifications-reconnect-notification cloubi-notifications-focus-trap' tabindex='-1'></div>");
		var text = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-reconnecting'));
		curtain.append(text);
		
		if ( Offline.state == "down" && !window.navigator.onLine ) {
			var spinner = jQuery("<span class='cloubi-notifications-reconnect-spinner'><i class='fa fa-5x fa-circle-o-notch fa-spin'></i></span>");
		}
		
		curtain.append(spinner);
		curtain.appendTo("body");
		_setupFocusTrap();
	}
		
	function removeReconnectNotification() {		
		jQuery(".cloubi-notifications-reconnect-notification").remove();
		_teardownFocusTrap();
	}
	
	Offline.on("reconnect:started", function(){
		createReconnectNotification();		
	});
	
	Offline.on("reconnect:stopped", function(){		
		removeReconnectNotification();
	});
		
	Offline.on("reconnect:tick", function(){
		
		if ( customReconnectCallbacks.length > 0) {
			trigger(customReconnectCallbacks);			
		} else {
			trigger(reconnectCallbacks);
		}
		
	});

	Offline.on("down", function(){	

		timeOnDown = new Date().getTime();
			
		/*
		if ( customOfflineCallbacks.length > 0 ) {
			trigger(customOfflineCallbacks);
		} else {
			trigger(offlineCallbacks);
		}
		*/
		
	});
	
	function onReconnectTick(callback) {
		
		if ( callback ) {
			customReconnectCallbacks.push(callback);			
		} else {			
			reconnectCallbacks.push(defaultOnReconnectTick);
		}	

	}
	
	function defaultOnReconnectTick() {
		
		console.log("reconnect:tick");
				
		var time = new Date();
		
		if ( timeElapsed(time.getTime()) > 15000 && Offline.state == "down" ) {
			
			removeReconnectNotification();
			
			if ( dialogs && !dialogs.getDialog('offlineDialog') ) {

				if ( customOfflineCallbacks.length > 0 ) {
					trigger(customOfflineCallbacks);
				} else {
					trigger(offlineCallbacks);
				}
				
			} else {
				
				createNotificationByType('offline');
				
			}
			
		}
	}
			
	function testCloubiConnection() {
				
		var server1NotFound = false;
		var server2NotFound = false;
		var img1 = new Image;
		var img2 = new Image;
		img1.onerror = function() {
			server1NotFound = true;	
		}
		img2.onerror = function() {
			server2NotFound = true;			
		}
		
		img1.src = 'https://frame.otava.fi/html/icons/default.png';			
		img2.src = 'https://digitehtavat.otava.fi/html/icons/default.png';
		
		setTimeout(function(){
			
			if ( server1NotFound || server2NotFound ) {
				
				if ( customCloubiOfflineCallbacks.length > 0 ) {
					trigger(customCloubiOfflineCallbacks);
				} else {
					trigger(cloubiOfflineCallbacks);
				}
				
			}
			
		}, 1000);
			
	}
	
	/*
	Offline.on("reconnect:connecting", function(){
		trigger(reconnectCallbacks);			
	});
	*/
	
	function defaultCloubiOfflineCallback() {
						
		var onlineDialog = dialogs.getDialog('onlineDialog');
		if ( onlineDialog )
			dialogs.closeDialog(onlineDialog);	
		
		var offlineDialog = dialogs.getDialog('offlineDialog');
		if ( offlineDialog )
			dialogs.closeDialog(offlineDialog);
		
		var dialog = dialogs.create(undefined, 'cloubiOfflineDialog');
		dialogs.addCurtainClass("cloubi-notification-curtain");
		dialogs.addClass("cloubi-default-notification cloubi-offline");
				
		var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');
		var header = jQuery('<h3></h3>').text(Liferay.Language.get('cloubi-notification-connection-down-header'));
		var paragraph1 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-1'));
		var paragraph2 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-2'));
		var paragraph3 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-3'));
		wrapper.append(header).append(paragraph1).append(paragraph2).append(paragraph3);	
		
		var content = dialogs.getContentElem(dialog);		
		content.empty().append(wrapper);
				
	}
	
	function onCloubiOffline(callback) {
			
		if ( callback ) {
			customCloubiOfflineCallbacks.push(callback);							
		} else {			
			cloubiOfflineCallbacks.push(defaultCloubiOfflineCallback);			
		}
		
	}
					
	function defaultOfflineCallback() {
		
		if ( dialogs ) {
			
			var onlineDialog = dialogs.getDialog('onlineDialog');
			if ( onlineDialog )
				dialogs.closeDialog(onlineDialog);	
			
			var cloubiOfflineDialog = dialogs.getDialog('cloubiOfflineDialog');
			if ( cloubiOfflineDialog )
				dialogs.closeDialog(cloubiOfflineDialog);
			
			var dialog = dialogs.create(undefined, 'offlineDialog');
			dialogs.addCurtainClass(dialog, "cloubi-notification-curtain");
			dialogs.addClass(dialog, "cloubi-default-notification offline");
			
			var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');
			var header = jQuery('<h3></h3>').text(Liferay.Language.get('cloubi-notification-connection-down-header'));
			var paragraph1 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-1'));
			var paragraph2 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-2'));
			var paragraph3 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-3'));
			wrapper.append(header).append(paragraph1).append(paragraph2).append(paragraph3);		
			
			var content = dialogs.getContentElem(dialog);		
			content.attr("tabindex", "-1")
			content.empty().append(wrapper);
			content.focus();
			
		}
		
	}
	
	function onOffline(callback) {
						
		if ( callback ) {
			customOfflineCallbacks.push(callback);						
		} else {			
			offlineCallbacks.push(defaultOfflineCallback);
		}
		
	}
	
	function defaultOnlineCallback() {
		
		jQuery(".cloubi-default-notification.offline").closest(".cloubi-modal-dialog-curtain").remove();
		
		if ( Offline.state === "up" ) {
			return;
		}
		
		if ( dialogs ) {
			
			var cloubiOfflineDialog = dialogs.getDialog('cloubiOfflineDialog');			
			if ( cloubiOfflineDialog )
				dialogs.closeDialog(cloubiOfflineDialog);
			
			var offlineDialog = dialogs.getDialog('offlineDialog');
			if ( offlineDialog )
				dialogs.closeDialog(offlineDialog);
			
			var dialog = dialogs.create(undefined, 'onlineDialog');		
			dialogs.addCurtainClass(dialog, "cloubi-notification-curtain");
			dialogs.addClass(dialog, "cloubi-default-notification online");
			var icon = jQuery("<div class='icon info'></div>");
			var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');
			var header = jQuery('<h3></h3>').text(Liferay.Language.get('cloubi-notification-connection-up')); 
			wrapper.append(icon).append(header);	
			
			var content = dialogs.getContentElem(dialog);	
			content.attr("tabindex", "-1")
			content.empty().append(wrapper);
			content.focus();
			
			setTimeout(function(){
				dialogs.closeDialog('onlineDialog');
			}, 2000);
			
		} else {
			
			createNotificationByType('online');
			
			setTimeout(function(){
				jQuery(".cloubi-default-notification.online").closest(".cloubi-modal-dialog-curtain").remove();
			}, 2000);
			
		}		
		
	}
	
	function onOnline(callback) {
		
		if ( callback ) {
			customOnlineCallbacks.push(callback);			
		} else {
			onlineCallbacks.push(defaultOnlineCallback);
		}
						
	}
	
	/*
	function onReconnect(callback) {
		reconnectCallbacks.push(callback);		
	}
	*/
	
	
	function createCross(dialog) {
		
		dialogs.createCross(dialog, function() {
			hideDialog();
			localStorage.setItem("cloubi-notification-dismiss", "true");
		});
		
	}
	
	function createNotificationByType(type) {
		
		var dialogClass = ".cloubi-default-notification." + type;
		
		if ( jQuery(dialogClass).length > 0 ) {
			return;
		}
		
		var curtain = jQuery('<div class="cloubi-modal-dialog-curtain cloubi-notification-curtain"></div>');
		var dialog = jQuery('<div class="cloubi-modal-dialog cloubi-default-notification"></div>');		
		dialog.addClass(type);		
		var header = jQuery('<div class="cloubi-modal-dialog-header"></div>');
		var contentWrapper = jQuery('<div class="cloubi-modal-dialog-content-wrapper"></div>');
		var content = jQuery('<div class="cloubi-modal-dialog-content"></div>');
		var footer = jQuery('<div class="cloubi-modal-dialog-footer"></div>');
		
		curtain.append(dialog);

		contentWrapper.append(content);
		
		dialog.append(header).append(contentWrapper).append(footer);
		
		if ( type == 'offline' ) {
			var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');
			var header = jQuery('<h3></h3>').text(Liferay.Language.get('cloubi-notification-connection-down-header'));
			var paragraph1 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-1'));
			var paragraph2 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-2'));
			var paragraph3 = jQuery("<p></p>").text(Liferay.Language.get('cloubi-notification-connection-down-info-3'));
			wrapper.append(header).append(paragraph1).append(paragraph2).append(paragraph3);		
		}
		
		if ( type == 'online' ) {
			var icon = jQuery("<div class='icon info'></div>");
			var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');
			var header = jQuery('<h3></h3>').text(Liferay.Language.get('cloubi-notification-connection-up')); 
			wrapper.append(icon).append(header);	
		}
		
		content.append(wrapper);
		
		curtain.appendTo('body');
		
	}
	
	function createNotification() {
		
		var dialog = dialogs.create(undefined, 'notificationDialog');
		dialogs.addCurtainClass(dialog, "cloubi-notification-curtain");
		dialogs.addCurtainClass(dialog, "cloubi-notifications-focus-trap");
		dialogs.addClass(dialog, "cloubi-default-notification");
		
		dialogs.createButton(dialog, function() {
			hideDialog();				
			localStorage.setItem("cloubi-notification-dismiss", "true");
		}, Liferay.Language.get('cloubi-dialog-close'));
		
		var content = dialogs.getContentElem(dialog);
		if (dialog.curtain){
			dialog.curtain.attr("role", "alertdialog");
			dialog.curtain.attr("aria-labelledby", "cloubi-notifications-dialog-header");
			dialog.curtain.attr("aria-describedby", "cloubi-notifications-dialog-message");
		}
		_setupFocusTrap();
		
		return dialog;
	}
	
	function createMessage(dialog, header, text, showIcon, addClasses) {
		
		var wrapper = jQuery('<div class="cloubi-modal-dialog-message"></div>');
		
		if ( addClasses ) {
			wrapper.addClass(addClasses);
		}
		
		var icon = jQuery("<div class='icon warning'></div>");
		var header = jQuery('<h3 id="cloubi-notifications-dialog-header"></h3>').text(header); 
		var paragraph = jQuery('<p id="cloubi-notifications-dialog-message"></p>').text(text);
		
		if ( showIcon ) {
			wrapper.append(icon);
		}
		
		wrapper.append(header).append(paragraph);
		
		var content = dialogs.getContentElem(dialog);		
		content.empty().append(wrapper);
		
	}
	
	function setSmallScreenResolutionLimit(limit) {
		smallScreenResolutionLimit = limit;
	}
	
	function getSmallScreenResolutionLimit() {
		return smallScreenResolutionLimit;
	}
	
	function defaultOnSmallScreenResolutionCallback() {
				
		if ( jQuery(window).width() < getSmallScreenResolutionLimit() ) {
			
			if ( jQuery(".cloubi-default-notification").length == 0 ) {
				
				var dialog = createNotification();
				
				createMessage(dialog, Liferay.Language.get('cloubi-notification-screen-resolution-too-small-header'), Liferay.Language.get('cloubi-notification-screen-resolution-too-small-info'), true, "small-screen-message");
				
				createCross(dialog);
				
				if ( jQuery(".cloubi-default-small-notification").length == 0 )						
					createSmallNotification();				

				if ( jQuery(".cloubi-default-notification").length > 1 || localStorage.getItem("cloubi-notification-dismiss") === "true") {
					hideDialog();
				}
				
			} else if ( jQuery(".small-screen-message").length == 0 ) {
							
				var dialog = dialogs && dialogs.getDialog('notificationDialog') ? dialogs.getDialog('notificationDialog') : createNotification();
				createMessage(dialog, Liferay.Language.get('cloubi-notification-screen-resolution-too-small-header'), Liferay.Language.get('cloubi-notification-screen-resolution-too-small-info'), false, "small-screen-message");

			}
							
		} else {
			
			jQuery(".small-screen-message").remove();
			
			var dialog = dialogs && dialogs.getDialog('notificationDialog') ? dialogs.getDialog('notificationDialog') : null;
			
			if ( dialog ) {
				
				if ( !isUnsupportedBrowser() ) {
					
					dialogs.closeDialog(dialog);
					removeSmallNotification();
					localStorage.removeItem("cloubi-notification-dismiss");
					
				}
				
			}
			
		} 	
		
	}
	
	function hideDialog() {		
		jQuery(".cloubi-default-notification").closest(".cloubi-modal-dialog-curtain").hide();
		_teardownFocusTrap();
	}
	
	function removeSmallNotification() {		
		jQuery(".cloubi-default-small-notification").remove();		
	}
		
	function showDialog() {	
		var dialog = jQuery(".cloubi-default-notification").closest(".cloubi-modal-dialog-curtain")
		dialog.show();
		_setupFocusTrap();
	}
	
	function createSmallNotification() {

		var notification = jQuery("<div></div>").attr("class", "cloubi-default-small-notification").attr("tabindex", "0").attr("role", "alert")
			.attr("aria-labelledby", "cloubi-notifications-dialog-header")
			.attr("aria-describedby", "cloubi-notifications-dialog-message");
		var icon = jQuery("<div class='icon warning'></div>");
		notification.append(icon);
		
		notification.click(function(){	
			showDialog();
		});
		notification.on("keydown", function(ev){
			if (ev.key === " " || ev.key === "Spacebar" || ev.key === "Enter"){
				showDialog();
			}
		});
				
		notification.appendTo(jQuery("body"));
						
	}
	
	window.addEventListener("resize", utils.debounce(function() {
		if ( customSmallScreenResolutionCallbacks.length > 0 ) {
			trigger(customSmallScreenResolutionCallbacks);
		} else {
			trigger(smallScreenResolutionCallbacks);
		}	
	}, 500));
			
	window.addEventListener("resize", function(){
		
		setSmallNotificationPosition();
		
	});	
		
	function onSmallScreenResolution(callback) {
		
		if ( callback ) {
			customSmallScreenResolutionCallbacks.push(callback);			
		} else {			
			smallScreenResolutionCallbacks.push(defaultOnSmallScreenResolutionCallback);
		}		
						
	}
				
	function isUnsupportedBrowser() {
		
		if ( !Modernizr.csscalc || !Modernizr.cssremunit) {
			return true;
		}
		
		return false;
		
	}
	
	/* BROWSER NOT SUPPORTED */
	function defaultBrowserNotSupportedCallback() {
		
		if ( isUnsupportedBrowser() ) {
					
			if ( jQuery(".cloubi-default-notification").length == 0 ) {
				
				var dialog = createNotification();
				
				createMessage(dialog, Liferay.Language.get('cloubi-notification-browser-not-supported-header'), Liferay.Language.get('cloubi-notification-browser-not-supported-info'), true);

				createCross(dialog);
				
				if ( jQuery(".cloubi-default-small-notification").length == 0 )	
					createSmallNotification();
				 
				if ( jQuery(".cloubi-default-notification").length > 1 || localStorage.getItem("cloubi-notification-dismiss") === "true" ) {
					hideDialog();
				}
				
			} else {
				
				var dialog = dialogs.getDialog('notificationDialog');
				
				createMessage(dialog, Liferay.Language.get('cloubi-notification-browser-not-supported-header'), Liferay.Language.get('cloubi-notification-browser-not-supported-info'), false);
												
			}
			
		} 
		
	}
			
	window.addEventListener("load", function(){		
		
		//testCloubiConnection();
		
		if ( customBrowserNotSupportedCallbacks.length > 0 ) {
			trigger(customBrowserNotSupportedCallbacks);	
		} else {
			trigger(browserNotSupportedCallbacks);	
		}	
		
		if ( customSmallScreenResolutionCallbacks.length > 0 ) {
			trigger(customSmallScreenResolutionCallbacks);	
		} else {
			trigger(smallScreenResolutionCallbacks);	
		}
		
		setSmallNotificationPosition();
				
	});
		
	function onBrowserNotSupported(callback) {
		
		if ( callback ) {
			customBrowserNotSupportedCallbacks.push(callback);			
		} else {			
			browserNotSupportedCallbacks.push(defaultBrowserNotSupportedCallback);
		}		
						
	}	
	
	function trigger(callbacks) {		
		jQuery.each(callbacks, function(i, func){			
			func();	
		});
	}
		
	function setSmallNotificationPosition(){
		
		var topBarHeight = jQuery("#frame-top-bar").height();
		jQuery(".cloubi-default-small-notification").css("top", topBarHeight + 15);	
		
	}
			
	return {		
		onCloubiOffline: onCloubiOffline,
		onOffline: onOffline,
		onOnline: onOnline,
		onSmallScreenResolution: onSmallScreenResolution,
		onBrowserNotSupported: onBrowserNotSupported,
		hideDialog: hideDialog,
		createCross: createCross,
		createMessage: createMessage,
		createNotification: createNotification,
		createSmallNotification: createSmallNotification,
		removeSmallNotification: removeSmallNotification,
		isUnsupportedBrowser: isUnsupportedBrowser,
		setSmallScreenResolutionLimit: setSmallScreenResolutionLimit,
		getSmallScreenResolutionLimit: getSmallScreenResolutionLimit,
		messages: {
			screenResolutionTooSmallHeader: Liferay.Language.get('cloubi-notification-screen-resolution-too-small-header'),
			screenResolutionTooSmallInfo: Liferay.Language.get('cloubi-notification-screen-resolution-too-small-info')
		},
		onReconnectTick: onReconnectTick,
		setNeedForOnlineCheck: setCheckOnLoad
		
		/*onReconnect: onReconnect,		
		onSlowConnection: onSlowConnection*/
	};

});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/additional-content', ['./utils', './material'], function(utils, material) {
	
	/**Contains functions for listing and accessing additional content for material pages. To use this API, load it like this:
	 
	 <pre><code>
	require(['fi.cloubi.frontend/additional-content'], function(ac) {
		ac.getContents(function(response) {
			console.log(response);
		});
	});
	 </code></pre>
	 
	 Usage:<br><br>
	 Calling getContents() will return a response with several objects: a files object with all the {@link additionalcontent.Content} files
	 on the page and two content folders (generally displayed as tabs). Each folder has a list of file IDs inside that folder - these are the
	 contents that should be displayed when that folder/tab is selected. Each file may be a folder containing files itself, in which case the
	 IDs are included in that file's additionalContent array. Note that these references may be cyclical (a file may indirectly contain itself),
	 so the entire folder structure should never be displayed at once.<br>
	 Files with the popupRenderable flag set to true can be loaded inline into Cloubi by loading the file's contentUrl and inserting the response
	 HTML into the DOM. Note that when doing this, any script tags in the response MUST be preserved and executed, such as when using jQuery.load().
	 If a file has a contentUrl but it is not popupRenderable, the contentUrl should be treated as an external link that should be opened 
	 in a new tab when the file is opened. If a file has the downloadable flag set to true, it can be downloaded by calling getDownloadLink()
	 with its ID and then opening the response URL as a download link.
	 <br><br>
	 
	 Playlist integration:<br><br>
	 When the page has loaded, any additional content UI should check if Cloubi.additionalContent.initialContent exists and if so,
	 attempt to display that content. Note that the content may be some other user's user content that is not included in the list of
	 all contents received from getContents(), in which case it must be loaded separately with getSingleContent().
	 <br><br>
	 To get notified when a playlist changes to an additional content item, listen to page changes like this:
	 <pre><code>
	 material.onPageChange(function (page, options, data){
		//If the page change data has a related content ID, show the related content with that ID
		if (data.relatedContentId){
			ac.getSingleContent(data.relatedContentId, data.playlistId, function(response){
				if (response.success){
					var contentData = response.files[data.relatedContentId];
					//Display the content represented by contentData here
				}
			});
		}
	 });
	 </code></pre>
	 
	 * @namespace additionalcontent */
	
	/**Represents an individual piece of additional content
	 * @memberof additionalcontent
	 * @typedef {Object} Content
	 * @property {string[]} additionalContent	An array containing the IDs of any sub-content nested inside this content
	 * @property {string} contentType			The MIME content type of this content
	 * @property {string} [contentUrl]			An URL that can be loaded to render the file contents of this content inside Cloubi
	 * @property {string} description			The description of the content
	 * @property {boolean} editable				If true, the user can edit the title of this file
	 * @property {string} id					The unique ID of this content
	 * @property {boolean} playlistEnabled		If true, the user can add this content to a playlist
	 * @property {boolean} popupRenderable		True if this content can be rendered by loading the content URL in a modal dialog
	 * @property {string} title					The name of this file
	 * @property {string} typeName				The human-readable name of this file's data type
	 * @property {boolean} downloadable			If true, this content can be downloaded by getting the download URL with {@link additionalcontent.getDownloadLink}*/
	
	/**Represents a root content folder
	 * @memberof additionalcontent
	 * @typedef {Object} ContentFolder
	 * @property {string[]} additionalContent	An array containing the IDs of any content contained inside this folder
	 * @property {boolean} canAdd				True if the user can upload files into this content folder
	 * @property {number} [maxSize]				The maximum size of files (in bytes) that can be uploaded into this folder if 
	 * 											this folder supports uploading*/
	
	/**A server response object
	 * @memberof additionalcontent
	 * @mixin
	 * @typedef {Object} Response
	 * @property {boolean} success		True if the request was successful
	 * @property {string[]} [errors]	An array of errors that were encountered while processing the request*/
	
	/**A callback that receives all content on a page
	 * @memberof additionalcontent
	 * @callback AllContentCallback
	 * @param {additionalcontent.Response} response							The server response
	 * @param {Object.<string, additionalcontent.Content>} [response.files]	An object mapping content IDs to Content objects
	 * @param {additionalcontent.ContentFolder} [response.libraryFiles]		The library additional content on the page
	 * @param {additionalcontent.ContentFolder} [response.userFiles]		The user additional content on the page*/
	
	/**A callback that receives content that was specifically requested
	 * @memberof additionalcontent
	 * @callback ContentCallback
	 * @param {additionalcontent.Response} response							The server response
	 * @param {Object.<string, additionalcontent.Content>} [response.files]	An object mapping content IDs to Content objects*/
	
	/**A callback that receives a content download URL
	 * @memberof additionalcontent
	 * @callback URLCallback
	 * @param {additionalcontent.Response} response		The server response
	 * @param {string} [response.downloadUrl]			The requested URL*/
	
	/**A generic callback that receives information about an operation's success or failure
	 * @memberof additionalcontent
	 * @callback GenericCallback
	 * @param {additionalcontent.Response} response	The server response*/
	
	/**The native JS File type
	 * @external File
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/File|File}*/
	
	/**Servlet address*/
	var ENDPOINT = "/o/related-content/";
	/**Material ID parameter*/
	var PARAM_MATERIAL_ID = "materialId";
	/**Page ID parameter*/
	var PARAM_PAGE_ID = "pageId";
	/**Content ID parameter*/
	var PARAM_CONTENT_ID = "fileId";
	/**Playlist ID parameter*/
	var PARAM_PLAYLIST_ID = "playlistId";
	/**File name parameter*/
	var PARAM_FILENAME = "fileName";
	
	/**Loads all additional content for a given material page.
	 * <br>Can produce the following errors:
	 * <ul>
	 * <li><b>no-such-material</b> if the requested material ID does not match any available material
	 * <li><b>no-such-page</b> if the requested page ID does not match any valid page
	 * </ul>
	 * @memberof additionalcontent
	 * @param {additionalcontent.AllContentCallback} [callback]	A callback to receive the data
	 * @param {string} [requestedMaterial=current material id]	The requested material ID of the material containing the page
	 * @param {string} [pageId=current page id]					The ID of the page whose additional content should be retrieved*/
	function getContents(callback, requestedMaterial, pageId){
		var data = {};
		data[PARAM_MATERIAL_ID] = requestedMaterial || material.getRequestedMaterial();
		data[PARAM_PAGE_ID] = pageId || material.getCurrentPageId();
		utils.post(ENDPOINT + "contents", data, callback);
	}
	
	/**Gets the data of an individual additional content file.
	 * <br>Can produce the following errors:
	 * <ul>
	 * <li><b>content-not-available</b> if the requested content ID does not match any available content
	 * </ul>
	 * @memberof additionalcontent
	 * @param {string} contentId								The ID of the content to get
	 * @param {string} [playlistId]								The ID of the currently active playlist if any
	 * @param {additionalcontent.ContentCallback} [callback]	A callback to receive the result*/
	function getSingleContent(contentId, playlistId, callback){
		var data = {};
		data[PARAM_CONTENT_ID] = contentId;
		data[PARAM_PLAYLIST_ID] = playlistId;
		utils.post(ENDPOINT + "content", data, callback);
	}
	
	/**Uploads a file to the userFiles additional content folder.
	 * <br>Can produce the following errors:
	 * <ul>
	 * <li><b>invalid-upload</b> if the sent file was not successfully received by the server
	 * <li><b>upload-not-permitted</b> if the user is not allowed to upload additional content files
	 * <li><b>upload-failed</b> if the file was received but could not be saved
	 * <li><b>invalid-upload</b> if the sent file was not successfully received by the server
	 * <li><b>file-too-large</b> if the sent file was larger than the server allows
	 * <li><b>no-such-material</b> if the requested material ID does not match any available material
	 * <li><b>no-such-page</b> if the requested page ID does not match any valid page
	 * </ul>
	 * @memberof additionalcontent
	 * @param {external:File} file	The file to upload
	 * @param {string} [name=file.name]														A custom file name for the file
	 * @param {additionalcontent.GenericCallback} [callback]								A callback to handle the server response
	 * @param {number} [materialId=current material ID]										The ID of the material to contain the content
	 * @param {string} [pageId=current page ID]												The ID of the page to contain the content*/
	function uploadUserFile(file, name, callback, materialId, pageId){
		var data = {};
		data[PARAM_MATERIAL_ID] = materialId || material.getCurrentMaterialId();
		data[PARAM_PAGE_ID] = pageId || material.getCurrentPageId();
		data[PARAM_FILENAME] = name || file.name;
		utils.upload(ENDPOINT + "add-file", data, file, callback);
	}
	
	/**Deletes a user-uploaded additional content file.
	 * <br>Can produce the following errors:
	 * <ul>
	 * <li><b>content-not-available</b> if the requested content ID does not match any available content or the user is not allowed to delete it
	 * </ul>
	 * @memberof additionalcontent
	 * @param {string} contentId								The ID of the file to delete
	 * @param {additionalcontent.GenericCallback} [callback]	A callback to handle the server response*/
	function deleteUserFile(contentId, callback){
		var data = {};
		data[PARAM_CONTENT_ID] = contentId;
		utils.post(ENDPOINT + "delete-file", data, callback);
	}
	
	/**Renames a user-uploaded additional content file.
	 * C<br>an produce the following errors:
	 * <ul>
	 * <li><b>content-not-available</b> if the requested content ID does not match any available content or the user is not allowed to rename it
	 * </ul>
	 * @memberof additionalcontent
	 * @param {string} contentId								The ID of the file to delete
	 * @param {string} name										The new name of the file
	 * @param {additionalcontent.GenericCallback} [callback]	A callback to handle the server response*/
	function renameUserFile(contentId, name, callback){
		var data = {};
		data[PARAM_CONTENT_ID] = contentId;
		data[PARAM_FILENAME] = name;
		utils.post(ENDPOINT + "rename-file", data, callback);
	}
	
	/**Gets a download link to an additional content file. This should only be called immediately before starting the download, as
	 * the URL may expire over time.
	 * <br>Can produce the following errors:
	 * <ul>
	 * <li><b>content-not-available</b> if the requested content ID does not match any available content or the user is not allowed to delete it
	 * <li><b>content-not-available</b> if the requested content ID does not match any available content or the user is not allowed to delete it
	 * </ul>
	 * @memberof additionalcontent
	 * @param {string} contentId								The ID of the file to delete
	 * @param {string} [playlistId]								The ID of the current playlist (if any). Required to download other users' user
	 * 															content from playlists.
	 * @param {additionalcontent.URLCallback} [callback]		A callback to handle the server response*/
	function getDownloadLink(contentId, playlistId, callback){
		var data = {};
		data[PARAM_CONTENT_ID] = contentId;
		data[PARAM_PLAYLIST_ID] = playlistId;
		utils.post(ENDPOINT + "download-link", data, callback);
	}
	
	return {
		getContents: getContents,
		getSingleContent: getSingleContent,
		uploadUserFile: uploadUserFile,
		deleteUserFile: deleteUserFile,
		renameUserFile: renameUserFile,
		getDownloadLink: getDownloadLink
	};
});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/rest-client', ['fi.cloubi.lib.js/jquery'], function (jQuery) {

    function RestClient(baseUrl) {
        this.baseUrl = baseUrl;
    }

    RestClient.prototype.trackProgress = function (trackerId, progressCallback) {
        var self = this;

        return new Promise(function (resolve, reject) {
            self.pollForProgress(trackerId, progressCallback, resolve, reject);
        });
    };

    RestClient.prototype.pollForProgress = function (trackerId, progressCallback, success, failure) {
        var self = this;

        setTimeout(function () {
            self.updateProgressTracker(trackerId).then(function (progressState) {
                if (progressCallback != null) {
                    progressCallback(progressState.percentage, progressState.description, progressState);
                }

                if (progressState.status === 'error') {
                    failure(progressState.description);
                } else if (progressState.status === 'success') {
                    success(progressState.result);
                } else {
                    self.pollForProgress(trackerId, progressCallback, success, failure);
                }
            })
                .catch(function (error) {
                    failure(error);
                });
        }, 500);
    };

    RestClient.prototype.updateProgressTracker = function (trackerId) {
        return this.GET('progress/job/' + trackerId);
    };

    RestClient.prototype.downloadFile = function (handler, downloadId) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {

                var contentDisposition = this.getResponseHeader("Content-Disposition");
                var filename = "download";

                if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    var matches = filenameRegex.exec(contentDisposition);
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }

                var url = window.URL.createObjectURL(this.response);
                var anchor = document.createElement('a');

                anchor.href = url;
                anchor.download = filename;
                anchor.click();
                window.URL.revokeObjectURL(url);
            }
        };

        xhr.open('GET', this.baseUrl + 'download/' + handler + '/' + downloadId);
        xhr.responseType = 'blob';
        xhr.send();
    };

    RestClient.prototype.uploadFile = function (url, files, progressTracker, optionalData) {
        var self = this;

        return new Promise(function (resolve, reject) {
            var formData = new FormData();

            if (files instanceof FileList) {
                for (var i = 0; i < files.length; i++) {
                    formData.append('encoded-filename', encodeURIComponent(files[i].name));
                    formData.append('files', files[i]);
                }
            } else if (files instanceof File) {
                formData.append('encoded-filename', encodeURIComponent(files.name));
                formData.append('files', files);
            }

            if (optionalData) {
                Object.keys(optionalData).forEach(function (key) {
                    if (Array.isArray(optionalData[key])) {
                        optionalData[key].forEach(function (item) {
                            formData.append(key, item);
                        });
                    } else {
                        formData.append(key, optionalData[key]);
                    }
                });
            }

            jQuery.ajax({
                type: 'POST',
                url: self.baseUrl + url,
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                enctype: 'multipart/form-data',
                success: function (data, status, xhr) {
                    if (xhr.status === 202) {
                        var trackerId = xhr.getResponseHeader('Progress-Tracker-Job-Id');
                        self.trackProgress(trackerId, function (percentage, description) {
                            progressTracker.progress = percentage;
                        }).then(resolve).catch(reject);
                    } else if (xhr.status === 200) {
                        resolve(data);
                    } else {
                        reject(status);
                    }
                },
                error: reject,
                xhr: function () {
                    var request = jQuery.ajaxSettings.xhr();
                    if (request.upload) {
                        request.upload.addEventListener('progress', function (event) {
                            if (progressTracker && event.lengthComputable) {
                                var max = event.total;
                                var current = event.loaded;
                                progressTracker.progress = (Math.round((current / max) * 100));
                            }
                        }, false);
                    }
                    return request;
                }
            });
        });
    };

    RestClient.prototype.ajaxPromise = function (type, url, data) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var queryData = null;
            if (type !== 'GET') {
                queryData = JSON.stringify(data);
            }

            jQuery.ajax({
                type: type,
                url: self.baseUrl + url,
                data: queryData,
                contentType: 'application/json; charset=utf-8',
                success: function (data, status, xhr) {
                    if (xhr.status === 202) {
                        resolve(xhr.getResponseHeader('Progress-Tracker-Job-Id'));
                    } else {
                        var contentDisposition = xhr.getResponseHeader('Content-Disposition');
                        var contentType = xhr.getResponseHeader('Content-Type');
                        if (contentDisposition) {
                            resolve({
                                "data": data,
                                "contentDisposition": contentDisposition,
                                "contentType": contentType
                            });
                        } else {
                            resolve(data);
                        }
                    }
                },
                error: reject
            });
        });
    };

    RestClient.prototype.GET = function (url, data) {
        if (data) {
            var query = "?";
            query += Object.entries(data)
            .filter(function(pair) { return pair[1] !== undefined; })
            .map(function(pair) {
                if (Array.isArray(pair[1])) {
                    return pair[1]
                    .filter(function(value) { return value !== undefined; })
                    .map(function(value) {
                        return encodeURIComponent(pair[0]) + "=" + encodeURIComponent(value);
                    }).join("&")
                }
                return encodeURIComponent(pair[0]) + "=" + encodeURIComponent(pair[1]);
            }).join("&");
            url += query;
        }
        return this.ajaxPromise('GET', url, null);
  };

  RestClient.prototype.POST = function (url, data) {
    return this.ajaxPromise('POST', url, data);
  };

  RestClient.prototype.DELETE = function (url, data) {
    return this.ajaxPromise('DELETE', url, data);
  };

  return RestClient;
});

define('fi.cloubi.frontend.common.js@4.9.0.SNAPSHOT/task', ['./utils', './material', './dialog', './adaptivity', './bigimage'], function (utils, material, dialogs, adaptivity, bigimage) {

    var TYPE_UI_MODULE = 2;
    var TYPE_ANSWER_MODULE = 3;
    var TYPE_EDITOR_MODULE = 4;
    var TYPE_GROUP_MODULE = 5;
    var TYPE_FILE_MODULE = 6;
    var TYPE_NAVIGATION_MODULE = 7;
    var STATUS_CODE_SUCCESS = 0;
    var STATUS_CODE_ERROR = 101;

    var engineApiListeners = [];
    var namedEngineApiListeners = {};
    var allTaskStates = [];
    var taskHeightChangeAnimationDuration = 0;

    var taskLoadingStatus = {
        loading: false,
        namespace: null,
        state: null,
        lazyLoadListenerPending: true,
        queue: [],
        process: processQueuedTasks,
        finished: taskFinishedLoading
    };

    function loader(e) {
        setTimeout(function () {
            var active = $(document.activeElement);
            if (active.is('iframe') && active.attr('data-src')) {
                active.attr('src', active.attr('data-src'));
                active.removeAttr('data-src');
            }
        });
    }

    $(document).focusout(loader);

    $('.cloubi-library-tasks-iframe').on("load", function () {
        $(this).contents().focusout(loader);
    });

    function processQueuedTasks() {

        //If we're already loading a task, do nothing UNLESS the task being loaded has been hidden or removed from the DOM
        if (taskLoadingStatus.loading && isTaskOnPage(taskLoadingStatus.namespace)) {
            if (isTaskHidden(taskLoadingStatus.namespace)) {
                //Cancel current load and queue up the next one if the currently loading task has been hidden
                cancelTaskLoad();
            } else {
                return;
            }
        }

        if (taskLoadingStatus.lazyLoadListenerPending) {
            taskLoadingStatus.lazyLoadListenerPending = false;
            jQuery(window).off('scroll.tasks resize.tasks cloubi:task:visibility:changed')
                .on('scroll.tasks resize.tasks cloubi:task:visibility:changed', taskLoadingStatus.process);
        }

        if (taskLoadingStatus.queue.length > 0) {
            var next = findQueuedTaskInView();
            if (next) {
                taskLoadingStatus.loading = true;
                taskLoadingStatus.namespace = next.namespace;
                taskLoadingStatus.state = next;
                console.log("Start loading task " + taskLoadingStatus.namespace);
                var iframe = jQuery("#" + next.namespace + "iframe");
                var source = iframe.attr("data-src");
                if (source) {
                    iframe.attr("src", source);
                    iframe.removeAttr('data-src');
                }
            }
        } else {
            jQuery(window).off('scroll.tasks resize.tasks cloubi:task:visibility:changed');
            taskLoadingStatus.lazyLoadListenerPending = true;
        }

    }

    /**Cancels the loading of the currently loading task and moves it back to the loading queue
     * Note that if the task is currently visible, it may be selected for loading next anyway.
     * This function does not automatically start loading the next queued task, so you should manually invoke processQueuedTasks if necessary*/
    function cancelTaskLoad() {
        if (taskLoadingStatus.loading) {
            //Put loading task back into queue
            taskLoadingStatus.queue.push(taskLoadingStatus.state);
            //Cancel loading by removing the source
            var iframe = getTaskByNamespace(taskLoadingStatus.namespace);
            iframe.removeAttr("src");
            //Reset loading status
            taskLoadingStatus.loading = false;
            taskLoadingStatus.namespace = null;
            taskLoadingStatus.state = null;
        }
    }

    /**Checks whether the current page contains a task with the specified namespace
     * @param namespace The namespace of the task
     * @return  true if the current page contains the task, false otherwise*/
    function isTaskOnPage(namespace) {
        return (jQuery("#" + namespace + "iframe").length > 0);
    }

    function findQueuedTaskInView() {
        var taskInView = null;
        var queue = [];
        jQuery.each(taskLoadingStatus.queue, function (index, task) {
            if (taskInView == null) {
                var iframe = jQuery("#" + task.namespace + "iframe");
                if (isTaskIframeInView(iframe)) {
                    taskInView = task;
                } else {
                    queue.push(task);
                }
            } else {
                queue.push(task);
            }
        });
        if (taskInView) {
            taskLoadingStatus.queue = queue;
        }
        return taskInView;
    }

    /**Checks whether a task is currently hidden with CSS
     * @param namespace The namespace of the task
     * @return  true if the task exists and is hidden, false otherwise*/
    function isTaskHidden(namespace) {
        var task = getTaskByNamespace(namespace);
        return task && !task.is(":visible");
    }

    function isTaskIframeInView(task) {
        if (!task.is(":visible")) {
            return false;
        }
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var offset = task.offset();
        if (offset) {
            var elemTop = offset.top;
            var elemBottom = elemTop + task.height();
            return (elemTop >= docViewTop && elemTop <= docViewBottom) ||
                (elemBottom >= docViewTop && elemBottom <= docViewBottom);
        } else {
            return false;
        }
    }

    function taskFinishedLoading() {
        console.log("Finished loading task " + taskLoadingStatus.namespace + ", " + taskLoadingStatus.queue.length + " task remain in queue");
        taskLoadingStatus.loading = false;
        taskLoadingStatus.namespace = null;
        taskLoadingStatus.state = null;
        taskLoadingStatus.process();
    }

    /**Finds a task on the page by its namespace
     * @param {string} namespace    The namespace of the task
     * @return {jQuery|null}    A JQuery object selecting the task iframe or null if no task with the specified namespace exists on the page*/
    function getTaskByNamespace(namespace) {
        var task = jQuery("#" + namespace + "iframe");
        return task.length > 0 ? task : null;
    }

    function createTaskState(id) {

        return {
            namespace: parseNamespaceFromId(id),
            reference: null,
            structure: '',
            isReady: false,
            pageCount: 1,
            currentPageIndex: 1,
            flashInEditMode: false,
            isPrintingAllowed: false,
            fullscreenMode: false,
            settings: '',
            mediaIdMappings: {},
            scoreMax: 100,
            relativeFontSize: material != null ? material.getFontSize() : 0,
            logStartTime: (new Date()).getTime(),
            previousFatalErrorTimestamp: 0,
            successStatus: null,
            answers: {},
            hasCachedAnswers: false,
            sharedAnswers: {},
            suspendData: null,
            sharedSuspendData: {},
            metrics: {},
            hasCachedMetrics: false,
            structureAnswers: {},
            hasCachedStructureAnswers: false,
            metricsLastStoredTimestamp: 0,
            structureComments: {},
            hasCachedComments: false,
            showPaging: true,
            nextAllowed: true,
            paused: false,
            metadata: null,
            mediaMetadatas: {},
            scoreRaw: 0,
            progressMeasure: 0,
            hasCachedScore: false,
            engineApi: null,
            engineMetadata: {name: null, revision: 0},
            suspendPromise: null,
            productSettings: {}
        };

    }

    function getValidTaskStates() {
        var list = [];
        jQuery.each(allTaskStates, function (index, taskState) {
            if (jQuery("#" + taskState.namespace + "iframe").length > 0) {
                list.push(taskState);
            }
        });
        return list;
    }

    /**Removes invalid tasks from task states and cleans old interface variables from window*/
    function cleanTaskStates() {
        //Loop through a copy of allTaskStates to allow safe modification of the original
        jQuery.each(allTaskStates.slice(), function (index, taskState) {
            var namespace = taskState.namespace;
            //Check whether the task is still valid
            if (!isTaskOnPage(namespace)) {
                console.log("Cleaning up removed task " + namespace);

                var taskStateIndex = -1;

                for (var i = 0; i < allTaskStates.length; i++) {
                    if (namespace == allTaskStates[i].namespace) {
                        taskStateIndex = i;
                        break;
                    }
                }

                //Remove task state from all states
                if (taskStateIndex >= 0)
                    allTaskStates.splice(taskStateIndex, 1);

                //Clean up the task's global variables
                jQuery.each(window, function (name, val) {
                    //Remove any fields in window that start with the task's namespace prefix
                    if (name.startsWith(namespace)) {
                        delete window[name];
                    }
                });

                // Remove named engine api listeners associated with the task namespace.
                delete namedEngineApiListeners[taskState.namespace];
            }
        });
    }

    function getTasks() {
        var list = [];
        jQuery.each(getValidTaskStates(), function (index, taskState) {
            list.push({
                api: taskState.engineApi,
                engine: taskState.engineMetadata.name,
                revision: taskState.engineMetadata.revision,
                id: taskState.namespace
            });
        });
        return list;
    }

    function registerApiListener(callback) {
        engineApiListeners.push(callback);
    }

    /**
     * Register a task engine API listener that reacts to events only in tasks with specified namespace.
     * @param {String}   namespace - The task namespace.
     * @param {Function} callback  - Function to call when the listener is registered.
     */
    function registerNamedApiListener(namespace, callback) {
        if (jQuery.isArray(namedEngineApiListeners[namespace])) {
            namedEngineApiListeners[namespace].push(callback);
        } else {
            namedEngineApiListeners[namespace] = [callback];
        }
    }

    function getTaskFrameElement(taskState) {
        return jQuery("#" + taskState.namespace + "iframe");
    }

    function getTaskBodyElement(taskState) {
        return getTaskFrameElement(taskState).contents().find('body');
    }

    /**
     * Sets the duration for task height change animation.
     * @param {Number} animation duration - The duration in milliseconds.
     */
    function setTaskHeightChangeAnimationDuration(duration) {
        taskHeightChangeAnimationDuration = duration;
    }

    /**
     * Returns the current duration for task height change animation.
     * @return {Number} The duration in milliseconds.
     */
    function getTaskHeightChangeAnimationDuration() {
        return taskHeightChangeAnimationDuration;
    }

    function registerFunction(taskState, obj, name) {
        if (typeof obj[name] === "function") {
            self[taskState.namespace + name] = function () {
                //console.log(name + " called");
                return obj[name].apply(this, arguments);
            };
        }
    }

    function pickCurrentMaterialAndPage(data, page) {
        if (page) {
            data.materialId = material.getCurrentMaterialId();
            data.page = page.id;
        }
    }

    function readFullTaskState(taskState, task) {
        taskState.scoreRaw = task.score.score;
        taskState.progressMeasure = task.score.progressMeasure;
        taskState.hasCachedScore = true;
        taskState.suspendData = task.suspendData;
        taskState.structureComments = task.comments;
        taskState.hasCachedComments = true;
        taskState.answers = task.answers;
        taskState.hasCachedAnswers = true;
        taskState.structureAnswers = task.structureAnswers;
        taskState.hasCachedStructureAnswers = true;
        taskState.metrics = task.metrics;
        taskState.hasCachedMetrics = true;
        taskState.successStatus = task.successStatus;
    }


    /**Creates a Cloubi task interface
     * @param userData  An object containing data identifying the server, task and user
     * @param taskState A taskState object representing the current state of the task, as created by createTaskState()
     * The rest of the parameters indicate which modules to include and allow overriding their functionality.
     * Passing null or undefined skips initializing that module.
     * Passing an object that contains a function with a name defined in that module will override the default interface
     * function with the function from the parameter.
     * Pass an empty object ({}) to use the default implementation for the module.
     * If any additional beyond normal parameter list length parameters are passed, all of their functions will be
     * registered into the interface.
     * Note that if these functions have the same name as a function in the default interface, they will
     * override the default implementation.*/
    function createTask(userData, taskState, uiModule, answerModule, editorModule, groupModule, fileModule, navigationModule) {

        if (arguments.length > 1) {

            var generalModule = createGeneralModule(taskState);

            initListeners(taskState, userData);

            jQuery.each(generalModule, function (name) {

                registerFunction(taskState, generalModule, name);

            });

            //Loop through all module arguments
            jQuery.each(arguments, function (i, argument) {

                if (i > 1 && argument) {

                    //Create a default implementation if the module is one of the standard types
                    var defaultModule = null;

                    if (i == TYPE_UI_MODULE) defaultModule = getModule(TYPE_UI_MODULE, taskState);
                    if (i == TYPE_ANSWER_MODULE) defaultModule = getModule(TYPE_ANSWER_MODULE, taskState, userData);
                    if (i == TYPE_EDITOR_MODULE) defaultModule = getModule(TYPE_EDITOR_MODULE, taskState);
                    if (i == TYPE_GROUP_MODULE) defaultModule = getModule(TYPE_GROUP_MODULE, taskState);
                    if (i == TYPE_FILE_MODULE) defaultModule = getModule(TYPE_FILE_MODULE, taskState, userData);
                    if (i == TYPE_NAVIGATION_MODULE) defaultModule = getModule(TYPE_NAVIGATION_MODULE, taskState);

                    if (defaultModule) {
                        //Loop through all functions in the default implementation
                        jQuery.each(defaultModule, function (name) {
                            //If the argument overrides the implementation, use the override
                            if (argument[name] != undefined) {

                                registerFunction(taskState, argument, name);

                                //Otherwise use default
                            } else {

                                registerFunction(taskState, defaultModule, name);

                            }

                        });
                        //If not a standard module, register all functions
                    } else {

                        jQuery.each(argument, function (name) {

                            registerFunction(taskState, argument, name);

                        });

                    }

                }

            });

        }

        allTaskStates.push(taskState);

    }

    function getModule(type, taskState, userData) {

        if (type == TYPE_UI_MODULE) return createUIModule(taskState);
        if (type == TYPE_ANSWER_MODULE) return createAnswerModule(taskState, userData.basePath, userData.server, userData.task, userData.user);
        if (type == TYPE_EDITOR_MODULE) return createEditorModule(taskState);
        if (type == TYPE_GROUP_MODULE) return createGroupModule(taskState);
        if (type == TYPE_FILE_MODULE) return createFileModule(taskState, userData.basePath, userData.server, userData.task, userData.user);
        if (type == TYPE_NAVIGATION_MODULE) return createNavigationModule(taskState);

    }

    function initListeners(taskState, userData) {
        if (material != null) {
            material.onFontSizeChange(function (size) {
                callFontSizeChanged(size, taskState);
            }, true);
        }

        /** Notify listeners when TaskAPI task:page:changed event occurs. */
        registerNamedApiListener(taskState.namespace, function (data) {
            data.api.on("task:page:changed", function (index) {
                var url = createPath.apply(this, [
                    userData.basePath,
                    userData.server,
                    userData.task,
                    userData.user,
                    "page-changed"
                ]);

                var postData = {
                    taskPageIndex: index
                }

                getCurrentMaterialAndPage()
                    .then(function (materialAndPage) {
                        decoratePostData(postData, materialAndPage);
                    })
                    .catch(function (e) {
                        console.warn(e);
                    })
                    .finally(function () {
                        utils.post(url, postData,
                            function () {
                                return;
                            },
                            function (error) {
                                logError(error, taskState);
                            });
                    });
            });
        });
    }

    function createGeneralModule(taskState) {

        return {

            setDelegate: function (delegate) {
            },
            ready: function () {

                try {

                    var taskDelegate = getFlashElement(taskState.namespace);

                    taskState.isReady = true;
                    taskState.pageCount = taskDelegate.getNumberOfPages();

                    if (taskState.currentPageIndex >= taskState.pageCount) {
                        taskState.currentPageIndex = taskState.pageCount - 1;
                    }

                    taskDelegate.gotoPage(taskState.currentPageIndex);

                    if (taskState.flashInEditMode) {
                        taskDelegate.toEditMode();
                    }

                    /*
                    if ( taskDelegate.isPrintingAllowed ) {
                        if ( taskDelegate.isPrintingAllowed() ) {
                            enabledPrintButton();
                        }
                    }
                    */

                    //Notify listeners about task load
                    jQuery("body").trigger("cloubi:task:ready");

                    taskLoadingStatus.finished();

                } catch (error) {

                    logError(error, taskState);

                }

            },
            setPageAttribute: function (key, value) {

                try {

                    if (!self.TaskSharedPageAttributes) {

                        self.TaskSharedPageAttributes = {};

                    }

                    var oldValue = null;

                    if (self.TaskSharedPageAttributes[key]) {

                        oldValue = self.TaskSharedPageAttributes[key];
                    }

                    self.TaskSharedPageAttributes[key] = value;

                    callPageAttributeChanged(key, oldValue, value);

                } catch (error) {

                    logError(error, taskState);

                }

            },
            getPageAttribute: function (key) {
                try {
                    if (self.TaskSharedPageAttributes) {
                        if (self.TaskSharedPageAttributes[key]) {
                            return self.TaskSharedPageAttributes[key];
                        }
                    }

                    return null;
                } catch (error) {
                    logError(error, taskState);
                }
            },
            setReference: function (ref) {
                try {
                    taskState.reference = ref;
                } catch (error) {
                    logError(error, taskState);
                }
            },
            apiSupportsFunction: function (name) {
                try {
                    return getAPIFunctionName(taskState.namespace, name) != null;
                } catch (err) {
                    logError(error, taskState);
                    return false;
                }
            },

            methodComplete: function (methodName, statusCode, result) {

            },
            registerEngineAPI: function (api) {
                try {
                    taskState.engineApi = api;
                    var data = {
                        api: api,
                        engine: taskState.engineMetadata.name,
                        revision: taskState.engineMetadata.revision,
                        id: taskState.namespace
                    };

                    jQuery.each(engineApiListeners, function (index, callback) {
                        callback(data);
                    });

                    jQuery.each(namedEngineApiListeners[taskState.namespace], function (index, callback) {
                        callback(data);
                    });
                } catch (error) {
                    logError(error, taskState);
                }

            },
            /**Called when the task has finished suspending*/
            taskSuspended: function () {
                //Signal anyone waiting for the task to suspend
                if (taskState.suspendPromise) {
                    //Resolve the promise
                    taskState.suspendPromise.deferred.resolve();
                    //Clear the suspend state
                    taskState.suspendPromise = null;
                }
            },
            /**Called when the task starts suspending*/
            taskIsAboutToSuspend: function () {
                if (taskState.suspendPromise) {
                    //Indicate that suspension has successfully started
                    taskState.suspendPromise.suspending = true;
                }
            }

        };

    }

    function createUIModule(taskState) {

        return {

            setCheckAnswersButtonEnabled: function () {
            }, // deprecated
            setScoreDisplayType: function () {
            }, // deprecated
            setOwnOrCorrectButtonsVisible: function () {
            }, // deprecated
            answersAndStateStoringProgress: function () {
            },
            setOwnResponsesVisible: function () {
            },
            changeHeight: function (height) {
                if (!taskState.fullscreenMode) {
                    var iframe = jQuery("#" + taskState.namespace + "iframe");

                    if (taskHeightChangeAnimationDuration != 0) {
                        iframe.animate({
                            "height": height
                        }, {
                            queue: false,
                            duration: taskHeightChangeAnimationDuration
                        });
                    } else {
                        iframe.height(height);
                    }
                }
            },
            getRelativeFontSize: function () {
                console.log("getRelativeFontSize called");
                try {
                    if (!material) {
                        return 0;
                    }

                    return material.getFontSize();
                    //return taskState.relativeFontSize;
                } catch (error) {
                    logError(error, taskState);
                }

            },
            showLargeStaticContent: function (contentType, content, title, desc) {
                dialogs.showLargeStaticContent(contentType, content, title, desc);

            },

            showLargeZoomableImage: function (imageElement) {
                bigimage.showZoomableImageAction(imageElement, imageElement.attr("src"));
            }

        };

    }

    function createAnswerModule(taskState, basePath, server, task, user) {

        if (!basePath) {
            basePath = "/o/task-container";
        }

        if (!server || !task || !isValidUser(user)) {

            if (window.console) {
                console.error("Create answer module failed.")
            }

            return;
        }

        //Preload and cache all task data
        var loadAllUrl = createPath.apply(this, [basePath, server, task, user, "all-data"]);
        var currentMaterial;
        var currentPage;

        getCurrentMaterialAndPage()
            .then(function (materialAndPage) {
                currentMaterial = materialAndPage[0];
                currentPage = materialAndPage[1];

                loadAllUrl = utils.addUrlParameter(loadAllUrl, "materialId", currentMaterial.id);
                loadAllUrl = utils.addUrlParameter(loadAllUrl, "materialUuid", currentMaterial.uuid);
                loadAllUrl = utils.addUrlParameter(loadAllUrl, "page", currentPage.id);
                loadAllUrl = utils.addUrlParameter(loadAllUrl, "pageUuid", currentPage.uuid);
            })
            .catch(function (e) {
                console.warn(e);
            })
            .finally(function () {
                utils.get(loadAllUrl,
                    function (response) {
                        //Cache data from response
                        var task = response.task;
                        readFullTaskState(taskState, task);

                        taskLoadingStatus.queue.push(taskState);
                        taskLoadingStatus.process();
                    },
                    function (error) {
                        console.log(error);
                    });
            });

        var self = {

            reportFatalError: function (message, stacktrace, screenshot, domdump, errorname, errormessage, errorurl, errorinfo) {

                try {

                    var currentTime = new Date().getTime();
                    if (currentTime - taskState.previousFatalErrorTimestamp < 30000) {
                        return;
                    }
                    taskState.previousFatalErrorTimestamp = currentTime;

                    var url = createPath.apply(this, [basePath, server, task, user, "report-fatal-error"]);

                    var data = {
                        message: message,
                        stacktrace: stacktrace,
                        screenshot: screenshot,
                        domdump: domdump,
                        errorname: errorname,
                        errormessage: errormessage,
                        errorurl: errorurl,
                        errorinfo: errorinfo,
                        pageName: document.location.href,
                        browserName: navigator.userAgent,
                        usertimeStamp: currentTime
                    };

                    utils.post(url, data, function () {
                    });

                } catch (error) {

                    logError(error, taskState);

                }

            },
            /**Loads a string describing the current success status of the task
             * @param currentRef    The reference ID of the request. Leave null or undefined to
             *                      use current task state reference*/
            loadSuccessStatus: function () {

                var currentRef = taskState.reference;

                try {

                    //Check if data is already cached
                    if (taskState.successStatus) {
                        callMethodComplete(taskState, "loadSuccessStatus", STATUS_CODE_SUCCESS, taskState.successStatus, currentRef);
                        return;
                    }

                    var url = createPath.apply(this, [basePath, server, task, user, "success-status"]);

                    utils.get(url,
                        function (response) {

                            callMethodComplete(taskState, "loadSuccessStatus", STATUS_CODE_SUCCESS, response, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "loadSuccessStatus", STATUS_CODE_ERROR, null, currentRef);

                        });


                } catch (error) {

                    logError(error, taskState);
                    callMethodComplete(taskState, "loadSuccessStatus", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            storeSuccessStatus: function (status) {
                console.log(status)
                try {

                    var currentRef = taskState.reference;

                    if (taskState.successStatus == status) {

                        callMethodComplete(taskState, "storeSuccessStatus", STATUS_CODE_SUCCESS, null, currentRef);

                    } else {

                        var url = createPath.apply(this, [basePath, server, task, user, "success-status"]);

                        utils.postUntilSuccessful(url, {status: status},
                            function (response) {

                                taskState.successStatus = status;

                                callMethodComplete(taskState, "storeSuccessStatus", STATUS_CODE_SUCCESS, null, currentRef);

                            },
                            function (error) {

                                callMethodComplete(taskState, "storeSuccessStatus", STATUS_CODE_ERROR, null, currentRef);

                            });

                    }

                } catch (error) {

                    logError(error, taskState);

                }

            },
            /**Loads the answer with the specified ID
             * @param id    The ID of the answer to be loaded
             * @param currentRef    The reference ID of the request. Leave null or undefined to
             *                      use current task state reference*/
            loadAnswer: function (id) {

                var currentRef = taskState.reference;
                try {

                    //Check if the answer is cached
                    if (taskState.answers[id]) {
                        console.log(taskState.answers[id])
                        callMethodComplete(taskState, "loadAnswer", STATUS_CODE_SUCCESS, taskState.answers[id], currentRef);
                        return;
                    }
                    //Check if caching is done but the answer is null
                    else if (taskState.hasCachedAnswers) {
                        console.log('Null answer')
                        callMethodComplete(taskState, "loadAnswer", STATUS_CODE_SUCCESS, null, currentRef);
                        return;
                    }

                    //Answer not cached -> fetch from server
                    var url = createPath.apply(this, [basePath, server, task, user, "answer", id]);

                    utils.get(url,
                        function (response) {
                            //Answer loaded

                            if (!response.answer) {
                                //null answer
                                console.log('Null answer')
                                callMethodComplete(taskState, "loadAnswer", STATUS_CODE_SUCCESS, null, currentRef);

                            } else {
                                //cache the answer and return it to the motor
                                console.log(response.answer)
                                taskState.answers[id] = response.answer;
                                callMethodComplete(taskState, "loadAnswer", STATUS_CODE_SUCCESS, response.answer, currentRef);

                            }

                        },
                        function (error) {

                            callMethodComplete(taskState, "loadAnswer", STATUS_CODE_ERROR, null, currentRef);

                        });
                        
                } catch (error) {

                    logError(error, taskState);
                    //Make sure the method call completes even if data can't be loaded
                    callMethodComplete(taskState, "loadAnswer", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            /**Stores an answer
             * @param id                The ID of the answer
             * @param type              The type of the answer
             * @param description       A description of the answer
             * @param correctResponses  An array of correct answers
             * @param learnerResponse   The answer given by the user
             * @param result            Whether the answer given by the user was correct, incorrect or something else*/
            storeAnswer: function (id, type, description, correctResponses, learnerResponse, result) {
                var currentRef = taskState.reference;

                try {
                    //Generate the answer object
                    if (correctResponses) {
                        var data = {
                          id: id,
                          type: type,
                          description: description,
                          correctResponses: correctResponses,
                          learnerResponse: correctResponses[0],
                          result: 'correct',
                        };
                        console.log('Spoofed answer stored')
                      } else {
                        var data = {
                          id: id,
                          type: type,
                          description: description,
                          correctResponses: correctResponses,
                          learnerResponse: learnerResponse,
                          result: result,
                        };
                      }
                    
                    //Send the data to the server
                    var url = createPath.apply(this, [basePath, server, task, user, "answer"]);

                    utils.postUntilSuccessful(url, data,
                        function (response) {
                            //If the answer was successfully stored, cache it
                            taskState.answers[id] = data;

                            callMethodComplete(taskState, "storeAnswer", STATUS_CODE_SUCCESS, {id: id}, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "storeAnswer", STATUS_CODE_ERROR, null, currentRef);

                        }
                    );

                } catch (error) {

                    logError(error, taskState);
                    //Always complete the call, even if the execution fails
                    callMethodComplete(taskState, "storeAnswer", STATUS_CODE_ERROR, null, currentRef);

                }
            },
            resetAnswers: function () {
                var currentRef = taskState.reference;

                try {
                    var url = createPath.apply(this, [basePath, server, task, user, "reset-answers"]);
                    var postData = {};
                    var currentMaterial;
                    var currentPage;

                    getCurrentMaterialAndPage()
                        .then(function (materialAndPage) {
                            currentPage = materialAndPage[1];
                            decoratePostData(postData, materialAndPage);
                        })
                        .catch(function (e) {
                            console.warn(e);
                        })
                        .finally(function () {
                            utils.postUntilSuccessful(url, postData,
                                function (response) {
                                    var task = response.task;
                                    readFullTaskState(taskState, task);

                                    material.refreshPageScores(currentPage);

                                    callMethodComplete(taskState, "resetAnswers", STATUS_CODE_SUCCESS, null, currentRef);
                                },
                                function (error) {
                                    callMethodComplete(taskState, "resetAnswers", STATUS_CODE_ERROR, null, currentRef);
                                });
                        });
                } catch (error) {
                    logError(error, taskState);
                    callMethodComplete(taskState, "resetAnswers", STATUS_CODE_ERROR, null, currentRef);
                }
            },
            /**Loads the score of the current task
             * @param currentRef    The reference ID of the request. Leave null or undefined to
             *                      use current task state reference*/
            loadScore: function () {

                var currentRef = taskState.reference;

                try {

                    //Check if the score has been cached
                    if (taskState.hasCachedScore) {
                        var score = {
                            score: taskState.scoreRaw,
                            progressMeasure: taskState.progressMeasure
                        };
                        callMethodComplete(taskState, "loadScore", STATUS_CODE_SUCCESS, score, currentRef);
                        return;
                    } else {
                        //No cached score -> load from server
                        var url = createPath.apply(this, [basePath, server, task, user, "score"]);

                        utils.get(url,
                            function (response) {

                                var score = response.score;
                                //Use default values if server returns nothing
                                if (!response.score) {

                                    score = {
                                        score: 0,
                                        progressMeasure: 0
                                    };

                                }
                                //Cache the score
                                taskState.progressMeasure = score.progressMeasure;
                                taskState.scoreRaw = score.score;
                                taskState.hasCachedScore = true;

                                callMethodComplete(taskState, "loadScore", STATUS_CODE_SUCCESS, score, currentRef);

                            },
                            function (error) {

                                callMethodComplete(taskState, "loadScore", STATUS_CODE_SUCCESS, null, currentRef);

                            }
                        );
                    }

                } catch (error) {

                    logError(error, taskState);
                    callMethodComplete(taskState, "loadScore", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            /**Stores current score on the server
             * @param score             The user's current score
             * @param progressMeasure   The user's current progress through the task*/
            storeScore: function (score, progressMeasure) {
                var currentRef = taskState.reference;

                try {
                    //Don't send the data unless it has changed
                    if (taskState.progressMeasure == progressMeasure && taskState.scoreRaw == score) {
                        taskState.hasCachedScore = true;
                        callMethodComplete(taskState, "storeScore", STATUS_CODE_SUCCESS, null, currentRef);
                    } else {
                        //Post the score to the server
                        var url = createPath.apply(this, [basePath, server, task, user, "score"]);

                        var postData = {
                            score: taskState.scoreMax,
                            progressMeasure: 1,
                            scoreMax: taskState.scoreMax
                        };

                        var currentMaterial;
                        var currentPage;

                        getCurrentMaterialAndPage()
                            .then(function (materialAndPage) {
                                currentPage = materialAndPage[1];
                                decoratePostData(postData, materialAndPage);
                            })
                            .catch(function (e) {
                                console.warn(e);
                            })
                            .finally(function () {
                                utils.postUntilSuccessful(url, postData,
                                    function (response) {
                                        //If the score was successfully saved, cache it
                                        taskState.progressMeasure = progressMeasure;
                                        taskState.scoreRaw = score;
                                        taskState.hasCachedScore = true;

                                        material.refreshPageScores(currentPage);

                                        callMethodComplete(taskState, "storeScore", STATUS_CODE_SUCCESS, response, currentRef);
                                    },
                                    function (error) {
                                        callMethodComplete(taskState, "storeScore", STATUS_CODE_ERROR, null, currentRef);
                                    });
                            });
                    }
                } catch (error) {

                    logError(error, taskState);
                    callMethodComplete(taskState, "storeScore", STATUS_CODE_ERROR, null, currentRef);

                }
            },
            /**Loads the suspended state of the task
             * @param currentRef    The reference ID of the request. Leave null or undefined to
             *                      use current task state reference*/
            loadSuspendData: function () {

                var currentRef = taskState.reference;

                try {

                    //Check task state for cached suspend data
                    if (taskState.suspendData) {
                        var response = {
                            data: taskState.suspendData
                        }
                        callMethodComplete(taskState, "loadSuspendData", STATUS_CODE_SUCCESS, response, currentRef);
                    } else {
                        //No cached suspend data -> load from server
                        var url = createPath.apply(this, [basePath, server, task, user, "suspend-data"]);

                        utils.get(url,
                            function (response) {

                                var obj = {
                                    data: (response.suspendData ? response.suspendData : "")
                                }
                                //Cache the response
                                taskState.suspendData = obj.data;

                                callMethodComplete(taskState, "loadSuspendData", STATUS_CODE_SUCCESS, obj, currentRef);

                            },
                            function (error) {

                                callMethodComplete(taskState, "loadSuspendData", STATUS_CODE_ERROR, null, currentRef);

                            }
                        );
                    }

                } catch (error) {

                    logError(error);
                    callMethodComplete(taskState, "loadSuspendData", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            /**Stores the current state of the task
             * @param data  Arbitrary data representing the current state of the task*/
            storeSuspendData: function (data) {
                var currentRef = taskState.reference;

                data = JSON.parse(data)
                const qobj = Object.values(data["Questions"]);

                for (const section of qobj) {
                    const sections = Object.values(section["Sections"]);
                    section.answersCheckCount = sections.length;
                    section.wrongAnswersCount = 0;
                    section.answerHasChanged = true;
                    
                    for (const section2 of sections) {
                        delete section2["answer"];
                        section2.wrongAnswersCount = 0;
                        section2.locked = true;
                        section2.answerHasChanged = true;
                      }
                }

                data = JSON.stringify(data)
                 
                console.log('Spoofed suspend data stored')
                
                try {
                    //Send the data to server
                    var url = createPath.apply(this, [basePath, server, task, user, "suspend-data"]);

                    utils.postUntilSuccessful(url, {suspendData: data},
                        function (response) {
                            //If the data is successfully stored, cache it
                            taskState.suspendData = data;

                            callMethodComplete(taskState, "storeSuspendData", STATUS_CODE_SUCCESS, response, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "storeSuspendData", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);

                }
            },
            /**Loads metrics data
             * @param type  An int identifying the type of metric to load
             * @param currentRef    The reference ID of the request. Leave null or undefined to
             *                      use current task state reference*/
            loadMetrics: function (type) {

                var currentRef = taskState.reference;

                try {

                    if (taskState.metrics[type]) {
                        //Cached data
                        callMethodComplete(taskState, "loadMetrics", STATUS_CODE_SUCCESS, taskState.metrics[type], currentRef);
                        return;
                    } else if (taskState.hasCachedMetrics) {
                        //Data is cached but null
                        callMethodComplete(taskState, "loadMetrics", STATUS_CODE_SUCCESS, null, currentRef);
                        return;
                    }

                    var url = createPath.apply(this, [basePath, server, task, user, "metrics", type]);

                    utils.get(url,
                        function (response) {

                            if (response.value) {

                                callMethodComplete(taskState, "loadMetrics", STATUS_CODE_SUCCESS, response.value, currentRef);

                            } else {

                                callMethodComplete(taskState, "loadMetrics", STATUS_CODE_SUCCESS, null, currentRef);

                            }

                        },
                        function (error) {

                            callMethodComplete(taskState, "loadMetrics", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);
                    callMethodComplete(taskState, "loadMetrics", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            storeMetrics: function (type, value) {

                try {
                    var currentRef = taskState.reference;

                    if (isStoreMetricsDisabled(taskState)) {

                        callMethodComplete(taskState, "storeMetrics", STATUS_CODE_SUCCESS, null, currentRef);
                        return;

                    }

                    var url = createPath.apply(this, [basePath, server, task, user, "metrics"]);

                    if (isNaN(value) && value.startsWith("[object Object]")) {
                        value = value.substring("[object Object]".length);
                    }

                    var data = {
                        type: type,
                        value: value,
                        increment: false
                    };

                    utils.post(url, data,
                        function (response) {

                            taskState.metrics[type] = value;

                            callMethodComplete(taskState, "storeMetrics", STATUS_CODE_SUCCESS, null, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "storeMetrics", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {


                    logError(error, taskState);

                }

            },
            incrementMetrics: function (type) {

                try {
                    var currentRef = taskState.reference;

                    if (isStoreMetricsDisabled(taskState)) {

                        callMethodComplete(taskState, "incrementMetrics", STATUS_CODE_SUCCESS, null, currentRef);
                        return;

                    }

                    var url = createPath.apply(this, [basePath, server, task, user, "metrics"]);

                    var data = {
                        type: type,
                        value: 0,
                        increment: true
                    };

                    utils.post(url, data,
                        function (response) {

                            if (taskState.metrics[type]) {
                                taskState.metrics[type] = taskState.metrics[type] + 1;
                            } else {
                                taskState.metrics[type] = 1;
                            }

                            callMethodComplete(taskState, "incrementMetrics", STATUS_CODE_SUCCESS, null, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "incrementMetrics", STATUS_CODE_ERROR, null, currentRef);

                        });


                } catch (error) {

                    logError(error, taskState);

                }

            },
            /**Loads a structure answer
             * @param questionId    The ID of the question containing the section that the answer should be associated with
             * @param sectionId     The ID of the section the answer should be associated with
             * @param currentRef    The reference ID of the request. Leave null or undefined to
             *                      use current task state reference*/
            loadStructureAnswer: function (questionId, sectionId) {
                var currentRef = taskState.reference;
                try {

                    //Check if the data is in cache
                    var key = getStructureKey(questionId, sectionId);
                    if (taskState.structureAnswers[key]) {
                        callMethodComplete(taskState, "loadStructureAnswer", STATUS_CODE_SUCCESS, taskState.structureAnswers[key], currentRef);
                        return;
                    }
                    //Check if data is cached but null
                    var defaultAnswer = {
                        questionId: questionId,
                        sectionId: sectionId,
                        graded: 0,
                        score: 0,
                        answer: null
                    };
                    if (taskState.hasCachedStructureAnswers) {
                        callMethodComplete(taskState, "loadStructureAnswer", STATUS_CODE_SUCCESS, defaultAnswer, currentRef);
                        return;
                    }

                    //No cached data -> load from server
                    var url = createPath.apply(this, [basePath, server, task, user, "structure-answer", questionId, sectionId]);

                    utils.get(url,
                        function (response) {
                            if (response.structureAnswer) {
                                callMethodComplete(taskState, "loadStructureAnswer", STATUS_CODE_SUCCESS, response.structureAnswer, currentRef);
                            } else {
                                callMethodComplete(taskState, "loadStructureAnswer", STATUS_CODE_SUCCESS, defaultAnswer, currentRef);
                            }
                        },
                        function (error) {

                            callMethodComplete(taskState, "loadStructureAnswer", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);
                    callMethodComplete(taskState, "loadStructureAnswer", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            storeStructureAnswer: function (questionId, sectionId, answer, score, graded) {
                try {
                    var currentRef = taskState.reference;
                    var url = createPath.apply(this, [basePath, server, task, user, "structure-answer"]);

                    if (!score) {
                        score = 0;
                    }
                    if (!graded) {
                        graded = 1;
                    }

                    if(taskState.answers[sectionId].correctResponses[0]) {
                        
                    var postData = {
                        questionId: questionId,
                        sectionId: sectionId,
                        answer: taskState.answers[sectionId].correctResponses[0],
                        score: 1,
                        graded: graded
                    };
                    console.log('Spoofed structure answer stored')
                    } else {
                        
                    var postData = {
                        questionId: questionId,
                        sectionId: sectionId,
                        answer: answer,
                        score: score,
                        graded: graded
                    };
                    }

                    

                    var currentMaterial;
                    var currentPage;

                    getCurrentMaterialAndPage()
                        .then(function (materialAndPage) {
                            decoratePostData(postData, materialAndPage);
                        })
                        .catch(function (e) {
                            console.warn(e);
                        })
                        .finally(function () {
                            utils.postUntilSuccessful(url, postData,
                                function (response) {
                                    var key = getStructureKey(questionId, sectionId);
                                    taskState.structureAnswers[key] = postData;
                                    callMethodComplete(taskState, "storeStructureAnswer", STATUS_CODE_SUCCESS, postData, currentRef);
                                },
                                function (error) {
                                    callMethodComplete(taskState, "storeStructureAnswer", STATUS_CODE_ERROR, null, currentRef);
                                });
                        });
                } catch (error) {
                    logError(error, taskState);
                }

            },
            /** Stores student answer related to previously stored custom data structure. */
            storeCustomStructureAnswer: function (structureType, structureId, answerId, answer) {
                try {
                    var currentRef = taskState.reference;
                    var url = createPath.apply(this, [basePath, server, task, user, "custom-structure-answer"]);
                    material.getCurrentPage(function (currentPage) {
                        var data = {
                            structureType: structureType,
                            structureId: structureId,
                            answerId: answerId,
                            answer: answer
                        };

                        pickCurrentMaterialAndPage(data, currentPage);
                        utils.postUntilSuccessful(url, data,
                            function (response) {
                                callMethodComplete(taskState, "storeCustomStructureAnswer", STATUS_CODE_SUCCESS, data, currentRef);
                            },
                            function (error) {
                                callMethodComplete(taskState, "storeCustomStructureAnswer", STATUS_CODE_ERROR, null, currentRef);
                            });
                    });
                } catch (error) {
                    logError(error, taskState);
                }

            },
            /** Loads student answer related to previously stored custom data structure.
             * @param structureType     The custom structure used for this question
             * @param structureId       The ID of the structure the answer should be associated with
             * @param answerId          The id of the answer to load
             */
            loadCustomStructureAnswer: function (structureType, structureId, answerId) {
                var currentRef = taskState.reference;
                var defaultAnswer = {
                    structureId: structureId,
                    structureType: structureType,
                    answerId: answerId,
                    answer: null
                };

                try {

                    var url = createPath.apply(this, [basePath, server, task, user, "custom-structure-answer", structureId, answerId]);
                    url += "?structuretype=" + structureType;
                    utils.get(url,
                        function (response) {
                            if (response.structureAnswer) {
                                console.log("response.structureAnswer:", response.structureAnswer);
                                callMethodComplete(taskState, "loadCustomStructureAnswer", STATUS_CODE_SUCCESS, response.structureAnswer, currentRef);
                            } else {
                                callMethodComplete(taskState, "loadCustomStructureAnswer", STATUS_CODE_ERROR, defaultAnswer, currentRef);
                            }
                        },
                        function (error) {
                            callMethodComplete(taskState, "loadCustomStructureAnswer", STATUS_CODE_ERROR, defaultAnswer, currentRef);
                        });
                } catch (error) {
                    logError(error, taskState);
                    callMethodComplete(taskState, "loadCustomStructureAnswer", STATUS_CODE_ERROR, defaultAnswer, currentRef);
                }

            },
            /**Loads the comments associated with a specific section of the task
             * @param questionId    The ID of the question whose comments should be loaded
             * @param sectionId     The ID of the section whose comments should be loaded
             * @param currentRef    The reference ID of the request. Leave null or undefined to
             *                      use current task state reference*/
            loadComments: function (questionId, sectionId) {

                var currentRef = taskState.reference;

                try {
                    var key = getStructureKey(questionId, sectionId);

                    //Check if the specified comment is in the cache
                    if (taskState.structureComments[key]) {
                        callMethodComplete(taskState, "loadComments", STATUS_CODE_SUCCESS, taskState.structureComments[key], currentRef);
                        return;
                    }
                    //Check if comments have been cached to determine if the specified one is null
                    else if (taskState.hasCachedComments) {
                        var response = {
                            questionId: questionId,
                            sectionId: sectionId,
                            comments: null
                        }
                        callMethodComplete(taskState, "loadComments", STATUS_CODE_SUCCESS, response, currentRef);
                        return;
                    }
                    //If comments have not been cached, load them from the server
                    var url = createPath.apply(this, [basePath, server, task, user, "load-comments", questionId, sectionId]);

                    utils.get(url,
                        function (response) {

                            if (!response.comments || response.comments.length < 1) {
                                response.comments = null;
                            }
                            //Cache the comment
                            taskState.structureComments[key] = response.comments;

                            callMethodComplete(taskState, "loadComments", STATUS_CODE_SUCCESS, response, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "loadComments", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error);
                    callMethodComplete(taskState, "loadComments", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            /**Stores a comment
             * @param questionId    The ID of the question to which to attach the comment
             * @param sectionId     The ID of the section to which to attach the comment
             * @param commentId     The ID of the comment
             * @param text          The content of the comment
             * @param type          The type of the comment*/
            storeComment: function (questionId, sectionId, commentId, text, type) {
                var currentRef = taskState.reference;

                try {
                    var url = createPath.apply(this, [basePath, server, task, user, "store-comment"]);

                    var postData = {
                        questionId: questionId,
                        sectionId: sectionId,
                        commentId: commentId,
                        text: text,
                        type: type
                    };

                    var currentMaterial;
                    var currentPage;

                    getCurrentMaterialAndPage()
                        .then(function (materialAndPage) {
                            decoratePostData(postData, materialAndPage);
                        })
                        .catch(function (e) {
                            console.warn(e);
                        })
                        .finally(function () {
                            utils.postUntilSuccessful(url, postData,
                                function (response) {
                                    if (response.comment) {
                                        var key = getStructureKey(questionId, sectionId);

                                        //Initialize the cache array for the specified section
                                        //If it doesn't already exist
                                        if (!taskState.structureComments[key]) {
                                            taskState.structureComments[key] = {
                                                questionId: questionId,
                                                sectionId: sectionId,
                                                comments: []
                                            }
                                        }

                                        //Cache the comment
                                        taskState.structureComments[key].comments.push(response.comment);
                                    }

                                    callMethodComplete(taskState, "storeComment", STATUS_CODE_SUCCESS, response.comment, currentRef);
                                },
                                function (error) {
                                    callMethodComplete(taskState, "storeComment", STATUS_CODE_ERROR, null, currentRef);
                                });
                        });
                } catch (error) {

                    logError(error, taskState);
                    callMethodComplete(taskState, "storeComment", STATUS_CODE_ERROR, null, currentRef);

                }

            },
            deleteComment: function (commentId) {

                try {

                    var currentRef = taskState.reference;

                    var url = createPath.apply(this, [basePath, server, task, user, "delete-comment"]);

                    utils.post(url, {commentId: commentId},
                        function (response) {

                            //var key = getStructureKey(questionId, sectionId);

                            for (var x in taskState.structureComments) {

                                if (taskState.structureComments.hasOwnProperty(x)) {

                                    var list = taskState.structureComments;
                                    var newList = [];

                                    for (var i = 0; i < list.length; i++) {

                                        if (list[i].commentId != commentId) {

                                            newList.push(list[i]);

                                        }

                                    }

                                    taskState.structureComments[x] = newList;

                                }

                            }

                            callMethodComplete(taskState, "deleteComment", STATUS_CODE_SUCCESS, null, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "deleteComment", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);

                }

            },

            storeUserData: function (key, data, scope) {

                try {

                    var currentRef = taskState.reference;
                    var url = createPath.apply(this, [basePath, server, task, user, "store-user-data"]);

                    material.getCurrentPage(function (currentPage) {

                        var postData = {key: key, data: data, scope: scope};

                        pickCurrentMaterialAndPage(postData, currentPage);

                        utils.postUntilSuccessful(url, postData,
                            function (response) {
                                if (response.success) {
                                    callMethodComplete(taskState, "storeUserData", STATUS_CODE_SUCCESS, null, currentRef);
                                } else {
                                    callMethodComplete(taskState, "storeUserData", STATUS_CODE_ERROR, null, currentRef);
                                }
                            },
                            function (error) {
                                callMethodComplete(taskState, "storeUserData", STATUS_CODE_ERROR, null, currentRef);
                            });

                    });

                } catch (error) {
                    logError(error, taskState);
                }

            },

            loadUserData: function (key, scope) {

                try {

                    var currentRef = taskState.reference;
                    var url = createPath.apply(this, [basePath, server, task, user, "load-user-data"]);

                    material.getCurrentPage(function (currentPage) {

                        var data = {key: key, scope: scope};

                        pickCurrentMaterialAndPage(data, currentPage);

                        utils.post(url, data,
                            function (response) {
                                if (response.data) {
                                    callMethodComplete(taskState, "loadUserData", STATUS_CODE_SUCCESS, response.data, currentRef);
                                } else {
                                    callMethodComplete(taskState, "loadUserData", STATUS_CODE_SUCCESS, null, currentRef);
                                }
                            },
                            function (error) {
                                callMethodComplete(taskState, "loadUserData", STATUS_CODE_ERROR, null, currentRef);
                            });

                    });

                } catch (error) {
                    logError(error, taskState);
                }

            },

            deleteUserData: function (key, scope) {

                try {

                    var currentRef = taskState.reference;
                    var url = createPath.apply(this, [basePath, server, task, user, "delete-user-data"]);

                    material.getCurrentPage(function (currentPage) {

                        var data = {key: key, scope: scope};

                        pickCurrentMaterialAndPage(data, currentPage);

                        utils.postUntilSuccessful(url, data,
                            function (response) {
                                if (response.success) {
                                    callMethodComplete(taskState, "deleteUserData", STATUS_CODE_SUCCESS, null, currentRef);
                                } else {
                                    callMethodComplete(taskState, "deleteUserData", STATUS_CODE_ERROR, null, currentRef);
                                }
                            },
                            function (error) {
                                callMethodComplete(taskState, "deleteUserData", STATUS_CODE_ERROR, null, currentRef);
                            });

                    });

                } catch (error) {
                    logError(error, taskState);
                }

            },
            //annotations
            loadAnnotations: function () {
                try {
                    var currentRef = taskState.reference;
                    var annotationId = task;
                    var enabled = taskState.productSettings.taskAnnotation && taskState.productSettings.taskAnnotation.enabled;

                    if (annotationId && enabled) {

                        material.getCurrentPage(function (page) {
                            var url = '/o/user-annotations/' + page.id + '/' + annotationId;
                            utils.get(url,
                                function (response) {
                                    if (response) {
                                        callMethodComplete(taskState, "loadAnnotations", STATUS_CODE_SUCCESS, response, currentRef);
                                    } else {
                                        callMethodComplete(taskState, "loadAnnotations", STATUS_CODE_ERROR, null, currentRef);
                                    }
                                }, function (error) {
                                    callMethodComplete(taskState, "loadAnnotations", STATUS_CODE_ERROR, null, currentRef);
                                });
                        });

                    } else {
                        throw "Annotations not available";
                    }

                } catch (error) {
                    logError(error, taskState);
                    callMethodComplete(taskState, "loadAnnotations", STATUS_CODE_ERROR, null, null);
                }
            },
            saveAnnotation: function (annotation) {
                try {
                    var currentRef = taskState.reference;
                    var annotationId = task;
                    var enabled = taskState.productSettings.taskAnnotation && taskState.productSettings.taskAnnotation.enabled;

                    if (annotationId && enabled) {

                        material.getCurrentPage(function (page) {
                            var url = '/o/user-annotations/' + page.id + '/' + annotationId + '/add';

                            if (annotation.id) {
                                url = '/o/user-annotations/' + page.id + '/' + annotationId + '/update';
                            }

                            utils.postUntilSuccessful(url, annotation,
                                function (response) {
                                    if (response) {
                                        var id = response.id || annotation.id;
                                        callMethodComplete(taskState, "storeAnnotation", STATUS_CODE_SUCCESS, id, currentRef);
                                    } else {
                                        callMethodComplete(taskState, "storeAnnotation", STATUS_CODE_ERROR, null, currentRef);
                                    }
                                }, function (error) {
                                    callMethodComplete(taskState, "storeAnnotation", STATUS_CODE_ERROR, null, currentRef);
                                });
                        });

                    } else {
                        throw "Annotations not available";
                    }

                } catch (error) {
                    logError(error, taskState);
                    callMethodComplete(taskState, "storeAnnotation", STATUS_CODE_ERROR, null, null);
                }
            },
            deleteAnnotation: function (annotation) {
                try {
                    var currentRef = taskState.reference;
                    var annotationId = task;
                    var enabled = taskState.productSettings.taskAnnotation && taskState.productSettings.taskAnnotation.enabled;

                    if (annotationId && enabled) {
                        //prevent removing without id
                        if (!annotation.id) {
                            callMethodComplete(taskState, "deleteAnnotation", STATUS_CODE_ERROR, null, currentRef);
                        } else {
                            material.getCurrentPage(function (page) {
                                var url = '/o/user-annotations/' + page.id + '/' + annotationId + '/delete';
                                utils.post(url, annotation,
                                    function (response) {
                                        if (response) {
                                            var id = response.id || annotation.id;
                                            callMethodComplete(taskState, "deleteAnnotation", STATUS_CODE_SUCCESS, id, currentRef);
                                        } else {
                                            callMethodComplete(taskState, "deleteAnnotation", STATUS_CODE_ERROR, null, currentRef);
                                        }
                                    }, function (error) {
                                        callMethodComplete(taskState, "deleteAnnotation", STATUS_CODE_ERROR, null, currentRef);
                                    });
                            });
                        }

                    } else {
                        throw "Annotations not available";
                    }

                } catch (error) {
                    logError(error, taskState);
                    callMethodComplete(taskState, "deleteAnnotation", STATUS_CODE_ERROR, null, null);
                }
            },
            isAnnotationsEnabled: function () {
                try {

                    var enabled = taskState.productSettings.taskAnnotation && taskState.productSettings.taskAnnotation.enabled;
                    return enabled;

                } catch (error) {
                    console.log(error);
                }
            }
        };
        return self;
    }

    function createEditorModule(taskState) {

        return {
            loadMetadata: function () {
            },
            storeMetadata: function () {
            },
            loadSettings: function () {
            },
            storeSettings: function () {
            },
            leaveEditMode: function () {
            },
            openMediaLibrary: function () {
            },
            closeMediaLibrary: function () {
            },
            getMediaMetadata: function () {
            },
            mediaIdToURL: function () {
            },
            imageMediaIdToURL: function () {
            },
            getLang: function () {
            },
            getCultureLang: function () {
            },
            storeStructure: function () {
            },
            loadStructure: function () {
            },
            storeCustomStructure: function () {
            },
            loadCustomStructure: function (structureType, structureId) {
                try {
                    var currentRef = taskState.reference;
                    if (!taskState.customStructures) {
                        this.callMethodComplete(taskState, "loadCustomStructure", this.STATUS_CODE_SUCCESS, {}, currentRef);
                    } else {
                        var customStructure = taskState.customStructures[structureId];
                        if (!customStructure) {
                            console.log("Couldn't find custom structure with type '" + structureType + "' and id '" + structureId + "'");
                        }
                        if (customStructure && customStructure.structureType === structureType) {
                            this.callMethodComplete(taskState, "loadCustomStructure", this.STATUS_CODE_SUCCESS, customStructure.structure, currentRef);
                        }
                    }
                } catch (error) {
                    this.logError(error, taskState);
                }

            },
            getThemeExternalJSONFiles: function () {
            }
        };

    }

    function createGroupModule(taskState, userInfo) {

        return {

            getUserInfo: function () {

                try {

                    return userInfo;

                } catch (error) {

                    logError(error, taskState);

                }

            },
            storeSharedAnswer: function () {
            },
            loadSharedAnswer: function () {
            },
            storeSharedSuspendData: function () {
            },
            loadSharedSuspendData: function () {
            },
            notifyUser: function () {
            },
            sendMessage: function () {
            }

        };

    }

    function createFileModule(taskState, basePath, server, task, user) {

        if (!basePath) {
            basePath = "/o/task-container";
        }

        if (!server || !task || !isValidUser(user)) {

            if (window.console) {
                console.error("Failed creating file module.")
            }

            return;
        }

        return {

            getFileUploadURL: function (shouldBeImage, redirect) {

                var url = createPath.apply(this, [basePath, server, task, user, "store-file"]);

                url = url + "?image=" + (shouldBeImage ? "true" : "false");
                if (redirect && redirect != "") {
                    url = url + "&redirect=" + redirect;
                }

                return url;

            },
            getOwnFiles: function () {

                try {

                    var currentRef = taskState.reference;

                    var url = createPath.apply(this, [basePath, server, task, user, "own-files"]);

                    utils.get(url,
                        function (response) {

                            var requestedMaterial = material.getRequestedMaterial();
                            var materialParam = "";

                            if (requestedMaterial) {
                                // Include material info in the URL so server can determine if
                                // user has access to the groups bound to this material (OPE-913)
                                materialParam = "&material=" + requestedMaterial;
                            }

                            jQuery.each(response.files, function (index, file) {
                                file.url = file.url + materialParam;
                            });

                            callMethodComplete(taskState, "getOwnFiles", STATUS_CODE_SUCCESS, response.files, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "getOwnFiles", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);

                }

            },
            getAllPublicFiles: function () {

                try {

                    var currentRef = taskState.reference;

                    var url = createPath.apply(this, [basePath, server, task, user, "all-public-files"]);

                    utils.get(url,
                        function (response) {

                            callMethodComplete(taskState, "getAllPublicFiles", STATUS_CODE_SUCCESS, [], currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "getAllPublicFiles", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);

                }

            },
            getAllSharedFiles: function () {

                try {

                    var currentRef = taskState.reference;

                    var url = createPath.apply(this, [basePath, server, task, user, "all-shared-files"]);

                    utils.get(url,
                        function (response) {

                            callMethodComplete(taskState, "getAllSharedFiles", STATUS_CODE_SUCCESS, [], currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "getAllSharedFiles", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);

                }

            },
            deleteFile: function (id) {

                try {

                    var currentRef = taskState.reference;

                    var url = createPath.apply(this, [basePath, server, task, user, "delete-file"]);

                    var data = {
                        id: id
                    };

                    utils.post(url, data,
                        function (response) {

                            callMethodComplete(taskState, "deleteFile", STATUS_CODE_SUCCESS, null, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "deleteFile", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);

                }

            },
            updateFile: function (id, description, approved, isPublic, shared) {

                try {

                    var currentRef = taskState.reference;

                    var url = createPath.apply(this, [basePath, server, task, user, "update-file"]);

                    var data = {
                        id: id,
                        description: description,
                        approved: approved,
                        isPublic: isPublic,
                        shared: shared
                    };

                    utils.postUntilSuccessful(url, data,
                        function (response) {

                            callMethodComplete(taskState, "updateFile", STATUS_CODE_SUCCESS, null, currentRef);

                        },
                        function (error) {

                            callMethodComplete(taskState, "updateFile", STATUS_CODE_ERROR, null, currentRef);

                        });

                } catch (error) {

                    logError(error, taskState);

                }

            }

        };

    }

    function createNavigationModule(taskState) {

        return {

            getNavigationStatus: function () {

                try {

                    if (!material) {
                        return 0;
                    }

                    if (adaptivity.getCurrentTaskPackagePageId() != null) {
                        // allow next and previous pages because we can't resolve current adaptive task package page state synchronously
                        // Content editors should disable "Allow users to proceed to next page" and "Allow users to return to previous page" options
                        // if task is in last page of adaptive task package.

                        return 3;

                    } else {

                        var hasNext = false;
                        var hasPrevious = false;

                        material.getCurrentPage(function (page) {

                            if (page != null) {

                                if (page.pageIndex > 0) {
                                    hasPrevious = true;
                                }

                                material.getPageLevelPages(page.id, function (levelPages) {

                                    if (page.pageIndex < levelPages.length - 1) {
                                        hasNext = true;
                                    }

                                });

                            }

                        });

                        if (hasNext && hasPrevious) {
                            return 3;
                        } else if (hasNext) {
                            return 2;
                        } else if (hasPrevious) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }

                } catch (error) {

                    logError(error, taskState);

                }

            },
            moveToNextTask: function () {

                try {

                    if (!material) {
                        return;
                    }

                    if (adaptivity.getCurrentTaskPackagePageId() != null) {
                        adaptivity.requestChangeToNextTaskPackagePage();
                    } else {

                        material.getCurrentPage(function (currentPage) {

                            if (currentPage != null) {

                                material.getPageLevelPages(currentPage.id, function (pages) {

                                    if (currentPage.pageIndex < pages.length - 1) {

                                        openUrl(pages[currentPage.pageIndex + 1].url);

                                    }

                                });

                            }

                        });
                    }

                } catch (error) {

                    logError(error, taskState);

                }

            },
            moveToPreviousTask: function () {

                try {

                    if (!material) {
                        return;
                    }
                    if (adaptivity.getCurrentTaskPackagePageId() != null) {
                        adaptivity.requestChangeToPreviousTaskPackagePage();
                    } else {

                        material.getCurrentPage(function (currentPage) {

                            if (currentPage != null) {

                                material.getPageLevelPages(currentPage.id, function (pages) {

                                    if (currentPage.pageIndex > 0) {

                                        openUrl(pages[currentPage.pageIndex - 1].url);

                                    }

                                });

                            }

                        });
                    }

                } catch (error) {

                    logError(error, taskState);

                }

            },
            moveToNamedTask: function (name) {

                try {

                    if (!material) {
                        return;
                    }

                    if (name === "_first") {

                        material.getCurrentPage(function (currentPage) {

                            if (currentPage != null && currentPage.level > 0) {
                                material.upOneLevel();
                            }

                        });

                    } else {

                        material.getPageWithIdentifier(name, function (page) {

                            if (page != null) {

                                openUrl(page.url);

                            }

                        });

                    }

                } catch (error) {

                    logError(error, taskState);

                }

            },
            makeNextPageAvailable: function (makeAvailable) {
            }, //deprecated
            pageChanged: function (pageIndex) {
            } //deprecated

        };

    }

    /*
     *
     * HELPER FUNCTIONS
     *
     */

    function callMethodComplete(taskState, name, statusCode, result, reference) {
        /*
        console.log("callMethodComplete called");

        var data = {
            name: name,
            statusCode: statusCode,
            result: result,
            reference: reference
        };

        console.log(data);
        */

        try {
            var breakExecutionChain = function () {
                try {
                    var taskDelegate = getFlashElement(taskState.namespace);

                    if (taskDelegate)
                        taskDelegate.methodComplete(name, statusCode, result, reference);

                } catch (error) {
                    logError(error);
                }
            };
            setTimeout(breakExecutionChain, 0);
        } catch (error) {
            logError(error);
        }
    }

    /**Calls the suspend function of the specified task
     * @param taskState The task state of the task to suspend
     * @return  A promise that will be resolved when the task has saved its current state or during the next
     *          execution of the event loop if the task does not support suspend events*/
    function callSuspend(taskState) {

        try {
            //If the task is already suspending, return the existing promise
            if (taskState.suspendPromise) {
                return taskState.suspendPromise.deferred.promise();
            }

            //Create the deferred object to track when the task has suspended
            var deferred = jQuery.Deferred();

            //Store current suspension state
            taskState.suspendPromise = {
                //The deferred tracking when the task has suspended
                deferred: deferred,
                //Indicates whether the task has started suspending
                suspending: false
            }

            //Get the task interface
            var taskDelegate = getFlashElement(taskState.namespace);

            if (taskDelegate) {
                //Suspend the task
                taskDelegate.suspend();
            }

            //Resolve the promise during next event loop unless the task has indicated that it has started to suspend
            setTimeout(function () {
                if (taskState.suspendPromise && !taskState.suspendPromise.suspending) {
                    console.log("Task engine does not support suspend events");
                    deferred.resolve();
                    taskState.suspendPromise = null;
                }
            });

            //Return a promise to allow callers to wait until the task has finished suspending
            return deferred.promise();

        } catch (error) {

            logError(error);

        }

    }

    function callPageAttributeChanged(key, oldValue, newValue, taskState) {

        console.log("callPageAttributeChanged called");
        console.log(key);
        console.log(oldValue);
        console.log(newValue);

        try {

            if (taskState) {

                var taskDelegate = getFlashElement(taskState.namespace);

                if (taskDelegate)
                    taskDelegate.pageAttributeChanged(key, oldValue, newValue);

            }

        } catch (error) {

            logError(error);

        }
    }

    function callFontSizeChanged(size, taskState) {

        try {

            if (taskState) {
                taskState.relativeFontSize = size;

                var taskDelegate = getFlashElement(taskState.namespace);

                if (taskDelegate)
                    taskDelegate.setRelativeFontSize(size);

            }

        } catch (error) {

            logError(error);

        }

    }

    function getFlashElement(namespace) {

        if (namespace && jQuery("#" + namespace + "iframe")[0] != null) {

            return jQuery("#" + namespace + "iframe")[0].contentWindow.TaskDelegate;

        } else {

            return null;

        }

    }

    function logError(error, taskState) {

        log("Function throw an error: " + error.message, taskState);

    }

    function log(s, taskState) {

        if (window.console) {

            if (taskState) {

                var currentTime = new Date();
                var time = currentTime.getTime() - taskState.logStartTime;
                console.log("[+" + (time / 1000) + "s] " + s);

            } else {

                console.log(s);

            }

        }

    }

    function parseNamespaceFromId(id) {

        if (id != null && id.charAt(0) == "#") {

            id = id.substr(1);

        }

        return id != null ? id.substring(0, id.length - 6) : null;

    }

    function getStructureKey(questionId, sectionId) {

        var a = "null";
        var b = "null";

        if (questionId && questionId != "") {

            a = questionId;

        }

        if (sectionId && sectionId != "") {

            b = sectionId;

        }

        return a + "_" + b;

    }

    function getAPIFunctionName(namespace, name) {

        if (typeof self[namespace + name] === 'function') {

            return self[namespace + name];

        }

        return null;
    }

    function openUrl(url) {

        if (url != null && url != "null") {
            self.location = url;
        }

    }

    function isStoreMetricsDisabled(taskState) {

        var currentTime = (new Date()).getTime();
        var timeSincePreviousStore = currentTime - taskState.metricsLastStoredTimestamp;
        if (timeSincePreviousStore < 3 * 60 * 1000) {
            return true;
        } else {
            taskState.metricsLastStoredTimestamp = currentTime;
        }

        return false;

    }

    function isValidUser(user) {

        if ("-" === user) {
            return true;
        }

        if (!isNaN(user) && user > 0) {
            return true;
        }

        return false;

    }

    function createPath() {

        if (arguments.length > 0) {

            var path = arguments[0] + "/";

            for (var i = 1; i < arguments.length; i++) {

                if (i == arguments.length - 1) {
                    path += arguments[i];
                } else {
                    path += arguments[i] + "/";
                }

            }

            return path;

        }

        return null;

    }

    function decoratePostData(postData, materialAndPage) {
        currentMaterial = materialAndPage[0];
        currentPage = materialAndPage[1];

        postData.materialId = currentMaterial.id;
        postData.materialUuid = currentMaterial.uuid;
        postData.page = currentPage.id;
        postData.pageUuid = currentPage.uuid;
    }

    function getCurrentMaterialAndPage() {
        return Promise.all([
            new Promise(function (resolve, reject) {
                material.getCurrentMaterial(function (currentMaterial) {
                    resolve(currentMaterial);
                });

                reject("Current material unavailable");
            }),
            new Promise(function (resolve, reject) {
                material.getCurrentPage(function (currentPage) {
                    if (currentPage) {
                        resolve(currentPage);
                    }

                    reject("Current page is unavailable");
                });
            })
        ])
    }

    //String.startsWith polyfill for IE
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            return this.substr(position || 0, searchString.length) === searchString;
        };
    }

    //Clear state on page change
    material.onPageChange(function () {
        //Clean old functions
        cleanTaskStates();
        //Clear loading status & queue
        taskLoadingStatus.loading = false;
        taskLoadingStatus.queue = [];
    });

    //Makes sure that all tasks have saved their data before the page is changed
    material.onPageStartsLoading(function () {

        //Array to hold the promises for each task on the current page
        var promises = [];

        //Get the promises indicating when each task has finished saving its data
        jQuery.each(getValidTaskStates(), function (index, state) {
            promises.push(callSuspend(state));
        });

        //Return a promise that resolves after cleanup
        return jQuery.when.apply(null, promises);
    });

    return {
        createTaskState: createTaskState,
        getTasks: getTasks,
        registerApiListener: registerApiListener,
        registerNamedApiListener: registerNamedApiListener,
        createTask: createTask,
        createUIModule: createUIModule,
        createAnswerModule: createAnswerModule,
        createEditorModule: createEditorModule,
        createGroupModule: createGroupModule,
        createFileModule: createFileModule,
        createNavigationModule: createNavigationModule,
        callMethodComplete: callMethodComplete,
        STATUS_CODE_SUCCESS: STATUS_CODE_SUCCESS,
        STATUS_CODE_ERROR: STATUS_CODE_ERROR,
        logError: logError,
        getFlashElement: getFlashElement,
        getTaskFrameElement: getTaskFrameElement,
        getTaskBodyElement: getTaskBodyElement,
        setTaskHeightChangeAnimationDuration: setTaskHeightChangeAnimationDuration,
        getTaskHeightChangeAnimationDuration: getTaskHeightChangeAnimationDuration
    };

});

jQuery(document).ready(function() {

	var localSessionValues = {};
	
	function watchSessionValue( key, value, callback ) {
		
		localSessionValues[key] = value;
		
		if ( typeof localStorage !== "undefined" ) {
			
			var localStorageKey = "WatchSessionValue_" + key;
			
			try {
				
				localStorage.setItem(localStorageKey, value);
				
				if ( callback ) {
				
					var checkNewSessionValue = function(currentValue) {
	
						var original = localSessionValues[key];
						
						if ( original != null && original != currentValue ) {
							localSessionValues[key] = null;
							callback(currentValue);
						}
						
					};
					
					var storageChangedHandler = function(event) {
											
						if ( event && event.newValue && event.key ) {
							
							if ( event.key == localStorageKey ) {
								checkNewSessionValue(event.newValue);
							}
							
						} else {
							
							setTimeout( function() {
								checkNewSessionValue( localStorage.getItem(localStorageKey) );
							}, 2000 );
							
						}
	
					};
					
					jQuery(window).bind('storage', storageChangedHandler);
					jQuery(document).bind('storage', storageChangedHandler);
					
				}
				
			} catch ( error ) {
				
				console.log(error);
				
			}
			
		}
		
	}
	

	if ( themeDisplay.isSignedIn() ) {
	
		watchSessionValue( 'UserId', themeDisplay.getUserId(), function(newValue) {
			
			var msg = null;
			
			if ( newValue == "0" ) {
				msg = Liferay.Language.get('user-is-logged-out-in-another-tab');
			} else {
				msg = Liferay.Language.get('user-account-is-changed-in-another-tab');
			}
			
			require(['fi.cloubi.frontend.common.js/dialog'], function(dialogs) {
				
				dialogs.info(msg, false, function() {
					self.location = '/';
				});
				
			});
			
		} );
	
	} else {
		
		watchSessionValue( 'UserId', '0' );
		
	}

});
jQuery(document).ready(function() {
    var sessionKey= 'lastactive';
    var sessionInactiveTTL = 70 * 1000;
    var events = ['click', 'onLoad'];

    function sessionInvalid() {
        var msg = Liferay.Language.get('user-session-expired');
        require(['fi.cloubi.frontend.common.js/dialog-vue'], function(dialogs) {

            dialogs.info(msg, false, function() {
                self.location.reload();
            });

        });
    }

    function checkSession() {
        var url = '/o/check-session-alive?userId=' + themeDisplay.getUserId();

        jQuery.ajax({
            url: url,
            dataType: 'json',
            type: 'GET',
            timeout: 10 * 1000,
            headers: {
                'X-CSRF-Token': Liferay.authToken
            },
            success: function(result) {
                if ( !result.signedIn ) {
                    sessionInvalid();
                }
                sessionStorage.setItem(sessionKey, Date.now().toString());
            },
            error: sessionInvalid
        });
    }

    function onActivityEvent() {
        var lastactive = Number(sessionStorage.getItem(sessionKey));
        if (Date.now() > lastactive + sessionInactiveTTL) {
            checkSession();
        } else {
            sessionStorage.setItem(sessionKey, Date.now().toString());
        }
    }

    if (themeDisplay.isSignedIn()) {
        for (var k in events) {
            window.addEventListener(events[k], onActivityEvent);
            if (!sessionStorage.getItem(sessionKey)) {
                sessionStorage.setItem(sessionKey, Date.now().toString());
            }
        }

        setInterval(function () {
            var lastactive = Number(sessionStorage.getItem(sessionKey));
            if (Date.now() > lastactive + sessionInactiveTTL) {
                checkSession();
            }
        }, 1000);

        function onVisibilityChange() {
            if (document.visibilityState === "visible") {
                checkSession();
            }
        }

        document.addEventListener("visibilitychange", onVisibilityChange);

        window.addEventListener("beforeunload", function (e) {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            sessionStorage.setItem(sessionKey, null);
            for (var k in events) {
                window.removeEventListener(events[k], onActivityEvent);
            }
        });
    }
});
jQuery(document).ready(function() {
	
	function initSession() {
		
		//Delay init until the session is available
		if ( Liferay.Session ) {
			//The Liferay session object is buggy, so we turn its timer off and extend the session ourselves
			Liferay.Session.resetInterval = function(){};
			Liferay.Session._stopTimer();
			//Extend session every 4 minutes (since Cloubi is configured to expire it after 5 minutes by default)
			setInterval(function(){
				//Use the session's own extension call to make sure it works correctly
				Liferay.Session._getExtendIO().start();
			}, 4 * 60 * 1000);
			//Old deprecated code
			//Liferay.Session.set('autoExtend', true);
			//Liferay.Session.set('sessionLength', 15);
			//Liferay.Session.set('warningLength', 0);
			
			//Liferay.Session.resetInterval();
		} else {
			
			setTimeout( initSession, 100 );
			
		}
		
	}
	
	initSession();
	
});
if ( self.__CONFIG__ ) {
	
	__CONFIG__.waitTimeout = 0;
	
}

if ( self.Loader && self.Loader._configParser && Loader._configParser._config ) {
	
	Loader._configParser._config.waitTimeout = 0;
	
}
define('fi.cloubi.lib.js@4.9.0.SNAPSHOT/modernizr-custom', [], function(){

/*! modernizr 3.3.1 (Custom Build) | MIT *
 * https://modernizr.com/download/?-csscalc-cssremunit-setclasses !*/
!function(e,n,s){function t(e,n){return typeof e===n}function a(){var e,n,s,a,o,i,c;for(var f in l)if(l.hasOwnProperty(f)){if(e=[],n=l[f],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(s=0;s<n.options.aliases.length;s++)e.push(n.options.aliases[s].toLowerCase());for(a=t(n.fn,"function")?n.fn():n.fn,o=0;o<e.length;o++)i=e[o],c=i.split("."),1===c.length?Modernizr[c[0]]=a:(!Modernizr[c[0]]||Modernizr[c[0]]instanceof Boolean||(Modernizr[c[0]]=new Boolean(Modernizr[c[0]])),Modernizr[c[0]][c[1]]=a),r.push((a?"":"no-")+c.join("-"))}}function o(e){var n=f.className,s=Modernizr._config.classPrefix||"";if(u&&(n=n.baseVal),Modernizr._config.enableJSClass){var t=new RegExp("(^|\\s)"+s+"no-js(\\s|$)");n=n.replace(t,"$1"+s+"js$2")}Modernizr._config.enableClasses&&(n+=" "+s+e.join(" "+s),u?f.className.baseVal=n:f.className=n)}function i(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):u?n.createElementNS.call(n,"http://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}var r=[],l=[],c={_version:"3.3.1",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var s=this;setTimeout(function(){n(s[e])},0)},addTest:function(e,n,s){l.push({name:e,fn:n,options:s})},addAsyncTest:function(e){l.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=c,Modernizr=new Modernizr;var f=n.documentElement,u="svg"===f.nodeName.toLowerCase();Modernizr.addTest("cssremunit",function(){var e=i("a").style;try{e.fontSize="3rem"}catch(n){}return/rem/.test(e.fontSize)});var m=c._config.usePrefixes?" -webkit- -moz- -o- -ms- ".split(" "):["",""];c._prefixes=m,Modernizr.addTest("csscalc",function(){var e="width:",n="calc(10px);",s=i("a");return s.style.cssText=e+m.join(n+e),!!s.style.length}),a(),o(r),delete c.addTest,delete c.addAsyncTest;for(var p=0;p<Modernizr._q.length;p++)Modernizr._q[p]();e.Modernizr=Modernizr}(window,document);

});

define('fi.cloubi.lib.js@4.9.0.SNAPSHOT/offline', [], function(){

/*! offline-js 0.7.17 */
(function() {
	
	var Offline, checkXHR, defaultOptions, extendNative, grab, handlers, init;
  extendNative = function(to, from) {
    var e, key, results, val;
    results = [];
    for (key in from.prototype) try {
      val = from.prototype[key], null == to[key] && "function" != typeof val ? results.push(to[key] = val) :results.push(void 0);
    } catch (_error) {
      e = _error;
    }
    return results;
  }, Offline = {}, Offline.options = window.Offline ? window.Offline.options || {} :{}, 
  defaultOptions = {
    checks:{
      xhr:{
        url:function() {
          return "/favicon.ico?_=" + new Date().getTime();
        },
        timeout:5e3,
        type:"HEAD"
      },
      image:{
        url:function() {
          return "/favicon.ico?_=" + new Date().getTime();
        }
      },
      active:"xhr"
    },
    checkOnLoad:!1,
    interceptRequests:!0,
    reconnect:!0,
    deDupBody:!1
  }, grab = function(obj, key) {
    var cur, i, j, len, part, parts;
    for (cur = obj, parts = key.split("."), i = j = 0, len = parts.length; len > j && (part = parts[i], 
    cur = cur[part], "object" == typeof cur); i = ++j) ;
    return i === parts.length - 1 ? cur :void 0;
  }, Offline.getOption = function(key) {
    var ref, val;
    return val = null != (ref = grab(Offline.options, key)) ? ref :grab(defaultOptions, key), 
    "function" == typeof val ? val() :val;
  }, "function" == typeof window.addEventListener && window.addEventListener("online", function() {
    return setTimeout(Offline.confirmUp, 100);
  }, !1), "function" == typeof window.addEventListener && window.addEventListener("offline", function() {
    return Offline.confirmDown();
  }, !1), Offline.state = "up", Offline.markUp = function() {
    return Offline.trigger("confirmed-up"), "up" !== Offline.state ? (Offline.state = "up", 
    Offline.trigger("up")) :void 0;
  }, Offline.markDown = function() {
    return Offline.trigger("confirmed-down"), "down" !== Offline.state ? (Offline.state = "down", 
    Offline.trigger("down")) :void 0;
  }, handlers = {}, Offline.on = function(event, handler, ctx) {
    var e, events, j, len, results;
    if (events = event.split(" "), events.length > 1) {
      for (results = [], j = 0, len = events.length; len > j; j++) e = events[j], results.push(Offline.on(e, handler, ctx));
      return results;
    }
    return null == handlers[event] && (handlers[event] = []), handlers[event].push([ ctx, handler ]);
  }, Offline.off = function(event, handler) {
    var _handler, ctx, i, ref, results;
    if (null != handlers[event]) {
      if (handler) {
        for (i = 0, results = []; i < handlers[event].length; ) ref = handlers[event][i], 
        ctx = ref[0], _handler = ref[1], _handler === handler ? results.push(handlers[event].splice(i, 1)) :results.push(i++);
        return results;
      }
      return handlers[event] = [];
    }
  }, Offline.trigger = function(event) {
    var ctx, handler, j, len, ref, ref1, results;
    if (null != handlers[event]) {
      for (ref = handlers[event], results = [], j = 0, len = ref.length; len > j; j++) ref1 = ref[j], 
      ctx = ref1[0], handler = ref1[1], results.push(handler.call(ctx));
      return results;
    }
  }, checkXHR = function(xhr, onUp, onDown) {
    var _onerror, _onload, _onreadystatechange, _ontimeout, checkStatus;
    return checkStatus = function() {
      return xhr.status && xhr.status < 12e3 ? onUp() :onDown();
    }, null === xhr.onprogress ? (_onerror = xhr.onerror, xhr.onerror = function() {
      return onDown(), "function" == typeof _onerror ? _onerror.apply(null, arguments) :void 0;
    }, _ontimeout = xhr.ontimeout, xhr.ontimeout = function() {
      return onDown(), "function" == typeof _ontimeout ? _ontimeout.apply(null, arguments) :void 0;
    }, _onload = xhr.onload, xhr.onload = function() {
      return checkStatus(), "function" == typeof _onload ? _onload.apply(null, arguments) :void 0;
    }) :(_onreadystatechange = xhr.onreadystatechange, xhr.onreadystatechange = function() {
      return 4 === xhr.readyState ? checkStatus() :0 === xhr.readyState && onDown(), "function" == typeof _onreadystatechange ? _onreadystatechange.apply(null, arguments) :void 0;
    });
  }, Offline.checks = {}, Offline.checks.xhr = function() {
    var e, xhr;
    xhr = new XMLHttpRequest(), xhr.offline = !1, xhr.open(Offline.getOption("checks.xhr.type"), Offline.getOption("checks.xhr.url"), !0), 
    null != xhr.timeout && (xhr.timeout = Offline.getOption("checks.xhr.timeout")), 
    checkXHR(xhr, Offline.markUp, Offline.markDown);
    try {
      xhr.send();
    } catch (_error) {
      e = _error, Offline.markDown();
    }
    return xhr;
  }, Offline.checks.image = function() {
    var img;
    img = document.createElement("img"), img.onerror = Offline.markDown, img.onload = Offline.markUp, 
    img.src = Offline.getOption("checks.image.url");
  }, Offline.checks.down = Offline.markDown, Offline.checks.up = Offline.markUp, Offline.check = function() {
    return Offline.trigger("checking"), Offline.checks[Offline.getOption("checks.active")]();
  }, Offline.confirmUp = Offline.confirmDown = Offline.check, Offline.onXHR = function(cb) {
    var _XDomainRequest, _XMLHttpRequest, monitorXHR;
    return monitorXHR = function(req, flags) {
      var _open;
      return _open = req.open, req.open = function(type, url, async, user, password) {
        return cb({
          type:type,
          url:url,
          async:async,
          flags:flags,
          user:user,
          password:password,
          xhr:req
        }), _open.apply(req, arguments);
      };
    }, _XMLHttpRequest = window.XMLHttpRequest, window.XMLHttpRequest = function(flags) {
      var _overrideMimeType, _setRequestHeader, req;
      return req = new _XMLHttpRequest(flags), monitorXHR(req, flags), _setRequestHeader = req.setRequestHeader, 
      req.headers = {}, req.setRequestHeader = function(name, value) {
        return req.headers[name] = value, _setRequestHeader.call(req, name, value);
      }, _overrideMimeType = req.overrideMimeType, req.overrideMimeType = function(type) {
        return req.mimeType = type, _overrideMimeType.call(req, type);
      }, req;
    }, extendNative(window.XMLHttpRequest, _XMLHttpRequest), null != window.XDomainRequest ? (_XDomainRequest = window.XDomainRequest, 
    window.XDomainRequest = function() {
      var req;
      return req = new _XDomainRequest(), monitorXHR(req), req;
    }, extendNative(window.XDomainRequest, _XDomainRequest)) :void 0;
  }, init = function() {
    return Offline.getOption("interceptRequests") && Offline.onXHR(function(arg) {
      var xhr;
      return xhr = arg.xhr, xhr.offline !== !1 ? checkXHR(xhr, Offline.markUp, Offline.confirmDown) :void 0;
    }), Offline.getOption("checkOnLoad") ? Offline.check() :void 0;
  }, setTimeout(init, 0), window.Offline = Offline;
}).call(this), function() {
  var down, next, nope, rc, reset, retryIntv, tick, tryNow, up;
  if (!window.Offline) throw new Error("Offline Reconnect brought in without offline.js");
  rc = Offline.reconnect = {}, retryIntv = null, reset = function() {
    var ref;
    return null != rc.state && "inactive" !== rc.state && Offline.trigger("reconnect:stopped"), 
    rc.state = "inactive", rc.remaining = rc.delay = null != (ref = Offline.getOption("reconnect.initialDelay")) ? ref :3;
  }, next = function() {
    var delay, ref;
    return delay = null != (ref = Offline.getOption("reconnect.delay")) ? ref :Math.min(Math.ceil(1.5 * rc.delay), 3600), 
    rc.remaining = rc.delay = delay;
  }, tick = function() {
    return "connecting" !== rc.state ? (rc.remaining -= 1, Offline.trigger("reconnect:tick"), 
    0 === rc.remaining ? tryNow() :void 0) :void 0;
  }, tryNow = function() {
    return "waiting" === rc.state ? (Offline.trigger("reconnect:connecting"), rc.state = "connecting", 
    Offline.check()) :void 0;
  }, down = function() {
    return Offline.getOption("reconnect") ? (reset(), rc.state = "waiting", Offline.trigger("reconnect:started"), 
    retryIntv = setInterval(tick, 1e3)) :void 0;
  }, up = function() {
    return null != retryIntv && clearInterval(retryIntv), reset();
  }, nope = function() {
    return Offline.getOption("reconnect") && "connecting" === rc.state ? (Offline.trigger("reconnect:failure"), 
    rc.state = "waiting", next()) :void 0;
  }, rc.tryNow = tryNow, reset(), Offline.on("down", down), Offline.on("confirmed-down", nope), 
  Offline.on("up", up);
}.call(this), function() {
  var clear, flush, held, holdRequest, makeRequest, waitingOnConfirm;
  if (!window.Offline) throw new Error("Requests module brought in without offline.js");
  held = [], waitingOnConfirm = !1, holdRequest = function(req) {
    return Offline.getOption("requests") !== !1 ? (Offline.trigger("requests:capture"), 
    "down" !== Offline.state && (waitingOnConfirm = !0), held.push(req)) :void 0;
  }, makeRequest = function(arg) {
    var body, name, password, ref, type, url, user, val, xhr;
    if (xhr = arg.xhr, url = arg.url, type = arg.type, user = arg.user, password = arg.password, 
    body = arg.body, Offline.getOption("requests") !== !1) {
      xhr.abort(), xhr.open(type, url, !0, user, password), ref = xhr.headers;
      for (name in ref) val = ref[name], xhr.setRequestHeader(name, val);
      return xhr.mimeType && xhr.overrideMimeType(xhr.mimeType), xhr.send(body);
    }
  }, clear = function() {
    return held = [];
  }, flush = function() {
    var body, i, key, len, request, requests, url;
    if (Offline.getOption("requests") !== !1) {
      for (Offline.trigger("requests:flush"), requests = {}, i = 0, len = held.length; len > i; i++) request = held[i], 
      url = request.url.replace(/(\?|&)_=[0-9]+/, function(match, char) {
        return "?" === char ? char :"";
      }), Offline.getOption("deDupBody") ? (body = request.body, body = "[object Object]" === body.toString() ? JSON.stringify(body) :body.toString(), 
      requests[request.type.toUpperCase() + " - " + url + " - " + body] = request) :requests[request.type.toUpperCase() + " - " + url] = request;
      for (key in requests) request = requests[key], makeRequest(request);
      return clear();
    }
  }, setTimeout(function() {
    return Offline.getOption("requests") !== !1 ? (Offline.on("confirmed-up", function() {
      return waitingOnConfirm ? (waitingOnConfirm = !1, clear()) :void 0;
    }), Offline.on("up", flush), Offline.on("down", function() {
      return waitingOnConfirm = !1;
    }), Offline.onXHR(function(request) {
      var _onreadystatechange, _send, async, hold, xhr;
      return xhr = request.xhr, async = request.async, xhr.offline !== !1 && (hold = function() {
        return holdRequest(request);
      }, _send = xhr.send, xhr.send = function(body) {
        return request.body = body, _send.apply(xhr, arguments);
      }, async) ? null === xhr.onprogress ? (xhr.addEventListener("error", hold, !1), 
      xhr.addEventListener("timeout", hold, !1)) :(_onreadystatechange = xhr.onreadystatechange, 
      xhr.onreadystatechange = function() {
        return 0 === xhr.readyState ? hold() :4 === xhr.readyState && (0 === xhr.status || xhr.status >= 12e3) && hold(), 
        "function" == typeof _onreadystatechange ? _onreadystatechange.apply(null, arguments) :void 0;
      }) :void 0;
    }), Offline.requests = {
      flush:flush,
      clear:clear
    }) :void 0;
  }, 0);
}.call(this), function() {
  var base, e, i, len, ref, simulate, state;
  if (!Offline) throw new Error("Offline simulate brought in without offline.js");
  for (ref = [ "up", "down" ], i = 0, len = ref.length; len > i; i++) {
    state = ref[i];
    try {
      simulate = document.querySelector("script[data-simulate='" + state + "']") || ("undefined" != typeof localStorage && null !== localStorage ? localStorage.OFFLINE_SIMULATE :void 0) === state;
    } catch (_error) {
      e = _error, simulate = !1;
    }
  }
  simulate && (null == Offline.options && (Offline.options = {}), null == (base = Offline.options).checks && (base.checks = {}), 
  Offline.options.checks.active = state);
}.call(this), function() {
  var RETRY_TEMPLATE, TEMPLATE, _onreadystatechange, addClass, content, createFromHTML, el, flashClass, flashTimeouts, init, removeClass, render, roundTime;
  if (!window.Offline) throw new Error("Offline UI brought in without offline.js");
  TEMPLATE = '<div class="offline-ui"><div class="offline-ui-content"></div></div>', 
  RETRY_TEMPLATE = '<a href class="offline-ui-retry"></a>', createFromHTML = function(html) {
    var el;
    return el = document.createElement("div"), el.innerHTML = html, el.children[0];
  }, el = content = null, addClass = function(name) {
    return removeClass(name), el.className += " " + name;
  }, removeClass = function(name) {
    return el.className = el.className.replace(new RegExp("(^| )" + name.split(" ").join("|") + "( |$)", "gi"), " ");
  }, flashTimeouts = {}, flashClass = function(name, time) {
    return addClass(name), null != flashTimeouts[name] && clearTimeout(flashTimeouts[name]), 
    flashTimeouts[name] = setTimeout(function() {
      return removeClass(name), delete flashTimeouts[name];
    }, 1e3 * time);
  }, roundTime = function(sec) {
    var mult, unit, units, val;
    units = {
      day:86400,
      hour:3600,
      minute:60,
      second:1
    };
    for (unit in units) if (mult = units[unit], sec >= mult) return val = Math.floor(sec / mult), 
    [ val, unit ];
    return [ "now", "" ];
  }, render = function() {
    var button, handler;
    return el = createFromHTML(TEMPLATE), document.body.appendChild(el), null != Offline.reconnect && Offline.getOption("reconnect") && (el.appendChild(createFromHTML(RETRY_TEMPLATE)), 
    button = el.querySelector(".offline-ui-retry"), handler = function(e) {
      return e.preventDefault(), Offline.reconnect.tryNow();
    }, null != button.addEventListener ? button.addEventListener("click", handler, !1) :button.attachEvent("click", handler)), 
    addClass("offline-ui-" + Offline.state), content = el.querySelector(".offline-ui-content");
  }, init = function() {
    return render(), Offline.on("up", function() {
      return removeClass("offline-ui-down"), addClass("offline-ui-up"), flashClass("offline-ui-up-2s", 2), 
      flashClass("offline-ui-up-5s", 5);
    }), Offline.on("down", function() {
      return removeClass("offline-ui-up"), addClass("offline-ui-down"), flashClass("offline-ui-down-2s", 2), 
      flashClass("offline-ui-down-5s", 5);
    }), Offline.on("reconnect:connecting", function() {
      return addClass("offline-ui-connecting"), removeClass("offline-ui-waiting");
    }), Offline.on("reconnect:tick", function() {
      var ref, time, unit;
      return addClass("offline-ui-waiting"), removeClass("offline-ui-connecting"), ref = roundTime(Offline.reconnect.remaining), 
      time = ref[0], unit = ref[1], content.setAttribute("data-retry-in-value", time), 
      content.setAttribute("data-retry-in-unit", unit);
    }), Offline.on("reconnect:stopped", function() {
      return removeClass("offline-ui-connecting offline-ui-waiting"), content.setAttribute("data-retry-in-value", null), 
      content.setAttribute("data-retry-in-unit", null);
    }), Offline.on("reconnect:failure", function() {
      return flashClass("offline-ui-reconnect-failed-2s", 2), flashClass("offline-ui-reconnect-failed-5s", 5);
    }), Offline.on("reconnect:success", function() {
      return flashClass("offline-ui-reconnect-succeeded-2s", 2), flashClass("offline-ui-reconnect-succeeded-5s", 5);
    });
  }, "complete" === document.readyState ? init() :null != document.addEventListener ? document.addEventListener("DOMContentLoaded", init, !1) :(_onreadystatechange = document.onreadystatechange, 
  document.onreadystatechange = function() {
    return "complete" === document.readyState && init(), "function" == typeof _onreadystatechange ? _onreadystatechange.apply(null, arguments) :void 0;
  });
}.call(this);


return {};

});

define('fi.cloubi.lib.js@4.9.0.SNAPSHOT/jquery-ui', ['./jquery'], function(jQuery) {

	/* Load jQuery UI CSS. */
	jQuery('<link>')
		.appendTo('head')
		.attr({type : 'text/css', rel : 'stylesheet'})
		.attr('href', '/o/cloubi-frontend-thirdparty-js/css/jquery-ui.min.css');
	/*! jQuery UI - v1.11.4 - 2015-03-11
	* http://jqueryui.com
	* Includes: core.js, widget.js, mouse.js, position.js, accordion.js, autocomplete.js, button.js, datepicker.js, dialog.js, draggable.js, droppable.js, effect.js, effect-blind.js, effect-bounce.js, effect-clip.js, effect-drop.js, effect-explode.js, effect-fade.js, effect-fold.js, effect-highlight.js, effect-puff.js, effect-pulsate.js, effect-scale.js, effect-shake.js, effect-size.js, effect-slide.js, effect-transfer.js, menu.js, progressbar.js, resizable.js, selectable.js, selectmenu.js, slider.js, sortable.js, spinner.js, tabs.js, tooltip.js
	* Copyright 2015 jQuery Foundation and other contributors; Licensed MIT */

	(function( factory ) {

		// Browser globals
		factory( jQuery );
		
	}(function( $ ) {
	/*!
	 * jQuery UI Core 1.11.4
	 * http://jqueryui.com
	 *
	 * Copyright jQuery Foundation and other contributors
	 * Released under the MIT license.
	 * http://jquery.org/license
	 *
	 * http://api.jqueryui.com/category/ui-core/
	 */	

// $.ui might exist from components with no dependencies, e.g., $.ui.position
$.ui = $.ui || {};

$.extend( $.ui, {
	version: "1.11.4",

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	}
});

// plugins
$.fn.extend({
	scrollParent: function( includeHidden ) {
		var position = this.css( "position" ),
			excludeStaticParent = position === "absolute",
			overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
			scrollParent = this.parents().filter( function() {
				var parent = $( this );
				if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
					return false;
				}
				return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) );
			}).eq( 0 );

		return position === "fixed" || !scrollParent.length ? $( this[ 0 ].ownerDocument || document ) : scrollParent;
	},

	uniqueId: (function() {
		var uuid = 0;

		return function() {
			return this.each(function() {
				if ( !this.id ) {
					this.id = "ui-id-" + ( ++uuid );
				}
			});
		};
	})(),

	removeUniqueId: function() {
		return this.each(function() {
			if ( /^ui-id-\d+$/.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		});
	}
});

// selectors
function focusable( element, isTabIndexNotNaN ) {
	var map, mapName, img,
		nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap='#" + mapName + "']" )[ 0 ];
		return !!img && visible( img );
	}
	return ( /^(input|select|textarea|button|object)$/.test( nodeName ) ?
		!element.disabled :
		"a" === nodeName ?
			element.href || isTabIndexNotNaN :
			isTabIndexNotNaN) &&
		// the element and all of its ancestors must be visible
		visible( element );
}

function visible( element ) {
	return $.expr.filters.visible( element ) &&
		!$( element ).parents().addBack().filter(function() {
			return $.css( this, "visibility" ) === "hidden";
		}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// support: jQuery <1.8
if ( !$.fn.addBack ) {
	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

// support: jQuery 1.6.1, 1.6.2 (http://bugs.jquery.com/ticket/9413)
if ( $( "<a>" ).data( "a-b", "a" ).removeData( "a-b" ).data( "a-b" ) ) {
	$.fn.removeData = (function( removeData ) {
		return function( key ) {
			if ( arguments.length ) {
				return removeData.call( this, $.camelCase( key ) );
			} else {
				return removeData.call( this );
			}
		};
	})( $.fn.removeData );
}

// deprecated
$.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );

$.fn.extend({
	focus: (function( orig ) {
		return function( delay, fn ) {
			return typeof delay === "number" ?
				this.each(function() {
					var elem = this;
					setTimeout(function() {
						$( elem ).focus();
						if ( fn ) {
							fn.call( elem );
						}
					}, delay );
				}) :
				orig.apply( this, arguments );
		};
	})( $.fn.focus ),

	disableSelection: (function() {
		var eventType = "onselectstart" in document.createElement( "div" ) ?
			"selectstart" :
			"mousedown";

		return function() {
			return this.bind( eventType + ".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
		};
	})(),

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	}
});

// $.ui.plugin is deprecated. Use $.widget() extensions instead.
$.ui.plugin = {
	add: function( module, option, set ) {
		var i,
			proto = $.ui[ module ].prototype;
		for ( i in set ) {
			proto.plugins[ i ] = proto.plugins[ i ] || [];
			proto.plugins[ i ].push( [ option, set[ i ] ] );
		}
	},
	call: function( instance, name, args, allowDisconnected ) {
		var i,
			set = instance.plugins[ name ];

		if ( !set ) {
			return;
		}

		if ( !allowDisconnected && ( !instance.element[ 0 ].parentNode || instance.element[ 0 ].parentNode.nodeType === 11 ) ) {
			return;
		}

		for ( i = 0; i < set.length; i++ ) {
			if ( instance.options[ set[ i ][ 0 ] ] ) {
				set[ i ][ 1 ].apply( instance.element, args );
			}
		}
	}
};


/*!
 * jQuery UI Widget 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/jQuery.widget/
 */


var widget_uuid = 0,
	widget_slice = Array.prototype.slice;

$.cleanData = (function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; (elem = elems[i]) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// http://bugs.jquery.com/ticket/8235
			} catch ( e ) {}
		}
		orig( elems );
	};
})( $.cleanData );

$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		// proxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		proxiedPrototype = {},
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	});

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = (function() {
			var _super = function() {
					return base.prototype[ prop ].apply( this, arguments );
				},
				_superApply = function( args ) {
					return base.prototype[ prop ].apply( this, args );
				};
			return function() {
				var __super = this._super,
					__superApply = this._superApply,
					returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		})();
	});
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? (basePrototype.widgetEventPrefix || name) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	});

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		});
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widget_slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = widget_slice.call( arguments, 1 ),
			returnValue = this;

		if ( isMethodCall ) {
			this.each(function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( options === "instance" ) {
					returnValue = instance;
					return false;
				}
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			});
		} else {

			// Allow multiple hashes to be passed on init
			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat(args) );
			}

			this.each(function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",
	options: {
		disabled: false,

		// callbacks
		create: null
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widget_uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			});
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	_getCreateOptions: $.noop,
	_getCreateEventData: $.noop,
	_create: $.noop,
	_init: $.noop,

	destroy: function() {
		this._destroy();
		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.unbind( this.eventNamespace )
			.removeData( this.widgetFullName )
			// support: jquery <1.6.3
			// http://bugs.jquery.com/ticket/9413
			.removeData( $.camelCase( this.widgetFullName ) );
		this.widget()
			.unbind( this.eventNamespace )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetFullName + "-disabled " +
				"ui-state-disabled" );

		// clean up events and states
		this.bindings.unbind( this.eventNamespace );
		this.hoverable.removeClass( "ui-state-hover" );
		this.focusable.removeClass( "ui-state-focus" );
	},
	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				.toggleClass( this.widgetFullName + "-disabled", !!value );

			// If the widget is becoming disabled, then nothing is interactive
			if ( value ) {
				this.hoverable.removeClass( "ui-state-hover" );
				this.focusable.removeClass( "ui-state-focus" );
			}
		}

		return this;
	},

	enable: function() {
		return this._setOptions({ disabled: false });
	},
	disable: function() {
		return this._setOptions({ disabled: true });
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ ),
				eventName = match[1] + instance.eventNamespace,
				selector = match[2];
			if ( selector ) {
				delegateElement.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},

	_off: function( element, eventName ) {
		eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.unbind( eventName ).undelegate( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-hover" );
			},
			mouseleave: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-hover" );
			}
		});
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-focus" );
			},
			focusout: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-focus" );
			}
		});
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue(function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			});
		}
	};
});

var widget = $.widget;


/*!
 * jQuery UI Mouse 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/mouse/
 */


var mouseHandled = false;
$( document ).mouseup( function() {
	mouseHandled = false;
});

var mouse = $.widget("ui.mouse", {
	version: "1.11.4",
	options: {
		cancel: "input,textarea,button,select,option",
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var that = this;

		this.element
			.bind("mousedown." + this.widgetName, function(event) {
				return that._mouseDown(event);
			})
			.bind("click." + this.widgetName, function(event) {
				if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
					$.removeData(event.target, that.widgetName + ".preventClickEvent");
					event.stopImmediatePropagation();
					return false;
				}
			});

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind("." + this.widgetName);
		if ( this._mouseMoveDelegate ) {
			this.document
				.unbind("mousemove." + this.widgetName, this._mouseMoveDelegate)
				.unbind("mouseup." + this.widgetName, this._mouseUpDelegate);
		}
	},

	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		if ( mouseHandled ) {
			return;
		}

		this._mouseMoved = false;

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = (event.which === 1),
			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = (typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				that.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
			$.removeData(event.target, this.widgetName + ".preventClickEvent");
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return that._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return that._mouseUp(event);
		};

		this.document
			.bind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.bind( "mouseup." + this.widgetName, this._mouseUpDelegate );

		event.preventDefault();

		mouseHandled = true;
		return true;
	},

	_mouseMove: function(event) {
		// Only check for mouseups outside the document if you've moved inside the document
		// at least once. This prevents the firing of mouseup in the case of IE<9, which will
		// fire a mousemove event if content is placed under the cursor. See #7778
		// Support: IE <9
		if ( this._mouseMoved ) {
			// IE mouseup check - mouseup happened when mouse was out of window
			if ($.ui.ie && ( !document.documentMode || document.documentMode < 9 ) && !event.button) {
				return this._mouseUp(event);

			// Iframe mouseup check - mouseup occurred in another document
			} else if ( !event.which ) {
				return this._mouseUp( event );
			}
		}

		if ( event.which || event.button ) {
			this._mouseMoved = true;
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},

	_mouseUp: function(event) {
		this.document
			.unbind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.unbind( "mouseup." + this.widgetName, this._mouseUpDelegate );

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target === this._mouseDownEvent.target) {
				$.data(event.target, this.widgetName + ".preventClickEvent", true);
			}

			this._mouseStop(event);
		}

		mouseHandled = false;
		return false;
	},

	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function(/* event */) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(/* event */) {},
	_mouseDrag: function(/* event */) {},
	_mouseStop: function(/* event */) {},
	_mouseCapture: function(/* event */) { return true; }
});


/*!
 * jQuery UI Position 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/position/
 */

(function() {

$.ui = $.ui || {};

var cachedScrollbarWidth, supportsOffsetFractions,
	max = Math.max,
	abs = Math.abs,
	round = Math.round,
	rhorizontal = /left|center|right/,
	rvertical = /top|center|bottom/,
	roffset = /[\+\-]\d+(\.[\d]+)?%?/,
	rposition = /^\w+/,
	rpercent = /%$/,
	_position = $.fn.position;

function getOffsets( offsets, width, height ) {
	return [
		parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
		parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
	];
}

function parseCss( element, property ) {
	return parseInt( $.css( element, property ), 10 ) || 0;
}

function getDimensions( elem ) {
	var raw = elem[0];
	if ( raw.nodeType === 9 ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: 0, left: 0 }
		};
	}
	if ( $.isWindow( raw ) ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
		};
	}
	if ( raw.preventDefault ) {
		return {
			width: 0,
			height: 0,
			offset: { top: raw.pageY, left: raw.pageX }
		};
	}
	return {
		width: elem.outerWidth(),
		height: elem.outerHeight(),
		offset: elem.offset()
	};
}

$.position = {
	scrollbarWidth: function() {
		if ( cachedScrollbarWidth !== undefined ) {
			return cachedScrollbarWidth;
		}
		var w1, w2,
			div = $( "<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>" ),
			innerDiv = div.children()[0];

		$( "body" ).append( div );
		w1 = innerDiv.offsetWidth;
		div.css( "overflow", "scroll" );

		w2 = innerDiv.offsetWidth;

		if ( w1 === w2 ) {
			w2 = div[0].clientWidth;
		}

		div.remove();

		return (cachedScrollbarWidth = w1 - w2);
	},
	getScrollInfo: function( within ) {
		var overflowX = within.isWindow || within.isDocument ? "" :
				within.element.css( "overflow-x" ),
			overflowY = within.isWindow || within.isDocument ? "" :
				within.element.css( "overflow-y" ),
			hasOverflowX = overflowX === "scroll" ||
				( overflowX === "auto" && within.width < within.element[0].scrollWidth ),
			hasOverflowY = overflowY === "scroll" ||
				( overflowY === "auto" && within.height < within.element[0].scrollHeight );
		return {
			width: hasOverflowY ? $.position.scrollbarWidth() : 0,
			height: hasOverflowX ? $.position.scrollbarWidth() : 0
		};
	},
	getWithinInfo: function( element ) {
		var withinElement = $( element || window ),
			isWindow = $.isWindow( withinElement[0] ),
			isDocument = !!withinElement[ 0 ] && withinElement[ 0 ].nodeType === 9;
		return {
			element: withinElement,
			isWindow: isWindow,
			isDocument: isDocument,
			offset: withinElement.offset() || { left: 0, top: 0 },
			scrollLeft: withinElement.scrollLeft(),
			scrollTop: withinElement.scrollTop(),

			// support: jQuery 1.6.x
			// jQuery 1.6 doesn't support .outerWidth/Height() on documents or windows
			width: isWindow || isDocument ? withinElement.width() : withinElement.outerWidth(),
			height: isWindow || isDocument ? withinElement.height() : withinElement.outerHeight()
		};
	}
};

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
		target = $( options.of ),
		within = $.position.getWithinInfo( options.within ),
		scrollInfo = $.position.getScrollInfo( within ),
		collision = ( options.collision || "flip" ).split( " " ),
		offsets = {};

	dimensions = getDimensions( target );
	if ( target[0].preventDefault ) {
		// force left top to allow flipping
		options.at = "left top";
	}
	targetWidth = dimensions.width;
	targetHeight = dimensions.height;
	targetOffset = dimensions.offset;
	// clone to reuse original targetOffset later
	basePosition = $.extend( {}, targetOffset );

	// force my and at to have valid horizontal and vertical positions
	// if a value is missing or invalid, it will be converted to center
	$.each( [ "my", "at" ], function() {
		var pos = ( options[ this ] || "" ).split( " " ),
			horizontalOffset,
			verticalOffset;

		if ( pos.length === 1) {
			pos = rhorizontal.test( pos[ 0 ] ) ?
				pos.concat( [ "center" ] ) :
				rvertical.test( pos[ 0 ] ) ?
					[ "center" ].concat( pos ) :
					[ "center", "center" ];
		}
		pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
		pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

		// calculate offsets
		horizontalOffset = roffset.exec( pos[ 0 ] );
		verticalOffset = roffset.exec( pos[ 1 ] );
		offsets[ this ] = [
			horizontalOffset ? horizontalOffset[ 0 ] : 0,
			verticalOffset ? verticalOffset[ 0 ] : 0
		];

		// reduce to just the positions without the offsets
		options[ this ] = [
			rposition.exec( pos[ 0 ] )[ 0 ],
			rposition.exec( pos[ 1 ] )[ 0 ]
		];
	});

	// normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	if ( options.at[ 0 ] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[ 0 ] === "center" ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[ 1 ] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[ 1 ] === "center" ) {
		basePosition.top += targetHeight / 2;
	}

	atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
	basePosition.left += atOffset[ 0 ];
	basePosition.top += atOffset[ 1 ];

	return this.each(function() {
		var collisionPosition, using,
			elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseCss( this, "marginLeft" ),
			marginTop = parseCss( this, "marginTop" ),
			collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) + scrollInfo.width,
			collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) + scrollInfo.height,
			position = $.extend( {}, basePosition ),
			myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

		if ( options.my[ 0 ] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[ 0 ] === "center" ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[ 1 ] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[ 1 ] === "center" ) {
			position.top -= elemHeight / 2;
		}

		position.left += myOffset[ 0 ];
		position.top += myOffset[ 1 ];

		// if the browser doesn't support fractions, then round for consistent results
		if ( !supportsOffsetFractions ) {
			position.left = round( position.left );
			position.top = round( position.top );
		}

		collisionPosition = {
			marginLeft: marginLeft,
			marginTop: marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[ i ] ] ) {
				$.ui.position[ collision[ i ] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
					my: options.my,
					at: options.at,
					within: within,
					elem: elem
				});
			}
		});

		if ( options.using ) {
			// adds feedback as second argument to using callback, if present
			using = function( props ) {
				var left = targetOffset.left - position.left,
					right = left + targetWidth - elemWidth,
					top = targetOffset.top - position.top,
					bottom = top + targetHeight - elemHeight,
					feedback = {
						target: {
							element: target,
							left: targetOffset.left,
							top: targetOffset.top,
							width: targetWidth,
							height: targetHeight
						},
						element: {
							element: elem,
							left: position.left,
							top: position.top,
							width: elemWidth,
							height: elemHeight
						},
						horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
						vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
					};
				if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
					feedback.horizontal = "center";
				}
				if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
					feedback.vertical = "middle";
				}
				if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
					feedback.important = "horizontal";
				} else {
					feedback.important = "vertical";
				}
				options.using.call( this, props, feedback );
			};
		}

		elem.offset( $.extend( position, { using: using } ) );
	});
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
				outerWidth = within.width,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = withinOffset - collisionPosLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
				newOverRight;

			// element is wider than within
			if ( data.collisionWidth > outerWidth ) {
				// element is initially over the left side of within
				if ( overLeft > 0 && overRight <= 0 ) {
					newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
					position.left += overLeft - newOverRight;
				// element is initially over right side of within
				} else if ( overRight > 0 && overLeft <= 0 ) {
					position.left = withinOffset;
				// element is initially over both left and right sides of within
				} else {
					if ( overLeft > overRight ) {
						position.left = withinOffset + outerWidth - data.collisionWidth;
					} else {
						position.left = withinOffset;
					}
				}
			// too far left -> align with left edge
			} else if ( overLeft > 0 ) {
				position.left += overLeft;
			// too far right -> align with right edge
			} else if ( overRight > 0 ) {
				position.left -= overRight;
			// adjust based on position and margin
			} else {
				position.left = max( position.left - collisionPosLeft, position.left );
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
				outerHeight = data.within.height,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = withinOffset - collisionPosTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
				newOverBottom;

			// element is taller than within
			if ( data.collisionHeight > outerHeight ) {
				// element is initially over the top of within
				if ( overTop > 0 && overBottom <= 0 ) {
					newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
					position.top += overTop - newOverBottom;
				// element is initially over bottom of within
				} else if ( overBottom > 0 && overTop <= 0 ) {
					position.top = withinOffset;
				// element is initially over both top and bottom of within
				} else {
					if ( overTop > overBottom ) {
						position.top = withinOffset + outerHeight - data.collisionHeight;
					} else {
						position.top = withinOffset;
					}
				}
			// too far up -> align with top
			} else if ( overTop > 0 ) {
				position.top += overTop;
			// too far down -> align with bottom edge
			} else if ( overBottom > 0 ) {
				position.top -= overBottom;
			// adjust based on position and margin
			} else {
				position.top = max( position.top - collisionPosTop, position.top );
			}
		}
	},
	flip: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.left + within.scrollLeft,
				outerWidth = within.width,
				offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = collisionPosLeft - offsetLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					data.at[ 0 ] === "right" ?
						-data.targetWidth :
						0,
				offset = -2 * data.offset[ 0 ],
				newOverRight,
				newOverLeft;

			if ( overLeft < 0 ) {
				newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
				if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
					position.left += myOffset + atOffset + offset;
				}
			} else if ( overRight > 0 ) {
				newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
				if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
					position.left += myOffset + atOffset + offset;
				}
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.top + within.scrollTop,
				outerHeight = within.height,
				offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = collisionPosTop - offsetTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
				top = data.my[ 1 ] === "top",
				myOffset = top ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					data.at[ 1 ] === "bottom" ?
						-data.targetHeight :
						0,
				offset = -2 * data.offset[ 1 ],
				newOverTop,
				newOverBottom;
			if ( overTop < 0 ) {
				newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
				if ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) {
					position.top += myOffset + atOffset + offset;
				}
			} else if ( overBottom > 0 ) {
				newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
				if ( newOverTop > 0 || abs( newOverTop ) < overBottom ) {
					position.top += myOffset + atOffset + offset;
				}
			}
		}
	},
	flipfit: {
		left: function() {
			$.ui.position.flip.left.apply( this, arguments );
			$.ui.position.fit.left.apply( this, arguments );
		},
		top: function() {
			$.ui.position.flip.top.apply( this, arguments );
			$.ui.position.fit.top.apply( this, arguments );
		}
	}
};

// fraction support test
(function() {
	var testElement, testElementParent, testElementStyle, offsetLeft, i,
		body = document.getElementsByTagName( "body" )[ 0 ],
		div = document.createElement( "div" );

	//Create a "fake body" for testing based on method used in jQuery.support
	testElement = document.createElement( body ? "div" : "body" );
	testElementStyle = {
		visibility: "hidden",
		width: 0,
		height: 0,
		border: 0,
		margin: 0,
		background: "none"
	};
	if ( body ) {
		$.extend( testElementStyle, {
			position: "absolute",
			left: "-1000px",
			top: "-1000px"
		});
	}
	for ( i in testElementStyle ) {
		testElement.style[ i ] = testElementStyle[ i ];
	}
	testElement.appendChild( div );
	testElementParent = body || document.documentElement;
	testElementParent.insertBefore( testElement, testElementParent.firstChild );

	div.style.cssText = "position: absolute; left: 10.7432222px;";

	offsetLeft = $( div ).offset().left;
	supportsOffsetFractions = offsetLeft > 10 && offsetLeft < 11;

	testElement.innerHTML = "";
	testElementParent.removeChild( testElement );
})();

})();

var position = $.ui.position;


/*!
 * jQuery UI Accordion 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/accordion/
 */


var accordion = $.widget( "ui.accordion", {
	version: "1.11.4",
	options: {
		active: 0,
		animate: {},
		collapsible: false,
		event: "click",
		header: "> li > :first-child,> :not(li):even",
		heightStyle: "auto",
		icons: {
			activeHeader: "ui-icon-triangle-1-s",
			header: "ui-icon-triangle-1-e"
		},

		// callbacks
		activate: null,
		beforeActivate: null
	},

	hideProps: {
		borderTopWidth: "hide",
		borderBottomWidth: "hide",
		paddingTop: "hide",
		paddingBottom: "hide",
		height: "hide"
	},

	showProps: {
		borderTopWidth: "show",
		borderBottomWidth: "show",
		paddingTop: "show",
		paddingBottom: "show",
		height: "show"
	},

	_create: function() {
		var options = this.options;
		this.prevShow = this.prevHide = $();
		this.element.addClass( "ui-accordion ui-widget ui-helper-reset" )
			// ARIA
			.attr( "role", "tablist" );

		// don't allow collapsible: false and active: false / null
		if ( !options.collapsible && (options.active === false || options.active == null) ) {
			options.active = 0;
		}

		this._processPanels();
		// handle negative values
		if ( options.active < 0 ) {
			options.active += this.headers.length;
		}
		this._refresh();
	},

	_getCreateEventData: function() {
		return {
			header: this.active,
			panel: !this.active.length ? $() : this.active.next()
		};
	},

	_createIcons: function() {
		var icons = this.options.icons;
		if ( icons ) {
			$( "<span>" )
				.addClass( "ui-accordion-header-icon ui-icon " + icons.header )
				.prependTo( this.headers );
			this.active.children( ".ui-accordion-header-icon" )
				.removeClass( icons.header )
				.addClass( icons.activeHeader );
			this.headers.addClass( "ui-accordion-icons" );
		}
	},

	_destroyIcons: function() {
		this.headers
			.removeClass( "ui-accordion-icons" )
			.children( ".ui-accordion-header-icon" )
				.remove();
	},

	_destroy: function() {
		var contents;

		// clean up main element
		this.element
			.removeClass( "ui-accordion ui-widget ui-helper-reset" )
			.removeAttr( "role" );

		// clean up headers
		this.headers
			.removeClass( "ui-accordion-header ui-accordion-header-active ui-state-default " +
				"ui-corner-all ui-state-active ui-state-disabled ui-corner-top" )
			.removeAttr( "role" )
			.removeAttr( "aria-expanded" )
			.removeAttr( "aria-selected" )
			.removeAttr( "aria-controls" )
			.removeAttr( "tabIndex" )
			.removeUniqueId();

		this._destroyIcons();

		// clean up content panels
		contents = this.headers.next()
			.removeClass( "ui-helper-reset ui-widget-content ui-corner-bottom " +
				"ui-accordion-content ui-accordion-content-active ui-state-disabled" )
			.css( "display", "" )
			.removeAttr( "role" )
			.removeAttr( "aria-hidden" )
			.removeAttr( "aria-labelledby" )
			.removeUniqueId();

		if ( this.options.heightStyle !== "content" ) {
			contents.css( "height", "" );
		}
	},

	_setOption: function( key, value ) {
		if ( key === "active" ) {
			// _activate() will handle invalid values and update this.options
			this._activate( value );
			return;
		}

		if ( key === "event" ) {
			if ( this.options.event ) {
				this._off( this.headers, this.options.event );
			}
			this._setupEvents( value );
		}

		this._super( key, value );

		// setting collapsible: false while collapsed; open first panel
		if ( key === "collapsible" && !value && this.options.active === false ) {
			this._activate( 0 );
		}

		if ( key === "icons" ) {
			this._destroyIcons();
			if ( value ) {
				this._createIcons();
			}
		}

		// #5332 - opacity doesn't cascade to positioned elements in IE
		// so we need to add the disabled class to the headers and panels
		if ( key === "disabled" ) {
			this.element
				.toggleClass( "ui-state-disabled", !!value )
				.attr( "aria-disabled", value );
			this.headers.add( this.headers.next() )
				.toggleClass( "ui-state-disabled", !!value );
		}
	},

	_keydown: function( event ) {
		if ( event.altKey || event.ctrlKey ) {
			return;
		}

		var keyCode = $.ui.keyCode,
			length = this.headers.length,
			currentIndex = this.headers.index( event.target ),
			toFocus = false;

		switch ( event.keyCode ) {
			case keyCode.RIGHT:
			case keyCode.DOWN:
				toFocus = this.headers[ ( currentIndex + 1 ) % length ];
				break;
			case keyCode.LEFT:
			case keyCode.UP:
				toFocus = this.headers[ ( currentIndex - 1 + length ) % length ];
				break;
			case keyCode.SPACE:
			case keyCode.ENTER:
				this._eventHandler( event );
				break;
			case keyCode.HOME:
				toFocus = this.headers[ 0 ];
				break;
			case keyCode.END:
				toFocus = this.headers[ length - 1 ];
				break;
		}

		if ( toFocus ) {
			$( event.target ).attr( "tabIndex", -1 );
			$( toFocus ).attr( "tabIndex", 0 );
			toFocus.focus();
			event.preventDefault();
		}
	},

	_panelKeyDown: function( event ) {
		if ( event.keyCode === $.ui.keyCode.UP && event.ctrlKey ) {
			$( event.currentTarget ).prev().focus();
		}
	},

	refresh: function() {
		var options = this.options;
		this._processPanels();

		// was collapsed or no panel
		if ( ( options.active === false && options.collapsible === true ) || !this.headers.length ) {
			options.active = false;
			this.active = $();
		// active false only when collapsible is true
		} else if ( options.active === false ) {
			this._activate( 0 );
		// was active, but active panel is gone
		} else if ( this.active.length && !$.contains( this.element[ 0 ], this.active[ 0 ] ) ) {
			// all remaining panel are disabled
			if ( this.headers.length === this.headers.find(".ui-state-disabled").length ) {
				options.active = false;
				this.active = $();
			// activate previous panel
			} else {
				this._activate( Math.max( 0, options.active - 1 ) );
			}
		// was active, active panel still exists
		} else {
			// make sure active index is correct
			options.active = this.headers.index( this.active );
		}

		this._destroyIcons();

		this._refresh();
	},

	_processPanels: function() {
		var prevHeaders = this.headers,
			prevPanels = this.panels;

		this.headers = this.element.find( this.options.header )
			.addClass( "ui-accordion-header ui-state-default ui-corner-all" );

		this.panels = this.headers.next()
			.addClass( "ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom" )
			.filter( ":not(.ui-accordion-content-active)" )
			.hide();

		// Avoid memory leaks (#10056)
		if ( prevPanels ) {
			this._off( prevHeaders.not( this.headers ) );
			this._off( prevPanels.not( this.panels ) );
		}
	},

	_refresh: function() {
		var maxHeight,
			options = this.options,
			heightStyle = options.heightStyle,
			parent = this.element.parent();

		this.active = this._findActive( options.active )
			.addClass( "ui-accordion-header-active ui-state-active ui-corner-top" )
			.removeClass( "ui-corner-all" );
		this.active.next()
			.addClass( "ui-accordion-content-active" )
			.show();

		this.headers
			.attr( "role", "tab" )
			.each(function() {
				var header = $( this ),
					headerId = header.uniqueId().attr( "id" ),
					panel = header.next(),
					panelId = panel.uniqueId().attr( "id" );
				header.attr( "aria-controls", panelId );
				panel.attr( "aria-labelledby", headerId );
			})
			.next()
				.attr( "role", "tabpanel" );

		this.headers
			.not( this.active )
			.attr({
				"aria-selected": "false",
				"aria-expanded": "false",
				tabIndex: -1
			})
			.next()
				.attr({
					"aria-hidden": "true"
				})
				.hide();

		// make sure at least one header is in the tab order
		if ( !this.active.length ) {
			this.headers.eq( 0 ).attr( "tabIndex", 0 );
		} else {
			this.active.attr({
				"aria-selected": "true",
				"aria-expanded": "true",
				tabIndex: 0
			})
			.next()
				.attr({
					"aria-hidden": "false"
				});
		}

		this._createIcons();

		this._setupEvents( options.event );

		if ( heightStyle === "fill" ) {
			maxHeight = parent.height();
			this.element.siblings( ":visible" ).each(function() {
				var elem = $( this ),
					position = elem.css( "position" );

				if ( position === "absolute" || position === "fixed" ) {
					return;
				}
				maxHeight -= elem.outerHeight( true );
			});

			this.headers.each(function() {
				maxHeight -= $( this ).outerHeight( true );
			});

			this.headers.next()
				.each(function() {
					$( this ).height( Math.max( 0, maxHeight -
						$( this ).innerHeight() + $( this ).height() ) );
				})
				.css( "overflow", "auto" );
		} else if ( heightStyle === "auto" ) {
			maxHeight = 0;
			this.headers.next()
				.each(function() {
					maxHeight = Math.max( maxHeight, $( this ).css( "height", "" ).height() );
				})
				.height( maxHeight );
		}
	},

	_activate: function( index ) {
		var active = this._findActive( index )[ 0 ];

		// trying to activate the already active panel
		if ( active === this.active[ 0 ] ) {
			return;
		}

		// trying to collapse, simulate a click on the currently active header
		active = active || this.active[ 0 ];

		this._eventHandler({
			target: active,
			currentTarget: active,
			preventDefault: $.noop
		});
	},

	_findActive: function( selector ) {
		return typeof selector === "number" ? this.headers.eq( selector ) : $();
	},

	_setupEvents: function( event ) {
		var events = {
			keydown: "_keydown"
		};
		if ( event ) {
			$.each( event.split( " " ), function( index, eventName ) {
				events[ eventName ] = "_eventHandler";
			});
		}

		this._off( this.headers.add( this.headers.next() ) );
		this._on( this.headers, events );
		this._on( this.headers.next(), { keydown: "_panelKeyDown" });
		this._hoverable( this.headers );
		this._focusable( this.headers );
	},

	_eventHandler: function( event ) {
		var options = this.options,
			active = this.active,
			clicked = $( event.currentTarget ),
			clickedIsActive = clicked[ 0 ] === active[ 0 ],
			collapsing = clickedIsActive && options.collapsible,
			toShow = collapsing ? $() : clicked.next(),
			toHide = active.next(),
			eventData = {
				oldHeader: active,
				oldPanel: toHide,
				newHeader: collapsing ? $() : clicked,
				newPanel: toShow
			};

		event.preventDefault();

		if (
				// click on active header, but not collapsible
				( clickedIsActive && !options.collapsible ) ||
				// allow canceling activation
				( this._trigger( "beforeActivate", event, eventData ) === false ) ) {
			return;
		}

		options.active = collapsing ? false : this.headers.index( clicked );

		// when the call to ._toggle() comes after the class changes
		// it causes a very odd bug in IE 8 (see #6720)
		this.active = clickedIsActive ? $() : clicked;
		this._toggle( eventData );

		// switch classes
		// corner classes on the previously active header stay after the animation
		active.removeClass( "ui-accordion-header-active ui-state-active" );
		if ( options.icons ) {
			active.children( ".ui-accordion-header-icon" )
				.removeClass( options.icons.activeHeader )
				.addClass( options.icons.header );
		}

		if ( !clickedIsActive ) {
			clicked
				.removeClass( "ui-corner-all" )
				.addClass( "ui-accordion-header-active ui-state-active ui-corner-top" );
			if ( options.icons ) {
				clicked.children( ".ui-accordion-header-icon" )
					.removeClass( options.icons.header )
					.addClass( options.icons.activeHeader );
			}

			clicked
				.next()
				.addClass( "ui-accordion-content-active" );
		}
	},

	_toggle: function( data ) {
		var toShow = data.newPanel,
			toHide = this.prevShow.length ? this.prevShow : data.oldPanel;

		// handle activating a panel during the animation for another activation
		this.prevShow.add( this.prevHide ).stop( true, true );
		this.prevShow = toShow;
		this.prevHide = toHide;

		if ( this.options.animate ) {
			this._animate( toShow, toHide, data );
		} else {
			toHide.hide();
			toShow.show();
			this._toggleComplete( data );
		}

		toHide.attr({
			"aria-hidden": "true"
		});
		toHide.prev().attr({
			"aria-selected": "false",
			"aria-expanded": "false"
		});
		// if we're switching panels, remove the old header from the tab order
		// if we're opening from collapsed state, remove the previous header from the tab order
		// if we're collapsing, then keep the collapsing header in the tab order
		if ( toShow.length && toHide.length ) {
			toHide.prev().attr({
				"tabIndex": -1,
				"aria-expanded": "false"
			});
		} else if ( toShow.length ) {
			this.headers.filter(function() {
				return parseInt( $( this ).attr( "tabIndex" ), 10 ) === 0;
			})
			.attr( "tabIndex", -1 );
		}

		toShow
			.attr( "aria-hidden", "false" )
			.prev()
				.attr({
					"aria-selected": "true",
					"aria-expanded": "true",
					tabIndex: 0
				});
	},

	_animate: function( toShow, toHide, data ) {
		var total, easing, duration,
			that = this,
			adjust = 0,
			boxSizing = toShow.css( "box-sizing" ),
			down = toShow.length &&
				( !toHide.length || ( toShow.index() < toHide.index() ) ),
			animate = this.options.animate || {},
			options = down && animate.down || animate,
			complete = function() {
				that._toggleComplete( data );
			};

		if ( typeof options === "number" ) {
			duration = options;
		}
		if ( typeof options === "string" ) {
			easing = options;
		}
		// fall back from options to animation in case of partial down settings
		easing = easing || options.easing || animate.easing;
		duration = duration || options.duration || animate.duration;

		if ( !toHide.length ) {
			return toShow.animate( this.showProps, duration, easing, complete );
		}
		if ( !toShow.length ) {
			return toHide.animate( this.hideProps, duration, easing, complete );
		}

		total = toShow.show().outerHeight();
		toHide.animate( this.hideProps, {
			duration: duration,
			easing: easing,
			step: function( now, fx ) {
				fx.now = Math.round( now );
			}
		});
		toShow
			.hide()
			.animate( this.showProps, {
				duration: duration,
				easing: easing,
				complete: complete,
				step: function( now, fx ) {
					fx.now = Math.round( now );
					if ( fx.prop !== "height" ) {
						if ( boxSizing === "content-box" ) {
							adjust += fx.now;
						}
					} else if ( that.options.heightStyle !== "content" ) {
						fx.now = Math.round( total - toHide.outerHeight() - adjust );
						adjust = 0;
					}
				}
			});
	},

	_toggleComplete: function( data ) {
		var toHide = data.oldPanel;

		toHide
			.removeClass( "ui-accordion-content-active" )
			.prev()
				.removeClass( "ui-corner-top" )
				.addClass( "ui-corner-all" );

		// Work around for rendering bug in IE (#5421)
		if ( toHide.length ) {
			toHide.parent()[ 0 ].className = toHide.parent()[ 0 ].className;
		}
		this._trigger( "activate", null, data );
	}
});


/*!
 * jQuery UI Menu 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/menu/
 */


var menu = $.widget( "ui.menu", {
	version: "1.11.4",
	defaultElement: "<ul>",
	delay: 300,
	options: {
		icons: {
			submenu: "ui-icon-carat-1-e"
		},
		items: "> *",
		menus: "ul",
		position: {
			my: "left-1 top",
			at: "right top"
		},
		role: "menu",

		// callbacks
		blur: null,
		focus: null,
		select: null
	},

	_create: function() {
		this.activeMenu = this.element;

		// Flag used to prevent firing of the click handler
		// as the event bubbles up through nested menus
		this.mouseHandled = false;
		this.element
			.uniqueId()
			.addClass( "ui-menu ui-widget ui-widget-content" )
			.toggleClass( "ui-menu-icons", !!this.element.find( ".ui-icon" ).length )
			.attr({
				role: this.options.role,
				tabIndex: 0
			});

		if ( this.options.disabled ) {
			this.element
				.addClass( "ui-state-disabled" )
				.attr( "aria-disabled", "true" );
		}

		this._on({
			// Prevent focus from sticking to links inside menu after clicking
			// them (focus should always stay on UL during navigation).
			"mousedown .ui-menu-item": function( event ) {
				event.preventDefault();
			},
			"click .ui-menu-item": function( event ) {
				var target = $( event.target );
				if ( !this.mouseHandled && target.not( ".ui-state-disabled" ).length ) {
					this.select( event );

					// Only set the mouseHandled flag if the event will bubble, see #9469.
					if ( !event.isPropagationStopped() ) {
						this.mouseHandled = true;
					}

					// Open submenu on click
					if ( target.has( ".ui-menu" ).length ) {
						this.expand( event );
					} else if ( !this.element.is( ":focus" ) && $( this.document[ 0 ].activeElement ).closest( ".ui-menu" ).length ) {

						// Redirect focus to the menu
						this.element.trigger( "focus", [ true ] );

						// If the active item is on the top level, let it stay active.
						// Otherwise, blur the active item since it is no longer visible.
						if ( this.active && this.active.parents( ".ui-menu" ).length === 1 ) {
							clearTimeout( this.timer );
						}
					}
				}
			},
			"mouseenter .ui-menu-item": function( event ) {
				// Ignore mouse events while typeahead is active, see #10458.
				// Prevents focusing the wrong item when typeahead causes a scroll while the mouse
				// is over an item in the menu
				if ( this.previousFilter ) {
					return;
				}
				var target = $( event.currentTarget );
				// Remove ui-state-active class from siblings of the newly focused menu item
				// to avoid a jump caused by adjacent elements both having a class with a border
				target.siblings( ".ui-state-active" ).removeClass( "ui-state-active" );
				this.focus( event, target );
			},
			mouseleave: "collapseAll",
			"mouseleave .ui-menu": "collapseAll",
			focus: function( event, keepActiveItem ) {
				// If there's already an active item, keep it active
				// If not, activate the first item
				var item = this.active || this.element.find( this.options.items ).eq( 0 );

				if ( !keepActiveItem ) {
					this.focus( event, item );
				}
			},
			blur: function( event ) {
				this._delay(function() {
					if ( !$.contains( this.element[0], this.document[0].activeElement ) ) {
						this.collapseAll( event );
					}
				});
			},
			keydown: "_keydown"
		});

		this.refresh();

		// Clicks outside of a menu collapse any open menus
		this._on( this.document, {
			click: function( event ) {
				if ( this._closeOnDocumentClick( event ) ) {
					this.collapseAll( event );
				}

				// Reset the mouseHandled flag
				this.mouseHandled = false;
			}
		});
	},

	_destroy: function() {
		// Destroy (sub)menus
		this.element
			.removeAttr( "aria-activedescendant" )
			.find( ".ui-menu" ).addBack()
				.removeClass( "ui-menu ui-widget ui-widget-content ui-menu-icons ui-front" )
				.removeAttr( "role" )
				.removeAttr( "tabIndex" )
				.removeAttr( "aria-labelledby" )
				.removeAttr( "aria-expanded" )
				.removeAttr( "aria-hidden" )
				.removeAttr( "aria-disabled" )
				.removeUniqueId()
				.show();

		// Destroy menu items
		this.element.find( ".ui-menu-item" )
			.removeClass( "ui-menu-item" )
			.removeAttr( "role" )
			.removeAttr( "aria-disabled" )
			.removeUniqueId()
			.removeClass( "ui-state-hover" )
			.removeAttr( "tabIndex" )
			.removeAttr( "role" )
			.removeAttr( "aria-haspopup" )
			.children().each( function() {
				var elem = $( this );
				if ( elem.data( "ui-menu-submenu-carat" ) ) {
					elem.remove();
				}
			});

		// Destroy menu dividers
		this.element.find( ".ui-menu-divider" ).removeClass( "ui-menu-divider ui-widget-content" );
	},

	_keydown: function( event ) {
		var match, prev, character, skip,
			preventDefault = true;

		switch ( event.keyCode ) {
		case $.ui.keyCode.PAGE_UP:
			this.previousPage( event );
			break;
		case $.ui.keyCode.PAGE_DOWN:
			this.nextPage( event );
			break;
		case $.ui.keyCode.HOME:
			this._move( "first", "first", event );
			break;
		case $.ui.keyCode.END:
			this._move( "last", "last", event );
			break;
		case $.ui.keyCode.UP:
			this.previous( event );
			break;
		case $.ui.keyCode.DOWN:
			this.next( event );
			break;
		case $.ui.keyCode.LEFT:
			this.collapse( event );
			break;
		case $.ui.keyCode.RIGHT:
			if ( this.active && !this.active.is( ".ui-state-disabled" ) ) {
				this.expand( event );
			}
			break;
		case $.ui.keyCode.ENTER:
		case $.ui.keyCode.SPACE:
			this._activate( event );
			break;
		case $.ui.keyCode.ESCAPE:
			this.collapse( event );
			break;
		default:
			preventDefault = false;
			prev = this.previousFilter || "";
			character = String.fromCharCode( event.keyCode );
			skip = false;

			clearTimeout( this.filterTimer );

			if ( character === prev ) {
				skip = true;
			} else {
				character = prev + character;
			}

			match = this._filterMenuItems( character );
			match = skip && match.index( this.active.next() ) !== -1 ?
				this.active.nextAll( ".ui-menu-item" ) :
				match;

			// If no matches on the current filter, reset to the last character pressed
			// to move down the menu to the first item that starts with that character
			if ( !match.length ) {
				character = String.fromCharCode( event.keyCode );
				match = this._filterMenuItems( character );
			}

			if ( match.length ) {
				this.focus( event, match );
				this.previousFilter = character;
				this.filterTimer = this._delay(function() {
					delete this.previousFilter;
				}, 1000 );
			} else {
				delete this.previousFilter;
			}
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	},

	_activate: function( event ) {
		if ( !this.active.is( ".ui-state-disabled" ) ) {
			if ( this.active.is( "[aria-haspopup='true']" ) ) {
				this.expand( event );
			} else {
				this.select( event );
			}
		}
	},

	refresh: function() {
		var menus, items,
			that = this,
			icon = this.options.icons.submenu,
			submenus = this.element.find( this.options.menus );

		this.element.toggleClass( "ui-menu-icons", !!this.element.find( ".ui-icon" ).length );

		// Initialize nested menus
		submenus.filter( ":not(.ui-menu)" )
			.addClass( "ui-menu ui-widget ui-widget-content ui-front" )
			.hide()
			.attr({
				role: this.options.role,
				"aria-hidden": "true",
				"aria-expanded": "false"
			})
			.each(function() {
				var menu = $( this ),
					item = menu.parent(),
					submenuCarat = $( "<span>" )
						.addClass( "ui-menu-icon ui-icon " + icon )
						.data( "ui-menu-submenu-carat", true );

				item
					.attr( "aria-haspopup", "true" )
					.prepend( submenuCarat );
				menu.attr( "aria-labelledby", item.attr( "id" ) );
			});

		menus = submenus.add( this.element );
		items = menus.find( this.options.items );

		// Initialize menu-items containing spaces and/or dashes only as dividers
		items.not( ".ui-menu-item" ).each(function() {
			var item = $( this );
			if ( that._isDivider( item ) ) {
				item.addClass( "ui-widget-content ui-menu-divider" );
			}
		});

		// Don't refresh list items that are already adapted
		items.not( ".ui-menu-item, .ui-menu-divider" )
			.addClass( "ui-menu-item" )
			.uniqueId()
			.attr({
				tabIndex: -1,
				role: this._itemRole()
			});

		// Add aria-disabled attribute to any disabled menu item
		items.filter( ".ui-state-disabled" ).attr( "aria-disabled", "true" );

		// If the active item has been removed, blur the menu
		if ( this.active && !$.contains( this.element[ 0 ], this.active[ 0 ] ) ) {
			this.blur();
		}
	},

	_itemRole: function() {
		return {
			menu: "menuitem",
			listbox: "option"
		}[ this.options.role ];
	},

	_setOption: function( key, value ) {
		if ( key === "icons" ) {
			this.element.find( ".ui-menu-icon" )
				.removeClass( this.options.icons.submenu )
				.addClass( value.submenu );
		}
		if ( key === "disabled" ) {
			this.element
				.toggleClass( "ui-state-disabled", !!value )
				.attr( "aria-disabled", value );
		}
		this._super( key, value );
	},

	focus: function( event, item ) {
		var nested, focused;
		this.blur( event, event && event.type === "focus" );

		this._scrollIntoView( item );

		this.active = item.first();
		focused = this.active.addClass( "ui-state-focus" ).removeClass( "ui-state-active" );
		// Only update aria-activedescendant if there's a role
		// otherwise we assume focus is managed elsewhere
		if ( this.options.role ) {
			this.element.attr( "aria-activedescendant", focused.attr( "id" ) );
		}

		// Highlight active parent menu item, if any
		this.active
			.parent()
			.closest( ".ui-menu-item" )
			.addClass( "ui-state-active" );

		if ( event && event.type === "keydown" ) {
			this._close();
		} else {
			this.timer = this._delay(function() {
				this._close();
			}, this.delay );
		}

		nested = item.children( ".ui-menu" );
		if ( nested.length && event && ( /^mouse/.test( event.type ) ) ) {
			this._startOpening(nested);
		}
		this.activeMenu = item.parent();

		this._trigger( "focus", event, { item: item } );
	},

	_scrollIntoView: function( item ) {
		var borderTop, paddingTop, offset, scroll, elementHeight, itemHeight;
		if ( this._hasScroll() ) {
			borderTop = parseFloat( $.css( this.activeMenu[0], "borderTopWidth" ) ) || 0;
			paddingTop = parseFloat( $.css( this.activeMenu[0], "paddingTop" ) ) || 0;
			offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop;
			scroll = this.activeMenu.scrollTop();
			elementHeight = this.activeMenu.height();
			itemHeight = item.outerHeight();

			if ( offset < 0 ) {
				this.activeMenu.scrollTop( scroll + offset );
			} else if ( offset + itemHeight > elementHeight ) {
				this.activeMenu.scrollTop( scroll + offset - elementHeight + itemHeight );
			}
		}
	},

	blur: function( event, fromFocus ) {
		if ( !fromFocus ) {
			clearTimeout( this.timer );
		}

		if ( !this.active ) {
			return;
		}

		this.active.removeClass( "ui-state-focus" );
		this.active = null;

		this._trigger( "blur", event, { item: this.active } );
	},

	_startOpening: function( submenu ) {
		clearTimeout( this.timer );

		// Don't open if already open fixes a Firefox bug that caused a .5 pixel
		// shift in the submenu position when mousing over the carat icon
		if ( submenu.attr( "aria-hidden" ) !== "true" ) {
			return;
		}

		this.timer = this._delay(function() {
			this._close();
			this._open( submenu );
		}, this.delay );
	},

	_open: function( submenu ) {
		var position = $.extend({
			of: this.active
		}, this.options.position );

		clearTimeout( this.timer );
		this.element.find( ".ui-menu" ).not( submenu.parents( ".ui-menu" ) )
			.hide()
			.attr( "aria-hidden", "true" );

		submenu
			.show()
			.removeAttr( "aria-hidden" )
			.attr( "aria-expanded", "true" )
			.position( position );
	},

	collapseAll: function( event, all ) {
		clearTimeout( this.timer );
		this.timer = this._delay(function() {
			// If we were passed an event, look for the submenu that contains the event
			var currentMenu = all ? this.element :
				$( event && event.target ).closest( this.element.find( ".ui-menu" ) );

			// If we found no valid submenu ancestor, use the main menu to close all sub menus anyway
			if ( !currentMenu.length ) {
				currentMenu = this.element;
			}

			this._close( currentMenu );

			this.blur( event );
			this.activeMenu = currentMenu;
		}, this.delay );
	},

	// With no arguments, closes the currently active menu - if nothing is active
	// it closes all menus.  If passed an argument, it will search for menus BELOW
	_close: function( startMenu ) {
		if ( !startMenu ) {
			startMenu = this.active ? this.active.parent() : this.element;
		}

		startMenu
			.find( ".ui-menu" )
				.hide()
				.attr( "aria-hidden", "true" )
				.attr( "aria-expanded", "false" )
			.end()
			.find( ".ui-state-active" ).not( ".ui-state-focus" )
				.removeClass( "ui-state-active" );
	},

	_closeOnDocumentClick: function( event ) {
		return !$( event.target ).closest( ".ui-menu" ).length;
	},

	_isDivider: function( item ) {

		// Match hyphen, em dash, en dash
		return !/[^\-\u2014\u2013\s]/.test( item.text() );
	},

	collapse: function( event ) {
		var newItem = this.active &&
			this.active.parent().closest( ".ui-menu-item", this.element );
		if ( newItem && newItem.length ) {
			this._close();
			this.focus( event, newItem );
		}
	},

	expand: function( event ) {
		var newItem = this.active &&
			this.active
				.children( ".ui-menu " )
				.find( this.options.items )
				.first();

		if ( newItem && newItem.length ) {
			this._open( newItem.parent() );

			// Delay so Firefox will not hide activedescendant change in expanding submenu from AT
			this._delay(function() {
				this.focus( event, newItem );
			});
		}
	},

	next: function( event ) {
		this._move( "next", "first", event );
	},

	previous: function( event ) {
		this._move( "prev", "last", event );
	},

	isFirstItem: function() {
		return this.active && !this.active.prevAll( ".ui-menu-item" ).length;
	},

	isLastItem: function() {
		return this.active && !this.active.nextAll( ".ui-menu-item" ).length;
	},

	_move: function( direction, filter, event ) {
		var next;
		if ( this.active ) {
			if ( direction === "first" || direction === "last" ) {
				next = this.active
					[ direction === "first" ? "prevAll" : "nextAll" ]( ".ui-menu-item" )
					.eq( -1 );
			} else {
				next = this.active
					[ direction + "All" ]( ".ui-menu-item" )
					.eq( 0 );
			}
		}
		if ( !next || !next.length || !this.active ) {
			next = this.activeMenu.find( this.options.items )[ filter ]();
		}

		this.focus( event, next );
	},

	nextPage: function( event ) {
		var item, base, height;

		if ( !this.active ) {
			this.next( event );
			return;
		}
		if ( this.isLastItem() ) {
			return;
		}
		if ( this._hasScroll() ) {
			base = this.active.offset().top;
			height = this.element.height();
			this.active.nextAll( ".ui-menu-item" ).each(function() {
				item = $( this );
				return item.offset().top - base - height < 0;
			});

			this.focus( event, item );
		} else {
			this.focus( event, this.activeMenu.find( this.options.items )
				[ !this.active ? "first" : "last" ]() );
		}
	},

	previousPage: function( event ) {
		var item, base, height;
		if ( !this.active ) {
			this.next( event );
			return;
		}
		if ( this.isFirstItem() ) {
			return;
		}
		if ( this._hasScroll() ) {
			base = this.active.offset().top;
			height = this.element.height();
			this.active.prevAll( ".ui-menu-item" ).each(function() {
				item = $( this );
				return item.offset().top - base + height > 0;
			});

			this.focus( event, item );
		} else {
			this.focus( event, this.activeMenu.find( this.options.items ).first() );
		}
	},

	_hasScroll: function() {
		return this.element.outerHeight() < this.element.prop( "scrollHeight" );
	},

	select: function( event ) {
		// TODO: It should never be possible to not have an active item at this
		// point, but the tests don't trigger mouseenter before click.
		this.active = this.active || $( event.target ).closest( ".ui-menu-item" );
		var ui = { item: this.active };
		if ( !this.active.has( ".ui-menu" ).length ) {
			this.collapseAll( event, true );
		}
		this._trigger( "select", event, ui );
	},

	_filterMenuItems: function(character) {
		var escapedCharacter = character.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" ),
			regex = new RegExp( "^" + escapedCharacter, "i" );

		return this.activeMenu
			.find( this.options.items )

			// Only match on items, not dividers or other content (#10571)
			.filter( ".ui-menu-item" )
			.filter(function() {
				return regex.test( $.trim( $( this ).text() ) );
			});
	}
});


/*!
 * jQuery UI Autocomplete 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/autocomplete/
 */


$.widget( "ui.autocomplete", {
	version: "1.11.4",
	defaultElement: "<input>",
	options: {
		appendTo: null,
		autoFocus: false,
		delay: 300,
		minLength: 1,
		position: {
			my: "left top",
			at: "left bottom",
			collision: "none"
		},
		source: null,

		// callbacks
		change: null,
		close: null,
		focus: null,
		open: null,
		response: null,
		search: null,
		select: null
	},

	requestIndex: 0,
	pending: 0,

	_create: function() {
		// Some browsers only repeat keydown events, not keypress events,
		// so we use the suppressKeyPress flag to determine if we've already
		// handled the keydown event. #7269
		// Unfortunately the code for & in keypress is the same as the up arrow,
		// so we use the suppressKeyPressRepeat flag to avoid handling keypress
		// events when we know the keydown event was used to modify the
		// search term. #7799
		var suppressKeyPress, suppressKeyPressRepeat, suppressInput,
			nodeName = this.element[ 0 ].nodeName.toLowerCase(),
			isTextarea = nodeName === "textarea",
			isInput = nodeName === "input";

		this.isMultiLine =
			// Textareas are always multi-line
			isTextarea ? true :
			// Inputs are always single-line, even if inside a contentEditable element
			// IE also treats inputs as contentEditable
			isInput ? false :
			// All other element types are determined by whether or not they're contentEditable
			this.element.prop( "isContentEditable" );

		this.valueMethod = this.element[ isTextarea || isInput ? "val" : "text" ];
		this.isNewMenu = true;

		this.element
			.addClass( "ui-autocomplete-input" )
			.attr( "autocomplete", "off" );

		this._on( this.element, {
			keydown: function( event ) {
				if ( this.element.prop( "readOnly" ) ) {
					suppressKeyPress = true;
					suppressInput = true;
					suppressKeyPressRepeat = true;
					return;
				}

				suppressKeyPress = false;
				suppressInput = false;
				suppressKeyPressRepeat = false;
				var keyCode = $.ui.keyCode;
				switch ( event.keyCode ) {
				case keyCode.PAGE_UP:
					suppressKeyPress = true;
					this._move( "previousPage", event );
					break;
				case keyCode.PAGE_DOWN:
					suppressKeyPress = true;
					this._move( "nextPage", event );
					break;
				case keyCode.UP:
					suppressKeyPress = true;
					this._keyEvent( "previous", event );
					break;
				case keyCode.DOWN:
					suppressKeyPress = true;
					this._keyEvent( "next", event );
					break;
				case keyCode.ENTER:
					// when menu is open and has focus
					if ( this.menu.active ) {
						// #6055 - Opera still allows the keypress to occur
						// which causes forms to submit
						suppressKeyPress = true;
						event.preventDefault();
						this.menu.select( event );
					}
					break;
				case keyCode.TAB:
					if ( this.menu.active ) {
						this.menu.select( event );
					}
					break;
				case keyCode.ESCAPE:
					if ( this.menu.element.is( ":visible" ) ) {
						if ( !this.isMultiLine ) {
							this._value( this.term );
						}
						this.close( event );
						// Different browsers have different default behavior for escape
						// Single press can mean undo or clear
						// Double press in IE means clear the whole form
						event.preventDefault();
					}
					break;
				default:
					suppressKeyPressRepeat = true;
					// search timeout should be triggered before the input value is changed
					this._searchTimeout( event );
					break;
				}
			},
			keypress: function( event ) {
				if ( suppressKeyPress ) {
					suppressKeyPress = false;
					if ( !this.isMultiLine || this.menu.element.is( ":visible" ) ) {
						event.preventDefault();
					}
					return;
				}
				if ( suppressKeyPressRepeat ) {
					return;
				}

				// replicate some key handlers to allow them to repeat in Firefox and Opera
				var keyCode = $.ui.keyCode;
				switch ( event.keyCode ) {
				case keyCode.PAGE_UP:
					this._move( "previousPage", event );
					break;
				case keyCode.PAGE_DOWN:
					this._move( "nextPage", event );
					break;
				case keyCode.UP:
					this._keyEvent( "previous", event );
					break;
				case keyCode.DOWN:
					this._keyEvent( "next", event );
					break;
				}
			},
			input: function( event ) {
				if ( suppressInput ) {
					suppressInput = false;
					event.preventDefault();
					return;
				}
				this._searchTimeout( event );
			},
			focus: function() {
				this.selectedItem = null;
				this.previous = this._value();
			},
			blur: function( event ) {
				if ( this.cancelBlur ) {
					delete this.cancelBlur;
					return;
				}

				clearTimeout( this.searching );
				this.close( event );
				this._change( event );
			}
		});

		this._initSource();
		this.menu = $( "<ul>" )
			.addClass( "ui-autocomplete ui-front" )
			.appendTo( this._appendTo() )
			.menu({
				// disable ARIA support, the live region takes care of that
				role: null
			})
			.hide()
			.menu( "instance" );

		this._on( this.menu.element, {
			mousedown: function( event ) {
				// prevent moving focus out of the text field
				event.preventDefault();

				// IE doesn't prevent moving focus even with event.preventDefault()
				// so we set a flag to know when we should ignore the blur event
				this.cancelBlur = true;
				this._delay(function() {
					delete this.cancelBlur;
				});

				// clicking on the scrollbar causes focus to shift to the body
				// but we can't detect a mouseup or a click immediately afterward
				// so we have to track the next mousedown and close the menu if
				// the user clicks somewhere outside of the autocomplete
				var menuElement = this.menu.element[ 0 ];
				if ( !$( event.target ).closest( ".ui-menu-item" ).length ) {
					this._delay(function() {
						var that = this;
						this.document.one( "mousedown", function( event ) {
							if ( event.target !== that.element[ 0 ] &&
									event.target !== menuElement &&
									!$.contains( menuElement, event.target ) ) {
								that.close();
							}
						});
					});
				}
			},
			menufocus: function( event, ui ) {
				var label, item;
				// support: Firefox
				// Prevent accidental activation of menu items in Firefox (#7024 #9118)
				if ( this.isNewMenu ) {
					this.isNewMenu = false;
					if ( event.originalEvent && /^mouse/.test( event.originalEvent.type ) ) {
						this.menu.blur();

						this.document.one( "mousemove", function() {
							$( event.target ).trigger( event.originalEvent );
						});

						return;
					}
				}

				item = ui.item.data( "ui-autocomplete-item" );
				if ( false !== this._trigger( "focus", event, { item: item } ) ) {
					// use value to match what will end up in the input, if it was a key event
					if ( event.originalEvent && /^key/.test( event.originalEvent.type ) ) {
						this._value( item.value );
					}
				}

				// Announce the value in the liveRegion
				label = ui.item.attr( "aria-label" ) || item.value;
				if ( label && $.trim( label ).length ) {
					this.liveRegion.children().hide();
					$( "<div>" ).text( label ).appendTo( this.liveRegion );
				}
			},
			menuselect: function( event, ui ) {
				var item = ui.item.data( "ui-autocomplete-item" ),
					previous = this.previous;

				// only trigger when focus was lost (click on menu)
				if ( this.element[ 0 ] !== this.document[ 0 ].activeElement ) {
					this.element.focus();
					this.previous = previous;
					// #6109 - IE triggers two focus events and the second
					// is asynchronous, so we need to reset the previous
					// term synchronously and asynchronously :-(
					this._delay(function() {
						this.previous = previous;
						this.selectedItem = item;
					});
				}

				if ( false !== this._trigger( "select", event, { item: item } ) ) {
					this._value( item.value );
				}
				// reset the term after the select event
				// this allows custom select handling to work properly
				this.term = this._value();

				this.close( event );
				this.selectedItem = item;
			}
		});

		this.liveRegion = $( "<span>", {
				role: "status",
				"aria-live": "assertive",
				"aria-relevant": "additions"
			})
			.addClass( "ui-helper-hidden-accessible" )
			.appendTo( this.document[ 0 ].body );

		// turning off autocomplete prevents the browser from remembering the
		// value when navigating through history, so we re-enable autocomplete
		// if the page is unloaded before the widget is destroyed. #7790
		this._on( this.window, {
			beforeunload: function() {
				this.element.removeAttr( "autocomplete" );
			}
		});
	},

	_destroy: function() {
		clearTimeout( this.searching );
		this.element
			.removeClass( "ui-autocomplete-input" )
			.removeAttr( "autocomplete" );
		this.menu.element.remove();
		this.liveRegion.remove();
	},

	_setOption: function( key, value ) {
		this._super( key, value );
		if ( key === "source" ) {
			this._initSource();
		}
		if ( key === "appendTo" ) {
			this.menu.element.appendTo( this._appendTo() );
		}
		if ( key === "disabled" && value && this.xhr ) {
			this.xhr.abort();
		}
	},

	_appendTo: function() {
		var element = this.options.appendTo;

		if ( element ) {
			element = element.jquery || element.nodeType ?
				$( element ) :
				this.document.find( element ).eq( 0 );
		}

		if ( !element || !element[ 0 ] ) {
			element = this.element.closest( ".ui-front" );
		}

		if ( !element.length ) {
			element = this.document[ 0 ].body;
		}

		return element;
	},

	_initSource: function() {
		var array, url,
			that = this;
		if ( $.isArray( this.options.source ) ) {
			array = this.options.source;
			this.source = function( request, response ) {
				response( $.ui.autocomplete.filter( array, request.term ) );
			};
		} else if ( typeof this.options.source === "string" ) {
			url = this.options.source;
			this.source = function( request, response ) {
				if ( that.xhr ) {
					that.xhr.abort();
				}
				that.xhr = $.ajax({
					url: url,
					data: request,
					dataType: "json",
					success: function( data ) {
						response( data );
					},
					error: function() {
						response([]);
					}
				});
			};
		} else {
			this.source = this.options.source;
		}
	},

	_searchTimeout: function( event ) {
		clearTimeout( this.searching );
		this.searching = this._delay(function() {

			// Search if the value has changed, or if the user retypes the same value (see #7434)
			var equalValues = this.term === this._value(),
				menuVisible = this.menu.element.is( ":visible" ),
				modifierKey = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

			if ( !equalValues || ( equalValues && !menuVisible && !modifierKey ) ) {
				this.selectedItem = null;
				this.search( null, event );
			}
		}, this.options.delay );
	},

	search: function( value, event ) {
		value = value != null ? value : this._value();

		// always save the actual value, not the one passed as an argument
		this.term = this._value();

		if ( value.length < this.options.minLength ) {
			return this.close( event );
		}

		if ( this._trigger( "search", event ) === false ) {
			return;
		}

		return this._search( value );
	},

	_search: function( value ) {
		this.pending++;
		this.element.addClass( "ui-autocomplete-loading" );
		this.cancelSearch = false;

		this.source( { term: value }, this._response() );
	},

	_response: function() {
		var index = ++this.requestIndex;

		return $.proxy(function( content ) {
			if ( index === this.requestIndex ) {
				this.__response( content );
			}

			this.pending--;
			if ( !this.pending ) {
				this.element.removeClass( "ui-autocomplete-loading" );
			}
		}, this );
	},

	__response: function( content ) {
		if ( content ) {
			content = this._normalize( content );
		}
		this._trigger( "response", null, { content: content } );
		if ( !this.options.disabled && content && content.length && !this.cancelSearch ) {
			this._suggest( content );
			this._trigger( "open" );
		} else {
			// use ._close() instead of .close() so we don't cancel future searches
			this._close();
		}
	},

	close: function( event ) {
		this.cancelSearch = true;
		this._close( event );
	},

	_close: function( event ) {
		if ( this.menu.element.is( ":visible" ) ) {
			this.menu.element.hide();
			this.menu.blur();
			this.isNewMenu = true;
			this._trigger( "close", event );
		}
	},

	_change: function( event ) {
		if ( this.previous !== this._value() ) {
			this._trigger( "change", event, { item: this.selectedItem } );
		}
	},

	_normalize: function( items ) {
		// assume all items have the right format when the first item is complete
		if ( items.length && items[ 0 ].label && items[ 0 ].value ) {
			return items;
		}
		return $.map( items, function( item ) {
			if ( typeof item === "string" ) {
				return {
					label: item,
					value: item
				};
			}
			return $.extend( {}, item, {
				label: item.label || item.value,
				value: item.value || item.label
			});
		});
	},

	_suggest: function( items ) {
		var ul = this.menu.element.empty();
		this._renderMenu( ul, items );
		this.isNewMenu = true;
		this.menu.refresh();

		// size and position menu
		ul.show();
		this._resizeMenu();
		ul.position( $.extend({
			of: this.element
		}, this.options.position ) );

		if ( this.options.autoFocus ) {
			this.menu.next();
		}
	},

	_resizeMenu: function() {
		var ul = this.menu.element;
		ul.outerWidth( Math.max(
			// Firefox wraps long text (possibly a rounding bug)
			// so we add 1px to avoid the wrapping (#7513)
			ul.width( "" ).outerWidth() + 1,
			this.element.outerWidth()
		) );
	},

	_renderMenu: function( ul, items ) {
		var that = this;
		$.each( items, function( index, item ) {
			that._renderItemData( ul, item );
		});
	},

	_renderItemData: function( ul, item ) {
		return this._renderItem( ul, item ).data( "ui-autocomplete-item", item );
	},

	_renderItem: function( ul, item ) {
		return $( "<li>" ).text( item.label ).appendTo( ul );
	},

	_move: function( direction, event ) {
		if ( !this.menu.element.is( ":visible" ) ) {
			this.search( null, event );
			return;
		}
		if ( this.menu.isFirstItem() && /^previous/.test( direction ) ||
				this.menu.isLastItem() && /^next/.test( direction ) ) {

			if ( !this.isMultiLine ) {
				this._value( this.term );
			}

			this.menu.blur();
			return;
		}
		this.menu[ direction ]( event );
	},

	widget: function() {
		return this.menu.element;
	},

	_value: function() {
		return this.valueMethod.apply( this.element, arguments );
	},

	_keyEvent: function( keyEvent, event ) {
		if ( !this.isMultiLine || this.menu.element.is( ":visible" ) ) {
			this._move( keyEvent, event );

			// prevents moving cursor to beginning/end of the text field in some browsers
			event.preventDefault();
		}
	}
});

$.extend( $.ui.autocomplete, {
	escapeRegex: function( value ) {
		return value.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" );
	},
	filter: function( array, term ) {
		var matcher = new RegExp( $.ui.autocomplete.escapeRegex( term ), "i" );
		return $.grep( array, function( value ) {
			return matcher.test( value.label || value.value || value );
		});
	}
});

// live region extension, adding a `messages` option
// NOTE: This is an experimental API. We are still investigating
// a full solution for string manipulation and internationalization.
$.widget( "ui.autocomplete", $.ui.autocomplete, {
	options: {
		messages: {
			noResults: "No search results.",
			results: function( amount ) {
				return amount + ( amount > 1 ? " results are" : " result is" ) +
					" available, use up and down arrow keys to navigate.";
			}
		}
	},

	__response: function( content ) {
		var message;
		this._superApply( arguments );
		if ( this.options.disabled || this.cancelSearch ) {
			return;
		}
		if ( content && content.length ) {
			message = this.options.messages.results( content.length );
		} else {
			message = this.options.messages.noResults;
		}
		this.liveRegion.children().hide();
		$( "<div>" ).text( message ).appendTo( this.liveRegion );
	}
});

var autocomplete = $.ui.autocomplete;


/*!
 * jQuery UI Button 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/button/
 */


var lastActive,
	baseClasses = "ui-button ui-widget ui-state-default ui-corner-all",
	typeClasses = "ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only",
	formResetHandler = function() {
		var form = $( this );
		setTimeout(function() {
			form.find( ":ui-button" ).button( "refresh" );
		}, 1 );
	},
	radioGroup = function( radio ) {
		var name = radio.name,
			form = radio.form,
			radios = $( [] );
		if ( name ) {
			name = name.replace( /'/g, "\\'" );
			if ( form ) {
				radios = $( form ).find( "[name='" + name + "'][type=radio]" );
			} else {
				radios = $( "[name='" + name + "'][type=radio]", radio.ownerDocument )
					.filter(function() {
						return !this.form;
					});
			}
		}
		return radios;
	};

$.widget( "ui.button", {
	version: "1.11.4",
	defaultElement: "<button>",
	options: {
		disabled: null,
		text: true,
		label: null,
		icons: {
			primary: null,
			secondary: null
		}
	},
	_create: function() {
		this.element.closest( "form" )
			.unbind( "reset" + this.eventNamespace )
			.bind( "reset" + this.eventNamespace, formResetHandler );

		if ( typeof this.options.disabled !== "boolean" ) {
			this.options.disabled = !!this.element.prop( "disabled" );
		} else {
			this.element.prop( "disabled", this.options.disabled );
		}

		this._determineButtonType();
		this.hasTitle = !!this.buttonElement.attr( "title" );

		var that = this,
			options = this.options,
			toggleButton = this.type === "checkbox" || this.type === "radio",
			activeClass = !toggleButton ? "ui-state-active" : "";

		if ( options.label === null ) {
			options.label = (this.type === "input" ? this.buttonElement.val() : this.buttonElement.html());
		}

		this._hoverable( this.buttonElement );

		this.buttonElement
			.addClass( baseClasses )
			.attr( "role", "button" )
			.bind( "mouseenter" + this.eventNamespace, function() {
				if ( options.disabled ) {
					return;
				}
				if ( this === lastActive ) {
					$( this ).addClass( "ui-state-active" );
				}
			})
			.bind( "mouseleave" + this.eventNamespace, function() {
				if ( options.disabled ) {
					return;
				}
				$( this ).removeClass( activeClass );
			})
			.bind( "click" + this.eventNamespace, function( event ) {
				if ( options.disabled ) {
					event.preventDefault();
					event.stopImmediatePropagation();
				}
			});

		// Can't use _focusable() because the element that receives focus
		// and the element that gets the ui-state-focus class are different
		this._on({
			focus: function() {
				this.buttonElement.addClass( "ui-state-focus" );
			},
			blur: function() {
				this.buttonElement.removeClass( "ui-state-focus" );
			}
		});

		if ( toggleButton ) {
			this.element.bind( "change" + this.eventNamespace, function() {
				that.refresh();
			});
		}

		if ( this.type === "checkbox" ) {
			this.buttonElement.bind( "click" + this.eventNamespace, function() {
				if ( options.disabled ) {
					return false;
				}
			});
		} else if ( this.type === "radio" ) {
			this.buttonElement.bind( "click" + this.eventNamespace, function() {
				if ( options.disabled ) {
					return false;
				}
				$( this ).addClass( "ui-state-active" );
				that.buttonElement.attr( "aria-pressed", "true" );

				var radio = that.element[ 0 ];
				radioGroup( radio )
					.not( radio )
					.map(function() {
						return $( this ).button( "widget" )[ 0 ];
					})
					.removeClass( "ui-state-active" )
					.attr( "aria-pressed", "false" );
			});
		} else {
			this.buttonElement
				.bind( "mousedown" + this.eventNamespace, function() {
					if ( options.disabled ) {
						return false;
					}
					$( this ).addClass( "ui-state-active" );
					lastActive = this;
					that.document.one( "mouseup", function() {
						lastActive = null;
					});
				})
				.bind( "mouseup" + this.eventNamespace, function() {
					if ( options.disabled ) {
						return false;
					}
					$( this ).removeClass( "ui-state-active" );
				})
				.bind( "keydown" + this.eventNamespace, function(event) {
					if ( options.disabled ) {
						return false;
					}
					if ( event.keyCode === $.ui.keyCode.SPACE || event.keyCode === $.ui.keyCode.ENTER ) {
						$( this ).addClass( "ui-state-active" );
					}
				})
				// see #8559, we bind to blur here in case the button element loses
				// focus between keydown and keyup, it would be left in an "active" state
				.bind( "keyup" + this.eventNamespace + " blur" + this.eventNamespace, function() {
					$( this ).removeClass( "ui-state-active" );
				});

			if ( this.buttonElement.is("a") ) {
				this.buttonElement.keyup(function(event) {
					if ( event.keyCode === $.ui.keyCode.SPACE ) {
						// TODO pass through original event correctly (just as 2nd argument doesn't work)
						$( this ).click();
					}
				});
			}
		}

		this._setOption( "disabled", options.disabled );
		this._resetButton();
	},

	_determineButtonType: function() {
		var ancestor, labelSelector, checked;

		if ( this.element.is("[type=checkbox]") ) {
			this.type = "checkbox";
		} else if ( this.element.is("[type=radio]") ) {
			this.type = "radio";
		} else if ( this.element.is("input") ) {
			this.type = "input";
		} else {
			this.type = "button";
		}

		if ( this.type === "checkbox" || this.type === "radio" ) {
			// we don't search against the document in case the element
			// is disconnected from the DOM
			ancestor = this.element.parents().last();
			labelSelector = "label[for='" + this.element.attr("id") + "']";
			this.buttonElement = ancestor.find( labelSelector );
			if ( !this.buttonElement.length ) {
				ancestor = ancestor.length ? ancestor.siblings() : this.element.siblings();
				this.buttonElement = ancestor.filter( labelSelector );
				if ( !this.buttonElement.length ) {
					this.buttonElement = ancestor.find( labelSelector );
				}
			}
			this.element.addClass( "ui-helper-hidden-accessible" );

			checked = this.element.is( ":checked" );
			if ( checked ) {
				this.buttonElement.addClass( "ui-state-active" );
			}
			this.buttonElement.prop( "aria-pressed", checked );
		} else {
			this.buttonElement = this.element;
		}
	},

	widget: function() {
		return this.buttonElement;
	},

	_destroy: function() {
		this.element
			.removeClass( "ui-helper-hidden-accessible" );
		this.buttonElement
			.removeClass( baseClasses + " ui-state-active " + typeClasses )
			.removeAttr( "role" )
			.removeAttr( "aria-pressed" )
			.html( this.buttonElement.find(".ui-button-text").html() );

		if ( !this.hasTitle ) {
			this.buttonElement.removeAttr( "title" );
		}
	},

	_setOption: function( key, value ) {
		this._super( key, value );
		if ( key === "disabled" ) {
			this.widget().toggleClass( "ui-state-disabled", !!value );
			this.element.prop( "disabled", !!value );
			if ( value ) {
				if ( this.type === "checkbox" || this.type === "radio" ) {
					this.buttonElement.removeClass( "ui-state-focus" );
				} else {
					this.buttonElement.removeClass( "ui-state-focus ui-state-active" );
				}
			}
			return;
		}
		this._resetButton();
	},

	refresh: function() {
		//See #8237 & #8828
		var isDisabled = this.element.is( "input, button" ) ? this.element.is( ":disabled" ) : this.element.hasClass( "ui-button-disabled" );

		if ( isDisabled !== this.options.disabled ) {
			this._setOption( "disabled", isDisabled );
		}
		if ( this.type === "radio" ) {
			radioGroup( this.element[0] ).each(function() {
				if ( $( this ).is( ":checked" ) ) {
					$( this ).button( "widget" )
						.addClass( "ui-state-active" )
						.attr( "aria-pressed", "true" );
				} else {
					$( this ).button( "widget" )
						.removeClass( "ui-state-active" )
						.attr( "aria-pressed", "false" );
				}
			});
		} else if ( this.type === "checkbox" ) {
			if ( this.element.is( ":checked" ) ) {
				this.buttonElement
					.addClass( "ui-state-active" )
					.attr( "aria-pressed", "true" );
			} else {
				this.buttonElement
					.removeClass( "ui-state-active" )
					.attr( "aria-pressed", "false" );
			}
		}
	},

	_resetButton: function() {
		if ( this.type === "input" ) {
			if ( this.options.label ) {
				this.element.val( this.options.label );
			}
			return;
		}
		var buttonElement = this.buttonElement.removeClass( typeClasses ),
			buttonText = $( "<span></span>", this.document[0] )
				.addClass( "ui-button-text" )
				.html( this.options.label )
				.appendTo( buttonElement.empty() )
				.text(),
			icons = this.options.icons,
			multipleIcons = icons.primary && icons.secondary,
			buttonClasses = [];

		if ( icons.primary || icons.secondary ) {
			if ( this.options.text ) {
				buttonClasses.push( "ui-button-text-icon" + ( multipleIcons ? "s" : ( icons.primary ? "-primary" : "-secondary" ) ) );
			}

			if ( icons.primary ) {
				buttonElement.prepend( "<span class='ui-button-icon-primary ui-icon " + icons.primary + "'></span>" );
			}

			if ( icons.secondary ) {
				buttonElement.append( "<span class='ui-button-icon-secondary ui-icon " + icons.secondary + "'></span>" );
			}

			if ( !this.options.text ) {
				buttonClasses.push( multipleIcons ? "ui-button-icons-only" : "ui-button-icon-only" );

				if ( !this.hasTitle ) {
					buttonElement.attr( "title", $.trim( buttonText ) );
				}
			}
		} else {
			buttonClasses.push( "ui-button-text-only" );
		}
		buttonElement.addClass( buttonClasses.join( " " ) );
	}
});

$.widget( "ui.buttonset", {
	version: "1.11.4",
	options: {
		items: "button, input[type=button], input[type=submit], input[type=reset], input[type=checkbox], input[type=radio], a, :data(ui-button)"
	},

	_create: function() {
		this.element.addClass( "ui-buttonset" );
	},

	_init: function() {
		this.refresh();
	},

	_setOption: function( key, value ) {
		if ( key === "disabled" ) {
			this.buttons.button( "option", key, value );
		}

		this._super( key, value );
	},

	refresh: function() {
		var rtl = this.element.css( "direction" ) === "rtl",
			allButtons = this.element.find( this.options.items ),
			existingButtons = allButtons.filter( ":ui-button" );

		// Initialize new buttons
		allButtons.not( ":ui-button" ).button();

		// Refresh existing buttons
		existingButtons.button( "refresh" );

		this.buttons = allButtons
			.map(function() {
				return $( this ).button( "widget" )[ 0 ];
			})
				.removeClass( "ui-corner-all ui-corner-left ui-corner-right" )
				.filter( ":first" )
					.addClass( rtl ? "ui-corner-right" : "ui-corner-left" )
				.end()
				.filter( ":last" )
					.addClass( rtl ? "ui-corner-left" : "ui-corner-right" )
				.end()
			.end();
	},

	_destroy: function() {
		this.element.removeClass( "ui-buttonset" );
		this.buttons
			.map(function() {
				return $( this ).button( "widget" )[ 0 ];
			})
				.removeClass( "ui-corner-left ui-corner-right" )
			.end()
			.button( "destroy" );
	}
});

var button = $.ui.button;


/*!
 * jQuery UI Datepicker 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/datepicker/
 */


$.extend($.ui, { datepicker: { version: "1.11.4" } });

var datepicker_instActive;

function datepicker_getZindex( elem ) {
	var position, value;
	while ( elem.length && elem[ 0 ] !== document ) {
		// Ignore z-index if position is set to a value where z-index is ignored by the browser
		// This makes behavior of this function consistent across browsers
		// WebKit always returns auto if the element is positioned
		position = elem.css( "position" );
		if ( position === "absolute" || position === "relative" || position === "fixed" ) {
			// IE returns 0 when zIndex is not specified
			// other browsers return a string
			// we ignore the case of nested elements with an explicit value of 0
			// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
			value = parseInt( elem.css( "zIndex" ), 10 );
			if ( !isNaN( value ) && value !== 0 ) {
				return value;
			}
		}
		elem = elem.parent();
	}

	return 0;
}
/* Date picker manager.
   Use the singleton instance of this class, $.datepicker, to interact with the date picker.
   Settings for (groups of) date pickers are maintained in an instance object,
   allowing multiple different settings on the same page. */

function Datepicker() {
	this._curInst = null; // The current instance in use
	this._keyEvent = false; // If the last event was a key event
	this._disabledInputs = []; // List of date picker inputs that have been disabled
	this._datepickerShowing = false; // True if the popup picker is showing , false if not
	this._inDialog = false; // True if showing within a "dialog", false if not
	this._mainDivId = "ui-datepicker-div"; // The ID of the main datepicker division
	this._inlineClass = "ui-datepicker-inline"; // The name of the inline marker class
	this._appendClass = "ui-datepicker-append"; // The name of the append marker class
	this._triggerClass = "ui-datepicker-trigger"; // The name of the trigger marker class
	this._dialogClass = "ui-datepicker-dialog"; // The name of the dialog marker class
	this._disableClass = "ui-datepicker-disabled"; // The name of the disabled covering marker class
	this._unselectableClass = "ui-datepicker-unselectable"; // The name of the unselectable cell marker class
	this._currentClass = "ui-datepicker-current-day"; // The name of the current day marker class
	this._dayOverClass = "ui-datepicker-days-cell-over"; // The name of the day hover marker class
	this.regional = []; // Available regional settings, indexed by language code
	this.regional[""] = { // Default regional settings
		closeText: "Done", // Display text for close link
		prevText: "Prev", // Display text for previous month link
		nextText: "Next", // Display text for next month link
		currentText: "Today", // Display text for current month link
		monthNames: ["January","February","March","April","May","June",
			"July","August","September","October","November","December"], // Names of months for drop-down and formatting
		monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // For formatting
		dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], // For formatting
		dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], // For formatting
		dayNamesMin: ["Su","Mo","Tu","We","Th","Fr","Sa"], // Column headings for days starting at Sunday
		weekHeader: "Wk", // Column header for week of the year
		dateFormat: "mm/dd/yy", // See format options on parseDate
		firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
		isRTL: false, // True if right-to-left language, false if left-to-right
		showMonthAfterYear: false, // True if the year select precedes month, false for month then year
		yearSuffix: "" // Additional text to append to the year in the month headers
	};
	this._defaults = { // Global defaults for all the date picker instances
		showOn: "focus", // "focus" for popup on focus,
			// "button" for trigger button, or "both" for either
		showAnim: "fadeIn", // Name of jQuery animation for popup
		showOptions: {}, // Options for enhanced animations
		defaultDate: null, // Used when field is blank: actual date,
			// +/-number for offset from today, null for today
		appendText: "", // Display text following the input box, e.g. showing the format
		buttonText: "...", // Text for trigger button
		buttonImage: "", // URL for trigger button image
		buttonImageOnly: false, // True if the image appears alone, false if it appears on a button
		hideIfNoPrevNext: false, // True to hide next/previous month links
			// if not applicable, false to just disable them
		navigationAsDateFormat: false, // True if date formatting applied to prev/today/next links
		gotoCurrent: false, // True if today link goes back to current selection instead
		changeMonth: false, // True if month can be selected directly, false if only prev/next
		changeYear: false, // True if year can be selected directly, false if only prev/next
		yearRange: "c-10:c+10", // Range of years to display in drop-down,
			// either relative to today's year (-nn:+nn), relative to currently displayed year
			// (c-nn:c+nn), absolute (nnnn:nnnn), or a combination of the above (nnnn:-n)
		showOtherMonths: false, // True to show dates in other months, false to leave blank
		selectOtherMonths: false, // True to allow selection of dates in other months, false for unselectable
		showWeek: false, // True to show week of the year, false to not show it
		calculateWeek: this.iso8601Week, // How to calculate the week of the year,
			// takes a Date and returns the number of the week for it
		shortYearCutoff: "+10", // Short year values < this are in the current century,
			// > this are in the previous century,
			// string value starting with "+" for current year + value
		minDate: null, // The earliest selectable date, or null for no limit
		maxDate: null, // The latest selectable date, or null for no limit
		duration: "fast", // Duration of display/closure
		beforeShowDay: null, // Function that takes a date and returns an array with
			// [0] = true if selectable, false if not, [1] = custom CSS class name(s) or "",
			// [2] = cell title (optional), e.g. $.datepicker.noWeekends
		beforeShow: null, // Function that takes an input field and
			// returns a set of custom settings for the date picker
		onSelect: null, // Define a callback function when a date is selected
		onChangeMonthYear: null, // Define a callback function when the month or year is changed
		onClose: null, // Define a callback function when the datepicker is closed
		numberOfMonths: 1, // Number of months to show at a time
		showCurrentAtPos: 0, // The position in multipe months at which to show the current month (starting at 0)
		stepMonths: 1, // Number of months to step back/forward
		stepBigMonths: 12, // Number of months to step back/forward for the big links
		altField: "", // Selector for an alternate field to store selected dates into
		altFormat: "", // The date format to use for the alternate field
		constrainInput: true, // The input is constrained by the current date format
		showButtonPanel: false, // True to show button panel, false to not show it
		autoSize: false, // True to size the input for the date format, false to leave as is
		disabled: false // The initial disabled state
	};
	$.extend(this._defaults, this.regional[""]);
	this.regional.en = $.extend( true, {}, this.regional[ "" ]);
	this.regional[ "en-US" ] = $.extend( true, {}, this.regional.en );
	this.dpDiv = datepicker_bindHover($("<div id='" + this._mainDivId + "' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"));
}

$.extend(Datepicker.prototype, {
	/* Class name added to elements to indicate already configured with a date picker. */
	markerClassName: "hasDatepicker",

	//Keep track of the maximum number of rows displayed (see #7043)
	maxRows: 4,

	// TODO rename to "widget" when switching to widget factory
	_widgetDatepicker: function() {
		return this.dpDiv;
	},

	/* Override the default settings for all instances of the date picker.
	 * @param  settings  object - the new settings to use as defaults (anonymous object)
	 * @return the manager object
	 */
	setDefaults: function(settings) {
		datepicker_extendRemove(this._defaults, settings || {});
		return this;
	},

	/* Attach the date picker to a jQuery selection.
	 * @param  target	element - the target input field or division or span
	 * @param  settings  object - the new settings to use for this date picker instance (anonymous)
	 */
	_attachDatepicker: function(target, settings) {
		var nodeName, inline, inst;
		nodeName = target.nodeName.toLowerCase();
		inline = (nodeName === "div" || nodeName === "span");
		if (!target.id) {
			this.uuid += 1;
			target.id = "dp" + this.uuid;
		}
		inst = this._newInst($(target), inline);
		inst.settings = $.extend({}, settings || {});
		if (nodeName === "input") {
			this._connectDatepicker(target, inst);
		} else if (inline) {
			this._inlineDatepicker(target, inst);
		}
	},

	/* Create a new instance object. */
	_newInst: function(target, inline) {
		var id = target[0].id.replace(/([^A-Za-z0-9_\-])/g, "\\\\$1"); // escape jQuery meta chars
		return {id: id, input: target, // associated target
			selectedDay: 0, selectedMonth: 0, selectedYear: 0, // current selection
			drawMonth: 0, drawYear: 0, // month being drawn
			inline: inline, // is datepicker inline or not
			dpDiv: (!inline ? this.dpDiv : // presentation div
			datepicker_bindHover($("<div class='" + this._inlineClass + " ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>")))};
	},

	/* Attach the date picker to an input field. */
	_connectDatepicker: function(target, inst) {
		var input = $(target);
		inst.append = $([]);
		inst.trigger = $([]);
		if (input.hasClass(this.markerClassName)) {
			return;
		}
		this._attachments(input, inst);
		input.addClass(this.markerClassName).keydown(this._doKeyDown).
			keypress(this._doKeyPress).keyup(this._doKeyUp);
		this._autoSize(inst);
		$.data(target, "datepicker", inst);
		//If disabled option is true, disable the datepicker once it has been attached to the input (see ticket #5665)
		if( inst.settings.disabled ) {
			this._disableDatepicker( target );
		}
	},

	/* Make attachments based on settings. */
	_attachments: function(input, inst) {
		var showOn, buttonText, buttonImage,
			appendText = this._get(inst, "appendText"),
			isRTL = this._get(inst, "isRTL");

		if (inst.append) {
			inst.append.remove();
		}
		if (appendText) {
			inst.append = $("<span class='" + this._appendClass + "'>" + appendText + "</span>");
			input[isRTL ? "before" : "after"](inst.append);
		}

		input.unbind("focus", this._showDatepicker);

		if (inst.trigger) {
			inst.trigger.remove();
		}

		showOn = this._get(inst, "showOn");
		if (showOn === "focus" || showOn === "both") { // pop-up date picker when in the marked field
			input.focus(this._showDatepicker);
		}
		if (showOn === "button" || showOn === "both") { // pop-up date picker when button clicked
			buttonText = this._get(inst, "buttonText");
			buttonImage = this._get(inst, "buttonImage");
			inst.trigger = $(this._get(inst, "buttonImageOnly") ?
				$("<img/>").addClass(this._triggerClass).
					attr({ src: buttonImage, alt: buttonText, title: buttonText }) :
				$("<button type='button'></button>").addClass(this._triggerClass).
					html(!buttonImage ? buttonText : $("<img/>").attr(
					{ src:buttonImage, alt:buttonText, title:buttonText })));
			input[isRTL ? "before" : "after"](inst.trigger);
			inst.trigger.click(function() {
				if ($.datepicker._datepickerShowing && $.datepicker._lastInput === input[0]) {
					$.datepicker._hideDatepicker();
				} else if ($.datepicker._datepickerShowing && $.datepicker._lastInput !== input[0]) {
					$.datepicker._hideDatepicker();
					$.datepicker._showDatepicker(input[0]);
				} else {
					$.datepicker._showDatepicker(input[0]);
				}
				return false;
			});
		}
	},

	/* Apply the maximum length for the date format. */
	_autoSize: function(inst) {
		if (this._get(inst, "autoSize") && !inst.inline) {
			var findMax, max, maxI, i,
				date = new Date(2009, 12 - 1, 20), // Ensure double digits
				dateFormat = this._get(inst, "dateFormat");

			if (dateFormat.match(/[DM]/)) {
				findMax = function(names) {
					max = 0;
					maxI = 0;
					for (i = 0; i < names.length; i++) {
						if (names[i].length > max) {
							max = names[i].length;
							maxI = i;
						}
					}
					return maxI;
				};
				date.setMonth(findMax(this._get(inst, (dateFormat.match(/MM/) ?
					"monthNames" : "monthNamesShort"))));
				date.setDate(findMax(this._get(inst, (dateFormat.match(/DD/) ?
					"dayNames" : "dayNamesShort"))) + 20 - date.getDay());
			}
			inst.input.attr("size", this._formatDate(inst, date).length);
		}
	},

	/* Attach an inline date picker to a div. */
	_inlineDatepicker: function(target, inst) {
		var divSpan = $(target);
		if (divSpan.hasClass(this.markerClassName)) {
			return;
		}
		divSpan.addClass(this.markerClassName).append(inst.dpDiv);
		$.data(target, "datepicker", inst);
		this._setDate(inst, this._getDefaultDate(inst), true);
		this._updateDatepicker(inst);
		this._updateAlternate(inst);
		//If disabled option is true, disable the datepicker before showing it (see ticket #5665)
		if( inst.settings.disabled ) {
			this._disableDatepicker( target );
		}
		// Set display:block in place of inst.dpDiv.show() which won't work on disconnected elements
		// http://bugs.jqueryui.com/ticket/7552 - A Datepicker created on a detached div has zero height
		inst.dpDiv.css( "display", "block" );
	},

	/* Pop-up the date picker in a "dialog" box.
	 * @param  input element - ignored
	 * @param  date	string or Date - the initial date to display
	 * @param  onSelect  function - the function to call when a date is selected
	 * @param  settings  object - update the dialog date picker instance's settings (anonymous object)
	 * @param  pos int[2] - coordinates for the dialog's position within the screen or
	 *					event - with x/y coordinates or
	 *					leave empty for default (screen centre)
	 * @return the manager object
	 */
	_dialogDatepicker: function(input, date, onSelect, settings, pos) {
		var id, browserWidth, browserHeight, scrollX, scrollY,
			inst = this._dialogInst; // internal instance

		if (!inst) {
			this.uuid += 1;
			id = "dp" + this.uuid;
			this._dialogInput = $("<input type='text' id='" + id +
				"' style='position: absolute; top: -100px; width: 0px;'/>");
			this._dialogInput.keydown(this._doKeyDown);
			$("body").append(this._dialogInput);
			inst = this._dialogInst = this._newInst(this._dialogInput, false);
			inst.settings = {};
			$.data(this._dialogInput[0], "datepicker", inst);
		}
		datepicker_extendRemove(inst.settings, settings || {});
		date = (date && date.constructor === Date ? this._formatDate(inst, date) : date);
		this._dialogInput.val(date);

		this._pos = (pos ? (pos.length ? pos : [pos.pageX, pos.pageY]) : null);
		if (!this._pos) {
			browserWidth = document.documentElement.clientWidth;
			browserHeight = document.documentElement.clientHeight;
			scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
			scrollY = document.documentElement.scrollTop || document.body.scrollTop;
			this._pos = // should use actual width/height below
				[(browserWidth / 2) - 100 + scrollX, (browserHeight / 2) - 150 + scrollY];
		}

		// move input on screen for focus, but hidden behind dialog
		this._dialogInput.css("left", (this._pos[0] + 20) + "px").css("top", this._pos[1] + "px");
		inst.settings.onSelect = onSelect;
		this._inDialog = true;
		this.dpDiv.addClass(this._dialogClass);
		this._showDatepicker(this._dialogInput[0]);
		if ($.blockUI) {
			$.blockUI(this.dpDiv);
		}
		$.data(this._dialogInput[0], "datepicker", inst);
		return this;
	},

	/* Detach a datepicker from its control.
	 * @param  target	element - the target input field or division or span
	 */
	_destroyDatepicker: function(target) {
		var nodeName,
			$target = $(target),
			inst = $.data(target, "datepicker");

		if (!$target.hasClass(this.markerClassName)) {
			return;
		}

		nodeName = target.nodeName.toLowerCase();
		$.removeData(target, "datepicker");
		if (nodeName === "input") {
			inst.append.remove();
			inst.trigger.remove();
			$target.removeClass(this.markerClassName).
				unbind("focus", this._showDatepicker).
				unbind("keydown", this._doKeyDown).
				unbind("keypress", this._doKeyPress).
				unbind("keyup", this._doKeyUp);
		} else if (nodeName === "div" || nodeName === "span") {
			$target.removeClass(this.markerClassName).empty();
		}

		if ( datepicker_instActive === inst ) {
			datepicker_instActive = null;
		}
	},

	/* Enable the date picker to a jQuery selection.
	 * @param  target	element - the target input field or division or span
	 */
	_enableDatepicker: function(target) {
		var nodeName, inline,
			$target = $(target),
			inst = $.data(target, "datepicker");

		if (!$target.hasClass(this.markerClassName)) {
			return;
		}

		nodeName = target.nodeName.toLowerCase();
		if (nodeName === "input") {
			target.disabled = false;
			inst.trigger.filter("button").
				each(function() { this.disabled = false; }).end().
				filter("img").css({opacity: "1.0", cursor: ""});
		} else if (nodeName === "div" || nodeName === "span") {
			inline = $target.children("." + this._inlineClass);
			inline.children().removeClass("ui-state-disabled");
			inline.find("select.ui-datepicker-month, select.ui-datepicker-year").
				prop("disabled", false);
		}
		this._disabledInputs = $.map(this._disabledInputs,
			function(value) { return (value === target ? null : value); }); // delete entry
	},

	/* Disable the date picker to a jQuery selection.
	 * @param  target	element - the target input field or division or span
	 */
	_disableDatepicker: function(target) {
		var nodeName, inline,
			$target = $(target),
			inst = $.data(target, "datepicker");

		if (!$target.hasClass(this.markerClassName)) {
			return;
		}

		nodeName = target.nodeName.toLowerCase();
		if (nodeName === "input") {
			target.disabled = true;
			inst.trigger.filter("button").
				each(function() { this.disabled = true; }).end().
				filter("img").css({opacity: "0.5", cursor: "default"});
		} else if (nodeName === "div" || nodeName === "span") {
			inline = $target.children("." + this._inlineClass);
			inline.children().addClass("ui-state-disabled");
			inline.find("select.ui-datepicker-month, select.ui-datepicker-year").
				prop("disabled", true);
		}
		this._disabledInputs = $.map(this._disabledInputs,
			function(value) { return (value === target ? null : value); }); // delete entry
		this._disabledInputs[this._disabledInputs.length] = target;
	},

	/* Is the first field in a jQuery collection disabled as a datepicker?
	 * @param  target	element - the target input field or division or span
	 * @return boolean - true if disabled, false if enabled
	 */
	_isDisabledDatepicker: function(target) {
		if (!target) {
			return false;
		}
		for (var i = 0; i < this._disabledInputs.length; i++) {
			if (this._disabledInputs[i] === target) {
				return true;
			}
		}
		return false;
	},

	/* Retrieve the instance data for the target control.
	 * @param  target  element - the target input field or division or span
	 * @return  object - the associated instance data
	 * @throws  error if a jQuery problem getting data
	 */
	_getInst: function(target) {
		try {
			return $.data(target, "datepicker");
		}
		catch (err) {
			throw "Missing instance data for this datepicker";
		}
	},

	/* Update or retrieve the settings for a date picker attached to an input field or division.
	 * @param  target  element - the target input field or division or span
	 * @param  name	object - the new settings to update or
	 *				string - the name of the setting to change or retrieve,
	 *				when retrieving also "all" for all instance settings or
	 *				"defaults" for all global defaults
	 * @param  value   any - the new value for the setting
	 *				(omit if above is an object or to retrieve a value)
	 */
	_optionDatepicker: function(target, name, value) {
		var settings, date, minDate, maxDate,
			inst = this._getInst(target);

		if (arguments.length === 2 && typeof name === "string") {
			return (name === "defaults" ? $.extend({}, $.datepicker._defaults) :
				(inst ? (name === "all" ? $.extend({}, inst.settings) :
				this._get(inst, name)) : null));
		}

		settings = name || {};
		if (typeof name === "string") {
			settings = {};
			settings[name] = value;
		}

		if (inst) {
			if (this._curInst === inst) {
				this._hideDatepicker();
			}

			date = this._getDateDatepicker(target, true);
			minDate = this._getMinMaxDate(inst, "min");
			maxDate = this._getMinMaxDate(inst, "max");
			datepicker_extendRemove(inst.settings, settings);
			// reformat the old minDate/maxDate values if dateFormat changes and a new minDate/maxDate isn't provided
			if (minDate !== null && settings.dateFormat !== undefined && settings.minDate === undefined) {
				inst.settings.minDate = this._formatDate(inst, minDate);
			}
			if (maxDate !== null && settings.dateFormat !== undefined && settings.maxDate === undefined) {
				inst.settings.maxDate = this._formatDate(inst, maxDate);
			}
			if ( "disabled" in settings ) {
				if ( settings.disabled ) {
					this._disableDatepicker(target);
				} else {
					this._enableDatepicker(target);
				}
			}
			this._attachments($(target), inst);
			this._autoSize(inst);
			this._setDate(inst, date);
			this._updateAlternate(inst);
			this._updateDatepicker(inst);
		}
	},

	// change method deprecated
	_changeDatepicker: function(target, name, value) {
		this._optionDatepicker(target, name, value);
	},

	/* Redraw the date picker attached to an input field or division.
	 * @param  target  element - the target input field or division or span
	 */
	_refreshDatepicker: function(target) {
		var inst = this._getInst(target);
		if (inst) {
			this._updateDatepicker(inst);
		}
	},

	/* Set the dates for a jQuery selection.
	 * @param  target element - the target input field or division or span
	 * @param  date	Date - the new date
	 */
	_setDateDatepicker: function(target, date) {
		var inst = this._getInst(target);
		if (inst) {
			this._setDate(inst, date);
			this._updateDatepicker(inst);
			this._updateAlternate(inst);
		}
	},

	/* Get the date(s) for the first entry in a jQuery selection.
	 * @param  target element - the target input field or division or span
	 * @param  noDefault boolean - true if no default date is to be used
	 * @return Date - the current date
	 */
	_getDateDatepicker: function(target, noDefault) {
		var inst = this._getInst(target);
		if (inst && !inst.inline) {
			this._setDateFromField(inst, noDefault);
		}
		return (inst ? this._getDate(inst) : null);
	},

	/* Handle keystrokes. */
	_doKeyDown: function(event) {
		var onSelect, dateStr, sel,
			inst = $.datepicker._getInst(event.target),
			handled = true,
			isRTL = inst.dpDiv.is(".ui-datepicker-rtl");

		inst._keyEvent = true;
		if ($.datepicker._datepickerShowing) {
			switch (event.keyCode) {
				case 9: $.datepicker._hideDatepicker();
						handled = false;
						break; // hide on tab out
				case 13: sel = $("td." + $.datepicker._dayOverClass + ":not(." +
									$.datepicker._currentClass + ")", inst.dpDiv);
						if (sel[0]) {
							$.datepicker._selectDay(event.target, inst.selectedMonth, inst.selectedYear, sel[0]);
						}

						onSelect = $.datepicker._get(inst, "onSelect");
						if (onSelect) {
							dateStr = $.datepicker._formatDate(inst);

							// trigger custom callback
							onSelect.apply((inst.input ? inst.input[0] : null), [dateStr, inst]);
						} else {
							$.datepicker._hideDatepicker();
						}

						return false; // don't submit the form
				case 27: $.datepicker._hideDatepicker();
						break; // hide on escape
				case 33: $.datepicker._adjustDate(event.target, (event.ctrlKey ?
							-$.datepicker._get(inst, "stepBigMonths") :
							-$.datepicker._get(inst, "stepMonths")), "M");
						break; // previous month/year on page up/+ ctrl
				case 34: $.datepicker._adjustDate(event.target, (event.ctrlKey ?
							+$.datepicker._get(inst, "stepBigMonths") :
							+$.datepicker._get(inst, "stepMonths")), "M");
						break; // next month/year on page down/+ ctrl
				case 35: if (event.ctrlKey || event.metaKey) {
							$.datepicker._clearDate(event.target);
						}
						handled = event.ctrlKey || event.metaKey;
						break; // clear on ctrl or command +end
				case 36: if (event.ctrlKey || event.metaKey) {
							$.datepicker._gotoToday(event.target);
						}
						handled = event.ctrlKey || event.metaKey;
						break; // current on ctrl or command +home
				case 37: if (event.ctrlKey || event.metaKey) {
							$.datepicker._adjustDate(event.target, (isRTL ? +1 : -1), "D");
						}
						handled = event.ctrlKey || event.metaKey;
						// -1 day on ctrl or command +left
						if (event.originalEvent.altKey) {
							$.datepicker._adjustDate(event.target, (event.ctrlKey ?
								-$.datepicker._get(inst, "stepBigMonths") :
								-$.datepicker._get(inst, "stepMonths")), "M");
						}
						// next month/year on alt +left on Mac
						break;
				case 38: if (event.ctrlKey || event.metaKey) {
							$.datepicker._adjustDate(event.target, -7, "D");
						}
						handled = event.ctrlKey || event.metaKey;
						break; // -1 week on ctrl or command +up
				case 39: if (event.ctrlKey || event.metaKey) {
							$.datepicker._adjustDate(event.target, (isRTL ? -1 : +1), "D");
						}
						handled = event.ctrlKey || event.metaKey;
						// +1 day on ctrl or command +right
						if (event.originalEvent.altKey) {
							$.datepicker._adjustDate(event.target, (event.ctrlKey ?
								+$.datepicker._get(inst, "stepBigMonths") :
								+$.datepicker._get(inst, "stepMonths")), "M");
						}
						// next month/year on alt +right
						break;
				case 40: if (event.ctrlKey || event.metaKey) {
							$.datepicker._adjustDate(event.target, +7, "D");
						}
						handled = event.ctrlKey || event.metaKey;
						break; // +1 week on ctrl or command +down
				default: handled = false;
			}
		} else if (event.keyCode === 36 && event.ctrlKey) { // display the date picker on ctrl+home
			$.datepicker._showDatepicker(this);
		} else {
			handled = false;
		}

		if (handled) {
			event.preventDefault();
			event.stopPropagation();
		}
	},

	/* Filter entered characters - based on date format. */
	_doKeyPress: function(event) {
		var chars, chr,
			inst = $.datepicker._getInst(event.target);

		if ($.datepicker._get(inst, "constrainInput")) {
			chars = $.datepicker._possibleChars($.datepicker._get(inst, "dateFormat"));
			chr = String.fromCharCode(event.charCode == null ? event.keyCode : event.charCode);
			return event.ctrlKey || event.metaKey || (chr < " " || !chars || chars.indexOf(chr) > -1);
		}
	},

	/* Synchronise manual entry and field/alternate field. */
	_doKeyUp: function(event) {
		var date,
			inst = $.datepicker._getInst(event.target);

		if (inst.input.val() !== inst.lastVal) {
			try {
				date = $.datepicker.parseDate($.datepicker._get(inst, "dateFormat"),
					(inst.input ? inst.input.val() : null),
					$.datepicker._getFormatConfig(inst));

				if (date) { // only if valid
					$.datepicker._setDateFromField(inst);
					$.datepicker._updateAlternate(inst);
					$.datepicker._updateDatepicker(inst);
				}
			}
			catch (err) {
			}
		}
		return true;
	},

	/* Pop-up the date picker for a given input field.
	 * If false returned from beforeShow event handler do not show.
	 * @param  input  element - the input field attached to the date picker or
	 *					event - if triggered by focus
	 */
	_showDatepicker: function(input) {
		input = input.target || input;
		if (input.nodeName.toLowerCase() !== "input") { // find from button/image trigger
			input = $("input", input.parentNode)[0];
		}

		if ($.datepicker._isDisabledDatepicker(input) || $.datepicker._lastInput === input) { // already here
			return;
		}

		var inst, beforeShow, beforeShowSettings, isFixed,
			offset, showAnim, duration;

		inst = $.datepicker._getInst(input);
		if ($.datepicker._curInst && $.datepicker._curInst !== inst) {
			$.datepicker._curInst.dpDiv.stop(true, true);
			if ( inst && $.datepicker._datepickerShowing ) {
				$.datepicker._hideDatepicker( $.datepicker._curInst.input[0] );
			}
		}

		beforeShow = $.datepicker._get(inst, "beforeShow");
		beforeShowSettings = beforeShow ? beforeShow.apply(input, [input, inst]) : {};
		if(beforeShowSettings === false){
			return;
		}
		datepicker_extendRemove(inst.settings, beforeShowSettings);

		inst.lastVal = null;
		$.datepicker._lastInput = input;
		$.datepicker._setDateFromField(inst);

		if ($.datepicker._inDialog) { // hide cursor
			input.value = "";
		}
		if (!$.datepicker._pos) { // position below input
			$.datepicker._pos = $.datepicker._findPos(input);
			$.datepicker._pos[1] += input.offsetHeight; // add the height
		}

		isFixed = false;
		$(input).parents().each(function() {
			isFixed |= $(this).css("position") === "fixed";
			return !isFixed;
		});

		offset = {left: $.datepicker._pos[0], top: $.datepicker._pos[1]};
		$.datepicker._pos = null;
		//to avoid flashes on Firefox
		inst.dpDiv.empty();
		// determine sizing offscreen
		inst.dpDiv.css({position: "absolute", display: "block", top: "-1000px"});
		$.datepicker._updateDatepicker(inst);
		// fix width for dynamic number of date pickers
		// and adjust position before showing
		offset = $.datepicker._checkOffset(inst, offset, isFixed);
		inst.dpDiv.css({position: ($.datepicker._inDialog && $.blockUI ?
			"static" : (isFixed ? "fixed" : "absolute")), display: "none",
			left: offset.left + "px", top: offset.top + "px"});

		if (!inst.inline) {
			showAnim = $.datepicker._get(inst, "showAnim");
			duration = $.datepicker._get(inst, "duration");
			inst.dpDiv.css( "z-index", datepicker_getZindex( $( input ) ) + 1 );
			$.datepicker._datepickerShowing = true;

			if ( $.effects && $.effects.effect[ showAnim ] ) {
				inst.dpDiv.show(showAnim, $.datepicker._get(inst, "showOptions"), duration);
			} else {
				inst.dpDiv[showAnim || "show"](showAnim ? duration : null);
			}

			if ( $.datepicker._shouldFocusInput( inst ) ) {
				inst.input.focus();
			}

			$.datepicker._curInst = inst;
		}
	},

	/* Generate the date picker content. */
	_updateDatepicker: function(inst) {
		this.maxRows = 4; //Reset the max number of rows being displayed (see #7043)
		datepicker_instActive = inst; // for delegate hover events
		inst.dpDiv.empty().append(this._generateHTML(inst));
		this._attachHandlers(inst);

		var origyearshtml,
			numMonths = this._getNumberOfMonths(inst),
			cols = numMonths[1],
			width = 17,
			activeCell = inst.dpDiv.find( "." + this._dayOverClass + " a" );

		if ( activeCell.length > 0 ) {
			datepicker_handleMouseover.apply( activeCell.get( 0 ) );
		}

		inst.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width("");
		if (cols > 1) {
			inst.dpDiv.addClass("ui-datepicker-multi-" + cols).css("width", (width * cols) + "em");
		}
		inst.dpDiv[(numMonths[0] !== 1 || numMonths[1] !== 1 ? "add" : "remove") +
			"Class"]("ui-datepicker-multi");
		inst.dpDiv[(this._get(inst, "isRTL") ? "add" : "remove") +
			"Class"]("ui-datepicker-rtl");

		if (inst === $.datepicker._curInst && $.datepicker._datepickerShowing && $.datepicker._shouldFocusInput( inst ) ) {
			inst.input.focus();
		}

		// deffered render of the years select (to avoid flashes on Firefox)
		if( inst.yearshtml ){
			origyearshtml = inst.yearshtml;
			setTimeout(function(){
				//assure that inst.yearshtml didn't change.
				if( origyearshtml === inst.yearshtml && inst.yearshtml ){
					inst.dpDiv.find("select.ui-datepicker-year:first").replaceWith(inst.yearshtml);
				}
				origyearshtml = inst.yearshtml = null;
			}, 0);
		}
	},

	// #6694 - don't focus the input if it's already focused
	// this breaks the change event in IE
	// Support: IE and jQuery <1.9
	_shouldFocusInput: function( inst ) {
		return inst.input && inst.input.is( ":visible" ) && !inst.input.is( ":disabled" ) && !inst.input.is( ":focus" );
	},

	/* Check positioning to remain on screen. */
	_checkOffset: function(inst, offset, isFixed) {
		var dpWidth = inst.dpDiv.outerWidth(),
			dpHeight = inst.dpDiv.outerHeight(),
			inputWidth = inst.input ? inst.input.outerWidth() : 0,
			inputHeight = inst.input ? inst.input.outerHeight() : 0,
			viewWidth = document.documentElement.clientWidth + (isFixed ? 0 : $(document).scrollLeft()),
			viewHeight = document.documentElement.clientHeight + (isFixed ? 0 : $(document).scrollTop());

		offset.left -= (this._get(inst, "isRTL") ? (dpWidth - inputWidth) : 0);
		offset.left -= (isFixed && offset.left === inst.input.offset().left) ? $(document).scrollLeft() : 0;
		offset.top -= (isFixed && offset.top === (inst.input.offset().top + inputHeight)) ? $(document).scrollTop() : 0;

		// now check if datepicker is showing outside window viewport - move to a better place if so.
		offset.left -= Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ?
			Math.abs(offset.left + dpWidth - viewWidth) : 0);
		offset.top -= Math.min(offset.top, (offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
			Math.abs(dpHeight + inputHeight) : 0);

		return offset;
	},

	/* Find an object's position on the screen. */
	_findPos: function(obj) {
		var position,
			inst = this._getInst(obj),
			isRTL = this._get(inst, "isRTL");

		while (obj && (obj.type === "hidden" || obj.nodeType !== 1 || $.expr.filters.hidden(obj))) {
			obj = obj[isRTL ? "previousSibling" : "nextSibling"];
		}

		position = $(obj).offset();
		return [position.left, position.top];
	},

	/* Hide the date picker from view.
	 * @param  input  element - the input field attached to the date picker
	 */
	_hideDatepicker: function(input) {
		var showAnim, duration, postProcess, onClose,
			inst = this._curInst;

		if (!inst || (input && inst !== $.data(input, "datepicker"))) {
			return;
		}

		if (this._datepickerShowing) {
			showAnim = this._get(inst, "showAnim");
			duration = this._get(inst, "duration");
			postProcess = function() {
				$.datepicker._tidyDialog(inst);
			};

			// DEPRECATED: after BC for 1.8.x $.effects[ showAnim ] is not needed
			if ( $.effects && ( $.effects.effect[ showAnim ] || $.effects[ showAnim ] ) ) {
				inst.dpDiv.hide(showAnim, $.datepicker._get(inst, "showOptions"), duration, postProcess);
			} else {
				inst.dpDiv[(showAnim === "slideDown" ? "slideUp" :
					(showAnim === "fadeIn" ? "fadeOut" : "hide"))]((showAnim ? duration : null), postProcess);
			}

			if (!showAnim) {
				postProcess();
			}
			this._datepickerShowing = false;

			onClose = this._get(inst, "onClose");
			if (onClose) {
				onClose.apply((inst.input ? inst.input[0] : null), [(inst.input ? inst.input.val() : ""), inst]);
			}

			this._lastInput = null;
			if (this._inDialog) {
				this._dialogInput.css({ position: "absolute", left: "0", top: "-100px" });
				if ($.blockUI) {
					$.unblockUI();
					$("body").append(this.dpDiv);
				}
			}
			this._inDialog = false;
		}
	},

	/* Tidy up after a dialog display. */
	_tidyDialog: function(inst) {
		inst.dpDiv.removeClass(this._dialogClass).unbind(".ui-datepicker-calendar");
	},

	/* Close date picker if clicked elsewhere. */
	_checkExternalClick: function(event) {
		if (!$.datepicker._curInst) {
			return;
		}

		var $target = $(event.target),
			inst = $.datepicker._getInst($target[0]);

		if ( ( ( $target[0].id !== $.datepicker._mainDivId &&
				$target.parents("#" + $.datepicker._mainDivId).length === 0 &&
				!$target.hasClass($.datepicker.markerClassName) &&
				!$target.closest("." + $.datepicker._triggerClass).length &&
				$.datepicker._datepickerShowing && !($.datepicker._inDialog && $.blockUI) ) ) ||
			( $target.hasClass($.datepicker.markerClassName) && $.datepicker._curInst !== inst ) ) {
				$.datepicker._hideDatepicker();
		}
	},

	/* Adjust one of the date sub-fields. */
	_adjustDate: function(id, offset, period) {
		var target = $(id),
			inst = this._getInst(target[0]);

		if (this._isDisabledDatepicker(target[0])) {
			return;
		}
		this._adjustInstDate(inst, offset +
			(period === "M" ? this._get(inst, "showCurrentAtPos") : 0), // undo positioning
			period);
		this._updateDatepicker(inst);
	},

	/* Action for current link. */
	_gotoToday: function(id) {
		var date,
			target = $(id),
			inst = this._getInst(target[0]);

		if (this._get(inst, "gotoCurrent") && inst.currentDay) {
			inst.selectedDay = inst.currentDay;
			inst.drawMonth = inst.selectedMonth = inst.currentMonth;
			inst.drawYear = inst.selectedYear = inst.currentYear;
		} else {
			date = new Date();
			inst.selectedDay = date.getDate();
			inst.drawMonth = inst.selectedMonth = date.getMonth();
			inst.drawYear = inst.selectedYear = date.getFullYear();
		}
		this._notifyChange(inst);
		this._adjustDate(target);
	},

	/* Action for selecting a new month/year. */
	_selectMonthYear: function(id, select, period) {
		var target = $(id),
			inst = this._getInst(target[0]);

		inst["selected" + (period === "M" ? "Month" : "Year")] =
		inst["draw" + (period === "M" ? "Month" : "Year")] =
			parseInt(select.options[select.selectedIndex].value,10);

		this._notifyChange(inst);
		this._adjustDate(target);
	},

	/* Action for selecting a day. */
	_selectDay: function(id, month, year, td) {
		var inst,
			target = $(id);

		if ($(td).hasClass(this._unselectableClass) || this._isDisabledDatepicker(target[0])) {
			return;
		}

		inst = this._getInst(target[0]);
		inst.selectedDay = inst.currentDay = $("a", td).html();
		inst.selectedMonth = inst.currentMonth = month;
		inst.selectedYear = inst.currentYear = year;
		this._selectDate(id, this._formatDate(inst,
			inst.currentDay, inst.currentMonth, inst.currentYear));
	},

	/* Erase the input field and hide the date picker. */
	_clearDate: function(id) {
		var target = $(id);
		this._selectDate(target, "");
	},

	/* Update the input field with the selected date. */
	_selectDate: function(id, dateStr) {
		var onSelect,
			target = $(id),
			inst = this._getInst(target[0]);

		dateStr = (dateStr != null ? dateStr : this._formatDate(inst));
		if (inst.input) {
			inst.input.val(dateStr);
		}
		this._updateAlternate(inst);

		onSelect = this._get(inst, "onSelect");
		if (onSelect) {
			onSelect.apply((inst.input ? inst.input[0] : null), [dateStr, inst]);  // trigger custom callback
		} else if (inst.input) {
			inst.input.trigger("change"); // fire the change event
		}

		if (inst.inline){
			this._updateDatepicker(inst);
		} else {
			this._hideDatepicker();
			this._lastInput = inst.input[0];
			if (typeof(inst.input[0]) !== "object") {
				inst.input.focus(); // restore focus
			}
			this._lastInput = null;
		}
	},

	/* Update any alternate field to synchronise with the main field. */
	_updateAlternate: function(inst) {
		var altFormat, date, dateStr,
			altField = this._get(inst, "altField");

		if (altField) { // update alternate field too
			altFormat = this._get(inst, "altFormat") || this._get(inst, "dateFormat");
			date = this._getDate(inst);
			dateStr = this.formatDate(altFormat, date, this._getFormatConfig(inst));
			$(altField).each(function() { $(this).val(dateStr); });
		}
	},

	/* Set as beforeShowDay function to prevent selection of weekends.
	 * @param  date  Date - the date to customise
	 * @return [boolean, string] - is this date selectable?, what is its CSS class?
	 */
	noWeekends: function(date) {
		var day = date.getDay();
		return [(day > 0 && day < 6), ""];
	},

	/* Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
	 * @param  date  Date - the date to get the week for
	 * @return  number - the number of the week within the year that contains this date
	 */
	iso8601Week: function(date) {
		var time,
			checkDate = new Date(date.getTime());

		// Find Thursday of this week starting on Monday
		checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));

		time = checkDate.getTime();
		checkDate.setMonth(0); // Compare with Jan 1
		checkDate.setDate(1);
		return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
	},

	/* Parse a string value into a date object.
	 * See formatDate below for the possible formats.
	 *
	 * @param  format string - the expected format of the date
	 * @param  value string - the date in the above format
	 * @param  settings Object - attributes include:
	 *					shortYearCutoff  number - the cutoff year for determining the century (optional)
	 *					dayNamesShort	string[7] - abbreviated names of the days from Sunday (optional)
	 *					dayNames		string[7] - names of the days from Sunday (optional)
	 *					monthNamesShort string[12] - abbreviated names of the months (optional)
	 *					monthNames		string[12] - names of the months (optional)
	 * @return  Date - the extracted date value or null if value is blank
	 */
	parseDate: function (format, value, settings) {
		if (format == null || value == null) {
			throw "Invalid arguments";
		}

		value = (typeof value === "object" ? value.toString() : value + "");
		if (value === "") {
			return null;
		}

		var iFormat, dim, extra,
			iValue = 0,
			shortYearCutoffTemp = (settings ? settings.shortYearCutoff : null) || this._defaults.shortYearCutoff,
			shortYearCutoff = (typeof shortYearCutoffTemp !== "string" ? shortYearCutoffTemp :
				new Date().getFullYear() % 100 + parseInt(shortYearCutoffTemp, 10)),
			dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort,
			dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames,
			monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort,
			monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames,
			year = -1,
			month = -1,
			day = -1,
			doy = -1,
			literal = false,
			date,
			// Check whether a format character is doubled
			lookAhead = function(match) {
				var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
				if (matches) {
					iFormat++;
				}
				return matches;
			},
			// Extract a number from the string value
			getNumber = function(match) {
				var isDoubled = lookAhead(match),
					size = (match === "@" ? 14 : (match === "!" ? 20 :
					(match === "y" && isDoubled ? 4 : (match === "o" ? 3 : 2)))),
					minSize = (match === "y" ? size : 1),
					digits = new RegExp("^\\d{" + minSize + "," + size + "}"),
					num = value.substring(iValue).match(digits);
				if (!num) {
					throw "Missing number at position " + iValue;
				}
				iValue += num[0].length;
				return parseInt(num[0], 10);
			},
			// Extract a name from the string value and convert to an index
			getName = function(match, shortNames, longNames) {
				var index = -1,
					names = $.map(lookAhead(match) ? longNames : shortNames, function (v, k) {
						return [ [k, v] ];
					}).sort(function (a, b) {
						return -(a[1].length - b[1].length);
					});

				$.each(names, function (i, pair) {
					var name = pair[1];
					if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
						index = pair[0];
						iValue += name.length;
						return false;
					}
				});
				if (index !== -1) {
					return index + 1;
				} else {
					throw "Unknown name at position " + iValue;
				}
			},
			// Confirm that a literal character matches the string value
			checkLiteral = function() {
				if (value.charAt(iValue) !== format.charAt(iFormat)) {
					throw "Unexpected literal at position " + iValue;
				}
				iValue++;
			};

		for (iFormat = 0; iFormat < format.length; iFormat++) {
			if (literal) {
				if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
					literal = false;
				} else {
					checkLiteral();
				}
			} else {
				switch (format.charAt(iFormat)) {
					case "d":
						day = getNumber("d");
						break;
					case "D":
						getName("D", dayNamesShort, dayNames);
						break;
					case "o":
						doy = getNumber("o");
						break;
					case "m":
						month = getNumber("m");
						break;
					case "M":
						month = getName("M", monthNamesShort, monthNames);
						break;
					case "y":
						year = getNumber("y");
						break;
					case "@":
						date = new Date(getNumber("@"));
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case "!":
						date = new Date((getNumber("!") - this._ticksTo1970) / 10000);
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case "'":
						if (lookAhead("'")){
							checkLiteral();
						} else {
							literal = true;
						}
						break;
					default:
						checkLiteral();
				}
			}
		}

		if (iValue < value.length){
			extra = value.substr(iValue);
			if (!/^\s+/.test(extra)) {
				throw "Extra/unparsed characters found in date: " + extra;
			}
		}

		if (year === -1) {
			year = new Date().getFullYear();
		} else if (year < 100) {
			year += new Date().getFullYear() - new Date().getFullYear() % 100 +
				(year <= shortYearCutoff ? 0 : -100);
		}

		if (doy > -1) {
			month = 1;
			day = doy;
			do {
				dim = this._getDaysInMonth(year, month - 1);
				if (day <= dim) {
					break;
				}
				month++;
				day -= dim;
			} while (true);
		}

		date = this._daylightSavingAdjust(new Date(year, month - 1, day));
		if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
			throw "Invalid date"; // E.g. 31/02/00
		}
		return date;
	},

	/* Standard date formats. */
	ATOM: "yy-mm-dd", // RFC 3339 (ISO 8601)
	COOKIE: "D, dd M yy",
	ISO_8601: "yy-mm-dd",
	RFC_822: "D, d M y",
	RFC_850: "DD, dd-M-y",
	RFC_1036: "D, d M y",
	RFC_1123: "D, d M yy",
	RFC_2822: "D, d M yy",
	RSS: "D, d M y", // RFC 822
	TICKS: "!",
	TIMESTAMP: "@",
	W3C: "yy-mm-dd", // ISO 8601

	_ticksTo1970: (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
		Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000),

	/* Format a date object into a string value.
	 * The format can be combinations of the following:
	 * d  - day of month (no leading zero)
	 * dd - day of month (two digit)
	 * o  - day of year (no leading zeros)
	 * oo - day of year (three digit)
	 * D  - day name short
	 * DD - day name long
	 * m  - month of year (no leading zero)
	 * mm - month of year (two digit)
	 * M  - month name short
	 * MM - month name long
	 * y  - year (two digit)
	 * yy - year (four digit)
	 * @ - Unix timestamp (ms since 01/01/1970)
	 * ! - Windows ticks (100ns since 01/01/0001)
	 * "..." - literal text
	 * '' - single quote
	 *
	 * @param  format string - the desired format of the date
	 * @param  date Date - the date value to format
	 * @param  settings Object - attributes include:
	 *					dayNamesShort	string[7] - abbreviated names of the days from Sunday (optional)
	 *					dayNames		string[7] - names of the days from Sunday (optional)
	 *					monthNamesShort string[12] - abbreviated names of the months (optional)
	 *					monthNames		string[12] - names of the months (optional)
	 * @return  string - the date in the above format
	 */
	formatDate: function (format, date, settings) {
		if (!date) {
			return "";
		}

		var iFormat,
			dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort,
			dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames,
			monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort,
			monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames,
			// Check whether a format character is doubled
			lookAhead = function(match) {
				var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
				if (matches) {
					iFormat++;
				}
				return matches;
			},
			// Format a number, with leading zero if necessary
			formatNumber = function(match, value, len) {
				var num = "" + value;
				if (lookAhead(match)) {
					while (num.length < len) {
						num = "0" + num;
					}
				}
				return num;
			},
			// Format a name, short or long as requested
			formatName = function(match, value, shortNames, longNames) {
				return (lookAhead(match) ? longNames[value] : shortNames[value]);
			},
			output = "",
			literal = false;

		if (date) {
			for (iFormat = 0; iFormat < format.length; iFormat++) {
				if (literal) {
					if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
						literal = false;
					} else {
						output += format.charAt(iFormat);
					}
				} else {
					switch (format.charAt(iFormat)) {
						case "d":
							output += formatNumber("d", date.getDate(), 2);
							break;
						case "D":
							output += formatName("D", date.getDay(), dayNamesShort, dayNames);
							break;
						case "o":
							output += formatNumber("o",
								Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
							break;
						case "m":
							output += formatNumber("m", date.getMonth() + 1, 2);
							break;
						case "M":
							output += formatName("M", date.getMonth(), monthNamesShort, monthNames);
							break;
						case "y":
							output += (lookAhead("y") ? date.getFullYear() :
								(date.getYear() % 100 < 10 ? "0" : "") + date.getYear() % 100);
							break;
						case "@":
							output += date.getTime();
							break;
						case "!":
							output += date.getTime() * 10000 + this._ticksTo1970;
							break;
						case "'":
							if (lookAhead("'")) {
								output += "'";
							} else {
								literal = true;
							}
							break;
						default:
							output += format.charAt(iFormat);
					}
				}
			}
		}
		return output;
	},

	/* Extract all possible characters from the date format. */
	_possibleChars: function (format) {
		var iFormat,
			chars = "",
			literal = false,
			// Check whether a format character is doubled
			lookAhead = function(match) {
				var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
				if (matches) {
					iFormat++;
				}
				return matches;
			};

		for (iFormat = 0; iFormat < format.length; iFormat++) {
			if (literal) {
				if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
					literal = false;
				} else {
					chars += format.charAt(iFormat);
				}
			} else {
				switch (format.charAt(iFormat)) {
					case "d": case "m": case "y": case "@":
						chars += "0123456789";
						break;
					case "D": case "M":
						return null; // Accept anything
					case "'":
						if (lookAhead("'")) {
							chars += "'";
						} else {
							literal = true;
						}
						break;
					default:
						chars += format.charAt(iFormat);
				}
			}
		}
		return chars;
	},

	/* Get a setting value, defaulting if necessary. */
	_get: function(inst, name) {
		return inst.settings[name] !== undefined ?
			inst.settings[name] : this._defaults[name];
	},

	/* Parse existing date and initialise date picker. */
	_setDateFromField: function(inst, noDefault) {
		if (inst.input.val() === inst.lastVal) {
			return;
		}

		var dateFormat = this._get(inst, "dateFormat"),
			dates = inst.lastVal = inst.input ? inst.input.val() : null,
			defaultDate = this._getDefaultDate(inst),
			date = defaultDate,
			settings = this._getFormatConfig(inst);

		try {
			date = this.parseDate(dateFormat, dates, settings) || defaultDate;
		} catch (event) {
			dates = (noDefault ? "" : dates);
		}
		inst.selectedDay = date.getDate();
		inst.drawMonth = inst.selectedMonth = date.getMonth();
		inst.drawYear = inst.selectedYear = date.getFullYear();
		inst.currentDay = (dates ? date.getDate() : 0);
		inst.currentMonth = (dates ? date.getMonth() : 0);
		inst.currentYear = (dates ? date.getFullYear() : 0);
		this._adjustInstDate(inst);
	},

	/* Retrieve the default date shown on opening. */
	_getDefaultDate: function(inst) {
		return this._restrictMinMax(inst,
			this._determineDate(inst, this._get(inst, "defaultDate"), new Date()));
	},

	/* A date may be specified as an exact value or a relative one. */
	_determineDate: function(inst, date, defaultDate) {
		var offsetNumeric = function(offset) {
				var date = new Date();
				date.setDate(date.getDate() + offset);
				return date;
			},
			offsetString = function(offset) {
				try {
					return $.datepicker.parseDate($.datepicker._get(inst, "dateFormat"),
						offset, $.datepicker._getFormatConfig(inst));
				}
				catch (e) {
					// Ignore
				}

				var date = (offset.toLowerCase().match(/^c/) ?
					$.datepicker._getDate(inst) : null) || new Date(),
					year = date.getFullYear(),
					month = date.getMonth(),
					day = date.getDate(),
					pattern = /([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,
					matches = pattern.exec(offset);

				while (matches) {
					switch (matches[2] || "d") {
						case "d" : case "D" :
							day += parseInt(matches[1],10); break;
						case "w" : case "W" :
							day += parseInt(matches[1],10) * 7; break;
						case "m" : case "M" :
							month += parseInt(matches[1],10);
							day = Math.min(day, $.datepicker._getDaysInMonth(year, month));
							break;
						case "y": case "Y" :
							year += parseInt(matches[1],10);
							day = Math.min(day, $.datepicker._getDaysInMonth(year, month));
							break;
					}
					matches = pattern.exec(offset);
				}
				return new Date(year, month, day);
			},
			newDate = (date == null || date === "" ? defaultDate : (typeof date === "string" ? offsetString(date) :
				(typeof date === "number" ? (isNaN(date) ? defaultDate : offsetNumeric(date)) : new Date(date.getTime()))));

		newDate = (newDate && newDate.toString() === "Invalid Date" ? defaultDate : newDate);
		if (newDate) {
			newDate.setHours(0);
			newDate.setMinutes(0);
			newDate.setSeconds(0);
			newDate.setMilliseconds(0);
		}
		return this._daylightSavingAdjust(newDate);
	},

	/* Handle switch to/from daylight saving.
	 * Hours may be non-zero on daylight saving cut-over:
	 * > 12 when midnight changeover, but then cannot generate
	 * midnight datetime, so jump to 1AM, otherwise reset.
	 * @param  date  (Date) the date to check
	 * @return  (Date) the corrected date
	 */
	_daylightSavingAdjust: function(date) {
		if (!date) {
			return null;
		}
		date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
		return date;
	},

	/* Set the date(s) directly. */
	_setDate: function(inst, date, noChange) {
		var clear = !date,
			origMonth = inst.selectedMonth,
			origYear = inst.selectedYear,
			newDate = this._restrictMinMax(inst, this._determineDate(inst, date, new Date()));

		inst.selectedDay = inst.currentDay = newDate.getDate();
		inst.drawMonth = inst.selectedMonth = inst.currentMonth = newDate.getMonth();
		inst.drawYear = inst.selectedYear = inst.currentYear = newDate.getFullYear();
		if ((origMonth !== inst.selectedMonth || origYear !== inst.selectedYear) && !noChange) {
			this._notifyChange(inst);
		}
		this._adjustInstDate(inst);
		if (inst.input) {
			inst.input.val(clear ? "" : this._formatDate(inst));
		}
	},

	/* Retrieve the date(s) directly. */
	_getDate: function(inst) {
		var startDate = (!inst.currentYear || (inst.input && inst.input.val() === "") ? null :
			this._daylightSavingAdjust(new Date(
			inst.currentYear, inst.currentMonth, inst.currentDay)));
			return startDate;
	},

	/* Attach the onxxx handlers.  These are declared statically so
	 * they work with static code transformers like Caja.
	 */
	_attachHandlers: function(inst) {
		var stepMonths = this._get(inst, "stepMonths"),
			id = "#" + inst.id.replace( /\\\\/g, "\\" );
		inst.dpDiv.find("[data-handler]").map(function () {
			var handler = {
				prev: function () {
					$.datepicker._adjustDate(id, -stepMonths, "M");
				},
				next: function () {
					$.datepicker._adjustDate(id, +stepMonths, "M");
				},
				hide: function () {
					$.datepicker._hideDatepicker();
				},
				today: function () {
					$.datepicker._gotoToday(id);
				},
				selectDay: function () {
					$.datepicker._selectDay(id, +this.getAttribute("data-month"), +this.getAttribute("data-year"), this);
					return false;
				},
				selectMonth: function () {
					$.datepicker._selectMonthYear(id, this, "M");
					return false;
				},
				selectYear: function () {
					$.datepicker._selectMonthYear(id, this, "Y");
					return false;
				}
			};
			$(this).bind(this.getAttribute("data-event"), handler[this.getAttribute("data-handler")]);
		});
	},

	/* Generate the HTML for the current state of the date picker. */
	_generateHTML: function(inst) {
		var maxDraw, prevText, prev, nextText, next, currentText, gotoDate,
			controls, buttonPanel, firstDay, showWeek, dayNames, dayNamesMin,
			monthNames, monthNamesShort, beforeShowDay, showOtherMonths,
			selectOtherMonths, defaultDate, html, dow, row, group, col, selectedDate,
			cornerClass, calender, thead, day, daysInMonth, leadDays, curRows, numRows,
			printDate, dRow, tbody, daySettings, otherMonth, unselectable,
			tempDate = new Date(),
			today = this._daylightSavingAdjust(
				new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())), // clear time
			isRTL = this._get(inst, "isRTL"),
			showButtonPanel = this._get(inst, "showButtonPanel"),
			hideIfNoPrevNext = this._get(inst, "hideIfNoPrevNext"),
			navigationAsDateFormat = this._get(inst, "navigationAsDateFormat"),
			numMonths = this._getNumberOfMonths(inst),
			showCurrentAtPos = this._get(inst, "showCurrentAtPos"),
			stepMonths = this._get(inst, "stepMonths"),
			isMultiMonth = (numMonths[0] !== 1 || numMonths[1] !== 1),
			currentDate = this._daylightSavingAdjust((!inst.currentDay ? new Date(9999, 9, 9) :
				new Date(inst.currentYear, inst.currentMonth, inst.currentDay))),
			minDate = this._getMinMaxDate(inst, "min"),
			maxDate = this._getMinMaxDate(inst, "max"),
			drawMonth = inst.drawMonth - showCurrentAtPos,
			drawYear = inst.drawYear;

		if (drawMonth < 0) {
			drawMonth += 12;
			drawYear--;
		}
		if (maxDate) {
			maxDraw = this._daylightSavingAdjust(new Date(maxDate.getFullYear(),
				maxDate.getMonth() - (numMonths[0] * numMonths[1]) + 1, maxDate.getDate()));
			maxDraw = (minDate && maxDraw < minDate ? minDate : maxDraw);
			while (this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1)) > maxDraw) {
				drawMonth--;
				if (drawMonth < 0) {
					drawMonth = 11;
					drawYear--;
				}
			}
		}
		inst.drawMonth = drawMonth;
		inst.drawYear = drawYear;

		prevText = this._get(inst, "prevText");
		prevText = (!navigationAsDateFormat ? prevText : this.formatDate(prevText,
			this._daylightSavingAdjust(new Date(drawYear, drawMonth - stepMonths, 1)),
			this._getFormatConfig(inst)));

		prev = (this._canAdjustMonth(inst, -1, drawYear, drawMonth) ?
			"<a class='ui-datepicker-prev ui-corner-all' data-handler='prev' data-event='click'" +
			" title='" + prevText + "'><span class='ui-icon ui-icon-circle-triangle-" + ( isRTL ? "e" : "w") + "'>" + prevText + "</span></a>" :
			(hideIfNoPrevNext ? "" : "<a class='ui-datepicker-prev ui-corner-all ui-state-disabled' title='"+ prevText +"'><span class='ui-icon ui-icon-circle-triangle-" + ( isRTL ? "e" : "w") + "'>" + prevText + "</span></a>"));

		nextText = this._get(inst, "nextText");
		nextText = (!navigationAsDateFormat ? nextText : this.formatDate(nextText,
			this._daylightSavingAdjust(new Date(drawYear, drawMonth + stepMonths, 1)),
			this._getFormatConfig(inst)));

		next = (this._canAdjustMonth(inst, +1, drawYear, drawMonth) ?
			"<a class='ui-datepicker-next ui-corner-all' data-handler='next' data-event='click'" +
			" title='" + nextText + "'><span class='ui-icon ui-icon-circle-triangle-" + ( isRTL ? "w" : "e") + "'>" + nextText + "</span></a>" :
			(hideIfNoPrevNext ? "" : "<a class='ui-datepicker-next ui-corner-all ui-state-disabled' title='"+ nextText + "'><span class='ui-icon ui-icon-circle-triangle-" + ( isRTL ? "w" : "e") + "'>" + nextText + "</span></a>"));

		currentText = this._get(inst, "currentText");
		gotoDate = (this._get(inst, "gotoCurrent") && inst.currentDay ? currentDate : today);
		currentText = (!navigationAsDateFormat ? currentText :
			this.formatDate(currentText, gotoDate, this._getFormatConfig(inst)));

		controls = (!inst.inline ? "<button type='button' class='ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all' data-handler='hide' data-event='click'>" +
			this._get(inst, "closeText") + "</button>" : "");

		buttonPanel = (showButtonPanel) ? "<div class='ui-datepicker-buttonpane ui-widget-content'>" + (isRTL ? controls : "") +
			(this._isInRange(inst, gotoDate) ? "<button type='button' class='ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all' data-handler='today' data-event='click'" +
			">" + currentText + "</button>" : "") + (isRTL ? "" : controls) + "</div>" : "";

		firstDay = parseInt(this._get(inst, "firstDay"),10);
		firstDay = (isNaN(firstDay) ? 0 : firstDay);

		showWeek = this._get(inst, "showWeek");
		dayNames = this._get(inst, "dayNames");
		dayNamesMin = this._get(inst, "dayNamesMin");
		monthNames = this._get(inst, "monthNames");
		monthNamesShort = this._get(inst, "monthNamesShort");
		beforeShowDay = this._get(inst, "beforeShowDay");
		showOtherMonths = this._get(inst, "showOtherMonths");
		selectOtherMonths = this._get(inst, "selectOtherMonths");
		defaultDate = this._getDefaultDate(inst);
		html = "";
		dow;
		for (row = 0; row < numMonths[0]; row++) {
			group = "";
			this.maxRows = 4;
			for (col = 0; col < numMonths[1]; col++) {
				selectedDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, inst.selectedDay));
				cornerClass = " ui-corner-all";
				calender = "";
				if (isMultiMonth) {
					calender += "<div class='ui-datepicker-group";
					if (numMonths[1] > 1) {
						switch (col) {
							case 0: calender += " ui-datepicker-group-first";
								cornerClass = " ui-corner-" + (isRTL ? "right" : "left"); break;
							case numMonths[1]-1: calender += " ui-datepicker-group-last";
								cornerClass = " ui-corner-" + (isRTL ? "left" : "right"); break;
							default: calender += " ui-datepicker-group-middle"; cornerClass = ""; break;
						}
					}
					calender += "'>";
				}
				calender += "<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix" + cornerClass + "'>" +
					(/all|left/.test(cornerClass) && row === 0 ? (isRTL ? next : prev) : "") +
					(/all|right/.test(cornerClass) && row === 0 ? (isRTL ? prev : next) : "") +
					this._generateMonthYearHeader(inst, drawMonth, drawYear, minDate, maxDate,
					row > 0 || col > 0, monthNames, monthNamesShort) + // draw month headers
					"</div><table class='ui-datepicker-calendar'><thead>" +
					"<tr>";
				thead = (showWeek ? "<th class='ui-datepicker-week-col'>" + this._get(inst, "weekHeader") + "</th>" : "");
				for (dow = 0; dow < 7; dow++) { // days of the week
					day = (dow + firstDay) % 7;
					thead += "<th scope='col'" + ((dow + firstDay + 6) % 7 >= 5 ? " class='ui-datepicker-week-end'" : "") + ">" +
						"<span title='" + dayNames[day] + "'>" + dayNamesMin[day] + "</span></th>";
				}
				calender += thead + "</tr></thead><tbody>";
				daysInMonth = this._getDaysInMonth(drawYear, drawMonth);
				if (drawYear === inst.selectedYear && drawMonth === inst.selectedMonth) {
					inst.selectedDay = Math.min(inst.selectedDay, daysInMonth);
				}
				leadDays = (this._getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
				curRows = Math.ceil((leadDays + daysInMonth) / 7); // calculate the number of rows to generate
				numRows = (isMultiMonth ? this.maxRows > curRows ? this.maxRows : curRows : curRows); //If multiple months, use the higher number of rows (see #7043)
				this.maxRows = numRows;
				printDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1 - leadDays));
				for (dRow = 0; dRow < numRows; dRow++) { // create date picker rows
					calender += "<tr>";
					tbody = (!showWeek ? "" : "<td class='ui-datepicker-week-col'>" +
						this._get(inst, "calculateWeek")(printDate) + "</td>");
					for (dow = 0; dow < 7; dow++) { // create date picker days
						daySettings = (beforeShowDay ?
							beforeShowDay.apply((inst.input ? inst.input[0] : null), [printDate]) : [true, ""]);
						otherMonth = (printDate.getMonth() !== drawMonth);
						unselectable = (otherMonth && !selectOtherMonths) || !daySettings[0] ||
							(minDate && printDate < minDate) || (maxDate && printDate > maxDate);
						tbody += "<td class='" +
							((dow + firstDay + 6) % 7 >= 5 ? " ui-datepicker-week-end" : "") + // highlight weekends
							(otherMonth ? " ui-datepicker-other-month" : "") + // highlight days from other months
							((printDate.getTime() === selectedDate.getTime() && drawMonth === inst.selectedMonth && inst._keyEvent) || // user pressed key
							(defaultDate.getTime() === printDate.getTime() && defaultDate.getTime() === selectedDate.getTime()) ?
							// or defaultDate is current printedDate and defaultDate is selectedDate
							" " + this._dayOverClass : "") + // highlight selected day
							(unselectable ? " " + this._unselectableClass + " ui-state-disabled": "") +  // highlight unselectable days
							(otherMonth && !showOtherMonths ? "" : " " + daySettings[1] + // highlight custom dates
							(printDate.getTime() === currentDate.getTime() ? " " + this._currentClass : "") + // highlight selected day
							(printDate.getTime() === today.getTime() ? " ui-datepicker-today" : "")) + "'" + // highlight today (if different)
							((!otherMonth || showOtherMonths) && daySettings[2] ? " title='" + daySettings[2].replace(/'/g, "&#39;") + "'" : "") + // cell title
							(unselectable ? "" : " data-handler='selectDay' data-event='click' data-month='" + printDate.getMonth() + "' data-year='" + printDate.getFullYear() + "'") + ">" + // actions
							(otherMonth && !showOtherMonths ? "&#xa0;" : // display for other months
							(unselectable ? "<span class='ui-state-default'>" + printDate.getDate() + "</span>" : "<a class='ui-state-default" +
							(printDate.getTime() === today.getTime() ? " ui-state-highlight" : "") +
							(printDate.getTime() === currentDate.getTime() ? " ui-state-active" : "") + // highlight selected day
							(otherMonth ? " ui-priority-secondary" : "") + // distinguish dates from other months
							"' href='#'>" + printDate.getDate() + "</a>")) + "</td>"; // display selectable date
						printDate.setDate(printDate.getDate() + 1);
						printDate = this._daylightSavingAdjust(printDate);
					}
					calender += tbody + "</tr>";
				}
				drawMonth++;
				if (drawMonth > 11) {
					drawMonth = 0;
					drawYear++;
				}
				calender += "</tbody></table>" + (isMultiMonth ? "</div>" +
							((numMonths[0] > 0 && col === numMonths[1]-1) ? "<div class='ui-datepicker-row-break'></div>" : "") : "");
				group += calender;
			}
			html += group;
		}
		html += buttonPanel;
		inst._keyEvent = false;
		return html;
	},

	/* Generate the month and year header. */
	_generateMonthYearHeader: function(inst, drawMonth, drawYear, minDate, maxDate,
			secondary, monthNames, monthNamesShort) {

		var inMinYear, inMaxYear, month, years, thisYear, determineYear, year, endYear,
			changeMonth = this._get(inst, "changeMonth"),
			changeYear = this._get(inst, "changeYear"),
			showMonthAfterYear = this._get(inst, "showMonthAfterYear"),
			html = "<div class='ui-datepicker-title'>",
			monthHtml = "";

		// month selection
		if (secondary || !changeMonth) {
			monthHtml += "<span class='ui-datepicker-month'>" + monthNames[drawMonth] + "</span>";
		} else {
			inMinYear = (minDate && minDate.getFullYear() === drawYear);
			inMaxYear = (maxDate && maxDate.getFullYear() === drawYear);
			monthHtml += "<select class='ui-datepicker-month' data-handler='selectMonth' data-event='change'>";
			for ( month = 0; month < 12; month++) {
				if ((!inMinYear || month >= minDate.getMonth()) && (!inMaxYear || month <= maxDate.getMonth())) {
					monthHtml += "<option value='" + month + "'" +
						(month === drawMonth ? " selected='selected'" : "") +
						">" + monthNamesShort[month] + "</option>";
				}
			}
			monthHtml += "</select>";
		}

		if (!showMonthAfterYear) {
			html += monthHtml + (secondary || !(changeMonth && changeYear) ? "&#xa0;" : "");
		}

		// year selection
		if ( !inst.yearshtml ) {
			inst.yearshtml = "";
			if (secondary || !changeYear) {
				html += "<span class='ui-datepicker-year'>" + drawYear + "</span>";
			} else {
				// determine range of years to display
				years = this._get(inst, "yearRange").split(":");
				thisYear = new Date().getFullYear();
				determineYear = function(value) {
					var year = (value.match(/c[+\-].*/) ? drawYear + parseInt(value.substring(1), 10) :
						(value.match(/[+\-].*/) ? thisYear + parseInt(value, 10) :
						parseInt(value, 10)));
					return (isNaN(year) ? thisYear : year);
				};
				year = determineYear(years[0]);
				endYear = Math.max(year, determineYear(years[1] || ""));
				year = (minDate ? Math.max(year, minDate.getFullYear()) : year);
				endYear = (maxDate ? Math.min(endYear, maxDate.getFullYear()) : endYear);
				inst.yearshtml += "<select class='ui-datepicker-year' data-handler='selectYear' data-event='change'>";
				for (; year <= endYear; year++) {
					inst.yearshtml += "<option value='" + year + "'" +
						(year === drawYear ? " selected='selected'" : "") +
						">" + year + "</option>";
				}
				inst.yearshtml += "</select>";

				html += inst.yearshtml;
				inst.yearshtml = null;
			}
		}

		html += this._get(inst, "yearSuffix");
		if (showMonthAfterYear) {
			html += (secondary || !(changeMonth && changeYear) ? "&#xa0;" : "") + monthHtml;
		}
		html += "</div>"; // Close datepicker_header
		return html;
	},

	/* Adjust one of the date sub-fields. */
	_adjustInstDate: function(inst, offset, period) {
		var year = inst.drawYear + (period === "Y" ? offset : 0),
			month = inst.drawMonth + (period === "M" ? offset : 0),
			day = Math.min(inst.selectedDay, this._getDaysInMonth(year, month)) + (period === "D" ? offset : 0),
			date = this._restrictMinMax(inst, this._daylightSavingAdjust(new Date(year, month, day)));

		inst.selectedDay = date.getDate();
		inst.drawMonth = inst.selectedMonth = date.getMonth();
		inst.drawYear = inst.selectedYear = date.getFullYear();
		if (period === "M" || period === "Y") {
			this._notifyChange(inst);
		}
	},

	/* Ensure a date is within any min/max bounds. */
	_restrictMinMax: function(inst, date) {
		var minDate = this._getMinMaxDate(inst, "min"),
			maxDate = this._getMinMaxDate(inst, "max"),
			newDate = (minDate && date < minDate ? minDate : date);
		return (maxDate && newDate > maxDate ? maxDate : newDate);
	},

	/* Notify change of month/year. */
	_notifyChange: function(inst) {
		var onChange = this._get(inst, "onChangeMonthYear");
		if (onChange) {
			onChange.apply((inst.input ? inst.input[0] : null),
				[inst.selectedYear, inst.selectedMonth + 1, inst]);
		}
	},

	/* Determine the number of months to show. */
	_getNumberOfMonths: function(inst) {
		var numMonths = this._get(inst, "numberOfMonths");
		return (numMonths == null ? [1, 1] : (typeof numMonths === "number" ? [1, numMonths] : numMonths));
	},

	/* Determine the current maximum date - ensure no time components are set. */
	_getMinMaxDate: function(inst, minMax) {
		return this._determineDate(inst, this._get(inst, minMax + "Date"), null);
	},

	/* Find the number of days in a given month. */
	_getDaysInMonth: function(year, month) {
		return 32 - this._daylightSavingAdjust(new Date(year, month, 32)).getDate();
	},

	/* Find the day of the week of the first of a month. */
	_getFirstDayOfMonth: function(year, month) {
		return new Date(year, month, 1).getDay();
	},

	/* Determines if we should allow a "next/prev" month display change. */
	_canAdjustMonth: function(inst, offset, curYear, curMonth) {
		var numMonths = this._getNumberOfMonths(inst),
			date = this._daylightSavingAdjust(new Date(curYear,
			curMonth + (offset < 0 ? offset : numMonths[0] * numMonths[1]), 1));

		if (offset < 0) {
			date.setDate(this._getDaysInMonth(date.getFullYear(), date.getMonth()));
		}
		return this._isInRange(inst, date);
	},

	/* Is the given date in the accepted range? */
	_isInRange: function(inst, date) {
		var yearSplit, currentYear,
			minDate = this._getMinMaxDate(inst, "min"),
			maxDate = this._getMinMaxDate(inst, "max"),
			minYear = null,
			maxYear = null,
			years = this._get(inst, "yearRange");
			if (years){
				yearSplit = years.split(":");
				currentYear = new Date().getFullYear();
				minYear = parseInt(yearSplit[0], 10);
				maxYear = parseInt(yearSplit[1], 10);
				if ( yearSplit[0].match(/[+\-].*/) ) {
					minYear += currentYear;
				}
				if ( yearSplit[1].match(/[+\-].*/) ) {
					maxYear += currentYear;
				}
			}

		return ((!minDate || date.getTime() >= minDate.getTime()) &&
			(!maxDate || date.getTime() <= maxDate.getTime()) &&
			(!minYear || date.getFullYear() >= minYear) &&
			(!maxYear || date.getFullYear() <= maxYear));
	},

	/* Provide the configuration settings for formatting/parsing. */
	_getFormatConfig: function(inst) {
		var shortYearCutoff = this._get(inst, "shortYearCutoff");
		shortYearCutoff = (typeof shortYearCutoff !== "string" ? shortYearCutoff :
			new Date().getFullYear() % 100 + parseInt(shortYearCutoff, 10));
		return {shortYearCutoff: shortYearCutoff,
			dayNamesShort: this._get(inst, "dayNamesShort"), dayNames: this._get(inst, "dayNames"),
			monthNamesShort: this._get(inst, "monthNamesShort"), monthNames: this._get(inst, "monthNames")};
	},

	/* Format the given date for display. */
	_formatDate: function(inst, day, month, year) {
		if (!day) {
			inst.currentDay = inst.selectedDay;
			inst.currentMonth = inst.selectedMonth;
			inst.currentYear = inst.selectedYear;
		}
		var date = (day ? (typeof day === "object" ? day :
			this._daylightSavingAdjust(new Date(year, month, day))) :
			this._daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay)));
		return this.formatDate(this._get(inst, "dateFormat"), date, this._getFormatConfig(inst));
	}
});

/*
 * Bind hover events for datepicker elements.
 * Done via delegate so the binding only occurs once in the lifetime of the parent div.
 * Global datepicker_instActive, set by _updateDatepicker allows the handlers to find their way back to the active picker.
 */
function datepicker_bindHover(dpDiv) {
	var selector = "button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";
	return dpDiv.delegate(selector, "mouseout", function() {
			$(this).removeClass("ui-state-hover");
			if (this.className.indexOf("ui-datepicker-prev") !== -1) {
				$(this).removeClass("ui-datepicker-prev-hover");
			}
			if (this.className.indexOf("ui-datepicker-next") !== -1) {
				$(this).removeClass("ui-datepicker-next-hover");
			}
		})
		.delegate( selector, "mouseover", datepicker_handleMouseover );
}

function datepicker_handleMouseover() {
	if (!$.datepicker._isDisabledDatepicker( datepicker_instActive.inline? datepicker_instActive.dpDiv.parent()[0] : datepicker_instActive.input[0])) {
		$(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover");
		$(this).addClass("ui-state-hover");
		if (this.className.indexOf("ui-datepicker-prev") !== -1) {
			$(this).addClass("ui-datepicker-prev-hover");
		}
		if (this.className.indexOf("ui-datepicker-next") !== -1) {
			$(this).addClass("ui-datepicker-next-hover");
		}
	}
}

/* jQuery extend now ignores nulls! */
function datepicker_extendRemove(target, props) {
	$.extend(target, props);
	for (var name in props) {
		if (props[name] == null) {
			target[name] = props[name];
		}
	}
	return target;
}

/* Invoke the datepicker functionality.
   @param  options  string - a command, optionally followed by additional parameters or
					Object - settings for attaching new datepicker functionality
   @return  jQuery object */
$.fn.datepicker = function(options){

	/* Verify an empty collection wasn't passed - Fixes #6976 */
	if ( !this.length ) {
		return this;
	}

	/* Initialise the date picker. */
	if (!$.datepicker.initialized) {
		$(document).mousedown($.datepicker._checkExternalClick);
		$.datepicker.initialized = true;
	}

	/* Append datepicker main container to body if not exist. */
	if ($("#"+$.datepicker._mainDivId).length === 0) {
		$("body").append($.datepicker.dpDiv);
	}

	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (typeof options === "string" && (options === "isDisabled" || options === "getDate" || options === "widget")) {
		return $.datepicker["_" + options + "Datepicker"].
			apply($.datepicker, [this[0]].concat(otherArgs));
	}
	if (options === "option" && arguments.length === 2 && typeof arguments[1] === "string") {
		return $.datepicker["_" + options + "Datepicker"].
			apply($.datepicker, [this[0]].concat(otherArgs));
	}
	return this.each(function() {
		typeof options === "string" ?
			$.datepicker["_" + options + "Datepicker"].
				apply($.datepicker, [this].concat(otherArgs)) :
			$.datepicker._attachDatepicker(this, options);
	});
};

$.datepicker = new Datepicker(); // singleton instance
$.datepicker.initialized = false;
$.datepicker.uuid = new Date().getTime();
$.datepicker.version = "1.11.4";

var datepicker = $.datepicker;


/*!
 * jQuery UI Draggable 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/draggable/
 */


$.widget("ui.draggable", $.ui.mouse, {
	version: "1.11.4",
	widgetEventPrefix: "drag",
	options: {
		addClasses: true,
		appendTo: "parent",
		axis: false,
		connectToSortable: false,
		containment: false,
		cursor: "auto",
		cursorAt: false,
		grid: false,
		handle: false,
		helper: "original",
		iframeFix: false,
		opacity: false,
		refreshPositions: false,
		revert: false,
		revertDuration: 500,
		scope: "default",
		scroll: true,
		scrollSensitivity: 20,
		scrollSpeed: 20,
		snap: false,
		snapMode: "both",
		snapTolerance: 20,
		stack: false,
		zIndex: false,

		// callbacks
		drag: null,
		start: null,
		stop: null
	},
	_create: function() {

		if ( this.options.helper === "original" ) {
			this._setPositionRelative();
		}
		if (this.options.addClasses){
			this.element.addClass("ui-draggable");
		}
		if (this.options.disabled){
			this.element.addClass("ui-draggable-disabled");
		}
		this._setHandleClassName();

		this._mouseInit();
	},

	_setOption: function( key, value ) {
		this._super( key, value );
		if ( key === "handle" ) {
			this._removeHandleClassName();
			this._setHandleClassName();
		}
	},

	_destroy: function() {
		if ( ( this.helper || this.element ).is( ".ui-draggable-dragging" ) ) {
			this.destroyOnClear = true;
			return;
		}
		this.element.removeClass( "ui-draggable ui-draggable-dragging ui-draggable-disabled" );
		this._removeHandleClassName();
		this._mouseDestroy();
	},

	_mouseCapture: function(event) {
		var o = this.options;

		this._blurActiveElement( event );

		// among others, prevent a drag on a resizable-handle
		if (this.helper || o.disabled || $(event.target).closest(".ui-resizable-handle").length > 0) {
			return false;
		}

		//Quit if we're not on a valid handle
		this.handle = this._getHandle(event);
		if (!this.handle) {
			return false;
		}

		this._blockFrames( o.iframeFix === true ? "iframe" : o.iframeFix );

		return true;

	},

	_blockFrames: function( selector ) {
		this.iframeBlocks = this.document.find( selector ).map(function() {
			var iframe = $( this );

			return $( "<div>" )
				.css( "position", "absolute" )
				.appendTo( iframe.parent() )
				.outerWidth( iframe.outerWidth() )
				.outerHeight( iframe.outerHeight() )
				.offset( iframe.offset() )[ 0 ];
		});
	},

	_unblockFrames: function() {
		if ( this.iframeBlocks ) {
			this.iframeBlocks.remove();
			delete this.iframeBlocks;
		}
	},

	_blurActiveElement: function( event ) {
		var document = this.document[ 0 ];

		// Only need to blur if the event occurred on the draggable itself, see #10527
		if ( !this.handleElement.is( event.target ) ) {
			return;
		}

		// support: IE9
		// IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
		try {

			// Support: IE9, IE10
			// If the <body> is blurred, IE will switch windows, see #9520
			if ( document.activeElement && document.activeElement.nodeName.toLowerCase() !== "body" ) {

				// Blur any element that currently has focus, see #4261
				$( document.activeElement ).blur();
			}
		} catch ( error ) {}
	},

	_mouseStart: function(event) {

		var o = this.options;

		//Create and append the visible helper
		this.helper = this._createHelper(event);

		this.helper.addClass("ui-draggable-dragging");

		//Cache the helper size
		this._cacheHelperProportions();

		//If ddmanager is used for droppables, set the global draggable
		if ($.ui.ddmanager) {
			$.ui.ddmanager.current = this;
		}

		/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of draggables.
		 */

		//Cache the margins of the original element
		this._cacheMargins();

		//Store the helper's css position
		this.cssPosition = this.helper.css( "position" );
		this.scrollParent = this.helper.scrollParent( true );
		this.offsetParent = this.helper.offsetParent();
		this.hasFixedAncestor = this.helper.parents().filter(function() {
				return $( this ).css( "position" ) === "fixed";
			}).length > 0;

		//The element's absolute position on the page minus margins
		this.positionAbs = this.element.offset();
		this._refreshOffsets( event );

		//Generate the original position
		this.originalPosition = this.position = this._generatePosition( event, false );
		this.originalPageX = event.pageX;
		this.originalPageY = event.pageY;

		//Adjust the mouse offset relative to the helper if "cursorAt" is supplied
		(o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt));

		//Set a containment if given in the options
		this._setContainment();

		//Trigger event + callbacks
		if (this._trigger("start", event) === false) {
			this._clear();
			return false;
		}

		//Recache the helper size
		this._cacheHelperProportions();

		//Prepare the droppable offsets
		if ($.ui.ddmanager && !o.dropBehaviour) {
			$.ui.ddmanager.prepareOffsets(this, event);
		}

		// Reset helper's right/bottom css if they're set and set explicit width/height instead
		// as this prevents resizing of elements with right/bottom set (see #7772)
		this._normalizeRightBottom();

		this._mouseDrag(event, true); //Execute the drag once - this causes the helper not to be visible before getting its correct position

		//If the ddmanager is used for droppables, inform the manager that dragging has started (see #5003)
		if ( $.ui.ddmanager ) {
			$.ui.ddmanager.dragStart(this, event);
		}

		return true;
	},

	_refreshOffsets: function( event ) {
		this.offset = {
			top: this.positionAbs.top - this.margins.top,
			left: this.positionAbs.left - this.margins.left,
			scroll: false,
			parent: this._getParentOffset(),
			relative: this._getRelativeOffset()
		};

		this.offset.click = {
			left: event.pageX - this.offset.left,
			top: event.pageY - this.offset.top
		};
	},

	_mouseDrag: function(event, noPropagation) {
		// reset any necessary cached properties (see #5009)
		if ( this.hasFixedAncestor ) {
			this.offset.parent = this._getParentOffset();
		}

		//Compute the helpers position
		this.position = this._generatePosition( event, true );
		this.positionAbs = this._convertPositionTo("absolute");

		//Call plugins and callbacks and use the resulting position if something is returned
		if (!noPropagation) {
			var ui = this._uiHash();
			if (this._trigger("drag", event, ui) === false) {
				this._mouseUp({});
				return false;
			}
			this.position = ui.position;
		}

		this.helper[ 0 ].style.left = this.position.left + "px";
		this.helper[ 0 ].style.top = this.position.top + "px";

		if ($.ui.ddmanager) {
			$.ui.ddmanager.drag(this, event);
		}

		return false;
	},

	_mouseStop: function(event) {

		//If we are using droppables, inform the manager about the drop
		var that = this,
			dropped = false;
		if ($.ui.ddmanager && !this.options.dropBehaviour) {
			dropped = $.ui.ddmanager.drop(this, event);
		}

		//if a drop comes from outside (a sortable)
		if (this.dropped) {
			dropped = this.dropped;
			this.dropped = false;
		}

		if ((this.options.revert === "invalid" && !dropped) || (this.options.revert === "valid" && dropped) || this.options.revert === true || ($.isFunction(this.options.revert) && this.options.revert.call(this.element, dropped))) {
			$(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function() {
				if (that._trigger("stop", event) !== false) {
					that._clear();
				}
			});
		} else {
			if (this._trigger("stop", event) !== false) {
				this._clear();
			}
		}

		return false;
	},

	_mouseUp: function( event ) {
		this._unblockFrames();

		//If the ddmanager is used for droppables, inform the manager that dragging has stopped (see #5003)
		if ( $.ui.ddmanager ) {
			$.ui.ddmanager.dragStop(this, event);
		}

		// Only need to focus if the event occurred on the draggable itself, see #10527
		if ( this.handleElement.is( event.target ) ) {
			// The interaction is over; whether or not the click resulted in a drag, focus the element
			this.element.focus();
		}

		return $.ui.mouse.prototype._mouseUp.call(this, event);
	},

	cancel: function() {

		if (this.helper.is(".ui-draggable-dragging")) {
			this._mouseUp({});
		} else {
			this._clear();
		}

		return this;

	},

	_getHandle: function(event) {
		return this.options.handle ?
			!!$( event.target ).closest( this.element.find( this.options.handle ) ).length :
			true;
	},

	_setHandleClassName: function() {
		this.handleElement = this.options.handle ?
			this.element.find( this.options.handle ) : this.element;
		this.handleElement.addClass( "ui-draggable-handle" );
	},

	_removeHandleClassName: function() {
		this.handleElement.removeClass( "ui-draggable-handle" );
	},

	_createHelper: function(event) {

		var o = this.options,
			helperIsFunction = $.isFunction( o.helper ),
			helper = helperIsFunction ?
				$( o.helper.apply( this.element[ 0 ], [ event ] ) ) :
				( o.helper === "clone" ?
					this.element.clone().removeAttr( "id" ) :
					this.element );

		if (!helper.parents("body").length) {
			helper.appendTo((o.appendTo === "parent" ? this.element[0].parentNode : o.appendTo));
		}

		// http://bugs.jqueryui.com/ticket/9446
		// a helper function can return the original element
		// which wouldn't have been set to relative in _create
		if ( helperIsFunction && helper[ 0 ] === this.element[ 0 ] ) {
			this._setPositionRelative();
		}

		if (helper[0] !== this.element[0] && !(/(fixed|absolute)/).test(helper.css("position"))) {
			helper.css("position", "absolute");
		}

		return helper;

	},

	_setPositionRelative: function() {
		if ( !( /^(?:r|a|f)/ ).test( this.element.css( "position" ) ) ) {
			this.element[ 0 ].style.position = "relative";
		}
	},

	_adjustOffsetFromHelper: function(obj) {
		if (typeof obj === "string") {
			obj = obj.split(" ");
		}
		if ($.isArray(obj)) {
			obj = { left: +obj[0], top: +obj[1] || 0 };
		}
		if ("left" in obj) {
			this.offset.click.left = obj.left + this.margins.left;
		}
		if ("right" in obj) {
			this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
		}
		if ("top" in obj) {
			this.offset.click.top = obj.top + this.margins.top;
		}
		if ("bottom" in obj) {
			this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
		}
	},

	_isRootNode: function( element ) {
		return ( /(html|body)/i ).test( element.tagName ) || element === this.document[ 0 ];
	},

	_getParentOffset: function() {

		//Get the offsetParent and cache its position
		var po = this.offsetParent.offset(),
			document = this.document[ 0 ];

		// This is a special case where we need to modify a offset calculated on start, since the following happened:
		// 1. The position of the helper is absolute, so it's position is calculated based on the next positioned parent
		// 2. The actual offset parent is a child of the scroll parent, and the scroll parent isn't the document, which means that
		//    the scroll is included in the initial calculation of the offset of the parent, and never recalculated upon drag
		if (this.cssPosition === "absolute" && this.scrollParent[0] !== document && $.contains(this.scrollParent[0], this.offsetParent[0])) {
			po.left += this.scrollParent.scrollLeft();
			po.top += this.scrollParent.scrollTop();
		}

		if ( this._isRootNode( this.offsetParent[ 0 ] ) ) {
			po = { top: 0, left: 0 };
		}

		return {
			top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0),
			left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0)
		};

	},

	_getRelativeOffset: function() {
		if ( this.cssPosition !== "relative" ) {
			return { top: 0, left: 0 };
		}

		var p = this.element.position(),
			scrollIsRootNode = this._isRootNode( this.scrollParent[ 0 ] );

		return {
			top: p.top - ( parseInt(this.helper.css( "top" ), 10) || 0 ) + ( !scrollIsRootNode ? this.scrollParent.scrollTop() : 0 ),
			left: p.left - ( parseInt(this.helper.css( "left" ), 10) || 0 ) + ( !scrollIsRootNode ? this.scrollParent.scrollLeft() : 0 )
		};

	},

	_cacheMargins: function() {
		this.margins = {
			left: (parseInt(this.element.css("marginLeft"), 10) || 0),
			top: (parseInt(this.element.css("marginTop"), 10) || 0),
			right: (parseInt(this.element.css("marginRight"), 10) || 0),
			bottom: (parseInt(this.element.css("marginBottom"), 10) || 0)
		};
	},

	_cacheHelperProportions: function() {
		this.helperProportions = {
			width: this.helper.outerWidth(),
			height: this.helper.outerHeight()
		};
	},

	_setContainment: function() {

		var isUserScrollable, c, ce,
			o = this.options,
			document = this.document[ 0 ];

		this.relativeContainer = null;

		if ( !o.containment ) {
			this.containment = null;
			return;
		}

		if ( o.containment === "window" ) {
			this.containment = [
				$( window ).scrollLeft() - this.offset.relative.left - this.offset.parent.left,
				$( window ).scrollTop() - this.offset.relative.top - this.offset.parent.top,
				$( window ).scrollLeft() + $( window ).width() - this.helperProportions.width - this.margins.left,
				$( window ).scrollTop() + ( $( window ).height() || document.body.parentNode.scrollHeight ) - this.helperProportions.height - this.margins.top
			];
			return;
		}

		if ( o.containment === "document") {
			this.containment = [
				0,
				0,
				$( document ).width() - this.helperProportions.width - this.margins.left,
				( $( document ).height() || document.body.parentNode.scrollHeight ) - this.helperProportions.height - this.margins.top
			];
			return;
		}

		if ( o.containment.constructor === Array ) {
			this.containment = o.containment;
			return;
		}

		if ( o.containment === "parent" ) {
			o.containment = this.helper[ 0 ].parentNode;
		}

		c = $( o.containment );
		ce = c[ 0 ];

		if ( !ce ) {
			return;
		}

		isUserScrollable = /(scroll|auto)/.test( c.css( "overflow" ) );

		this.containment = [
			( parseInt( c.css( "borderLeftWidth" ), 10 ) || 0 ) + ( parseInt( c.css( "paddingLeft" ), 10 ) || 0 ),
			( parseInt( c.css( "borderTopWidth" ), 10 ) || 0 ) + ( parseInt( c.css( "paddingTop" ), 10 ) || 0 ),
			( isUserScrollable ? Math.max( ce.scrollWidth, ce.offsetWidth ) : ce.offsetWidth ) -
				( parseInt( c.css( "borderRightWidth" ), 10 ) || 0 ) -
				( parseInt( c.css( "paddingRight" ), 10 ) || 0 ) -
				this.helperProportions.width -
				this.margins.left -
				this.margins.right,
			( isUserScrollable ? Math.max( ce.scrollHeight, ce.offsetHeight ) : ce.offsetHeight ) -
				( parseInt( c.css( "borderBottomWidth" ), 10 ) || 0 ) -
				( parseInt( c.css( "paddingBottom" ), 10 ) || 0 ) -
				this.helperProportions.height -
				this.margins.top -
				this.margins.bottom
		];
		this.relativeContainer = c;
	},

	_convertPositionTo: function(d, pos) {

		if (!pos) {
			pos = this.position;
		}

		var mod = d === "absolute" ? 1 : -1,
			scrollIsRootNode = this._isRootNode( this.scrollParent[ 0 ] );

		return {
			top: (
				pos.top	+																// The absolute mouse position
				this.offset.relative.top * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.top * mod -										// The offsetParent's offset without borders (offset + border)
				( ( this.cssPosition === "fixed" ? -this.offset.scroll.top : ( scrollIsRootNode ? 0 : this.offset.scroll.top ) ) * mod)
			),
			left: (
				pos.left +																// The absolute mouse position
				this.offset.relative.left * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.left * mod	-										// The offsetParent's offset without borders (offset + border)
				( ( this.cssPosition === "fixed" ? -this.offset.scroll.left : ( scrollIsRootNode ? 0 : this.offset.scroll.left ) ) * mod)
			)
		};

	},

	_generatePosition: function( event, constrainPosition ) {

		var containment, co, top, left,
			o = this.options,
			scrollIsRootNode = this._isRootNode( this.scrollParent[ 0 ] ),
			pageX = event.pageX,
			pageY = event.pageY;

		// Cache the scroll
		if ( !scrollIsRootNode || !this.offset.scroll ) {
			this.offset.scroll = {
				top: this.scrollParent.scrollTop(),
				left: this.scrollParent.scrollLeft()
			};
		}

		/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */

		// If we are not dragging yet, we won't check for options
		if ( constrainPosition ) {
			if ( this.containment ) {
				if ( this.relativeContainer ){
					co = this.relativeContainer.offset();
					containment = [
						this.containment[ 0 ] + co.left,
						this.containment[ 1 ] + co.top,
						this.containment[ 2 ] + co.left,
						this.containment[ 3 ] + co.top
					];
				} else {
					containment = this.containment;
				}

				if (event.pageX - this.offset.click.left < containment[0]) {
					pageX = containment[0] + this.offset.click.left;
				}
				if (event.pageY - this.offset.click.top < containment[1]) {
					pageY = containment[1] + this.offset.click.top;
				}
				if (event.pageX - this.offset.click.left > containment[2]) {
					pageX = containment[2] + this.offset.click.left;
				}
				if (event.pageY - this.offset.click.top > containment[3]) {
					pageY = containment[3] + this.offset.click.top;
				}
			}

			if (o.grid) {
				//Check for grid elements set to 0 to prevent divide by 0 error causing invalid argument errors in IE (see ticket #6950)
				top = o.grid[1] ? this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1] : this.originalPageY;
				pageY = containment ? ((top - this.offset.click.top >= containment[1] || top - this.offset.click.top > containment[3]) ? top : ((top - this.offset.click.top >= containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;

				left = o.grid[0] ? this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0] : this.originalPageX;
				pageX = containment ? ((left - this.offset.click.left >= containment[0] || left - this.offset.click.left > containment[2]) ? left : ((left - this.offset.click.left >= containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
			}

			if ( o.axis === "y" ) {
				pageX = this.originalPageX;
			}

			if ( o.axis === "x" ) {
				pageY = this.originalPageY;
			}
		}

		return {
			top: (
				pageY -																	// The absolute mouse position
				this.offset.click.top	-												// Click offset (relative to the element)
				this.offset.relative.top -												// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.top +												// The offsetParent's offset without borders (offset + border)
				( this.cssPosition === "fixed" ? -this.offset.scroll.top : ( scrollIsRootNode ? 0 : this.offset.scroll.top ) )
			),
			left: (
				pageX -																	// The absolute mouse position
				this.offset.click.left -												// Click offset (relative to the element)
				this.offset.relative.left -												// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.left +												// The offsetParent's offset without borders (offset + border)
				( this.cssPosition === "fixed" ? -this.offset.scroll.left : ( scrollIsRootNode ? 0 : this.offset.scroll.left ) )
			)
		};

	},

	_clear: function() {
		this.helper.removeClass("ui-draggable-dragging");
		if (this.helper[0] !== this.element[0] && !this.cancelHelperRemoval) {
			this.helper.remove();
		}
		this.helper = null;
		this.cancelHelperRemoval = false;
		if ( this.destroyOnClear ) {
			this.destroy();
		}
	},

	_normalizeRightBottom: function() {
		if ( this.options.axis !== "y" && this.helper.css( "right" ) !== "auto" ) {
			this.helper.width( this.helper.width() );
			this.helper.css( "right", "auto" );
		}
		if ( this.options.axis !== "x" && this.helper.css( "bottom" ) !== "auto" ) {
			this.helper.height( this.helper.height() );
			this.helper.css( "bottom", "auto" );
		}
	},

	// From now on bulk stuff - mainly helpers

	_trigger: function( type, event, ui ) {
		ui = ui || this._uiHash();
		$.ui.plugin.call( this, type, [ event, ui, this ], true );

		// Absolute position and offset (see #6884 ) have to be recalculated after plugins
		if ( /^(drag|start|stop)/.test( type ) ) {
			this.positionAbs = this._convertPositionTo( "absolute" );
			ui.offset = this.positionAbs;
		}
		return $.Widget.prototype._trigger.call( this, type, event, ui );
	},

	plugins: {},

	_uiHash: function() {
		return {
			helper: this.helper,
			position: this.position,
			originalPosition: this.originalPosition,
			offset: this.positionAbs
		};
	}

});

$.ui.plugin.add( "draggable", "connectToSortable", {
	start: function( event, ui, draggable ) {
		var uiSortable = $.extend( {}, ui, {
			item: draggable.element
		});

		draggable.sortables = [];
		$( draggable.options.connectToSortable ).each(function() {
			var sortable = $( this ).sortable( "instance" );

			if ( sortable && !sortable.options.disabled ) {
				draggable.sortables.push( sortable );

				// refreshPositions is called at drag start to refresh the containerCache
				// which is used in drag. This ensures it's initialized and synchronized
				// with any changes that might have happened on the page since initialization.
				sortable.refreshPositions();
				sortable._trigger("activate", event, uiSortable);
			}
		});
	},
	stop: function( event, ui, draggable ) {
		var uiSortable = $.extend( {}, ui, {
			item: draggable.element
		});

		draggable.cancelHelperRemoval = false;

		$.each( draggable.sortables, function() {
			var sortable = this;

			if ( sortable.isOver ) {
				sortable.isOver = 0;

				// Allow this sortable to handle removing the helper
				draggable.cancelHelperRemoval = true;
				sortable.cancelHelperRemoval = false;

				// Use _storedCSS To restore properties in the sortable,
				// as this also handles revert (#9675) since the draggable
				// may have modified them in unexpected ways (#8809)
				sortable._storedCSS = {
					position: sortable.placeholder.css( "position" ),
					top: sortable.placeholder.css( "top" ),
					left: sortable.placeholder.css( "left" )
				};

				sortable._mouseStop(event);

				// Once drag has ended, the sortable should return to using
				// its original helper, not the shared helper from draggable
				sortable.options.helper = sortable.options._helper;
			} else {
				// Prevent this Sortable from removing the helper.
				// However, don't set the draggable to remove the helper
				// either as another connected Sortable may yet handle the removal.
				sortable.cancelHelperRemoval = true;

				sortable._trigger( "deactivate", event, uiSortable );
			}
		});
	},
	drag: function( event, ui, draggable ) {
		$.each( draggable.sortables, function() {
			var innermostIntersecting = false,
				sortable = this;

			// Copy over variables that sortable's _intersectsWith uses
			sortable.positionAbs = draggable.positionAbs;
			sortable.helperProportions = draggable.helperProportions;
			sortable.offset.click = draggable.offset.click;

			if ( sortable._intersectsWith( sortable.containerCache ) ) {
				innermostIntersecting = true;

				$.each( draggable.sortables, function() {
					// Copy over variables that sortable's _intersectsWith uses
					this.positionAbs = draggable.positionAbs;
					this.helperProportions = draggable.helperProportions;
					this.offset.click = draggable.offset.click;

					if ( this !== sortable &&
							this._intersectsWith( this.containerCache ) &&
							$.contains( sortable.element[ 0 ], this.element[ 0 ] ) ) {
						innermostIntersecting = false;
					}

					return innermostIntersecting;
				});
			}

			if ( innermostIntersecting ) {
				// If it intersects, we use a little isOver variable and set it once,
				// so that the move-in stuff gets fired only once.
				if ( !sortable.isOver ) {
					sortable.isOver = 1;

					// Store draggable's parent in case we need to reappend to it later.
					draggable._parent = ui.helper.parent();

					sortable.currentItem = ui.helper
						.appendTo( sortable.element )
						.data( "ui-sortable-item", true );

					// Store helper option to later restore it
					sortable.options._helper = sortable.options.helper;

					sortable.options.helper = function() {
						return ui.helper[ 0 ];
					};

					// Fire the start events of the sortable with our passed browser event,
					// and our own helper (so it doesn't create a new one)
					event.target = sortable.currentItem[ 0 ];
					sortable._mouseCapture( event, true );
					sortable._mouseStart( event, true, true );

					// Because the browser event is way off the new appended portlet,
					// modify necessary variables to reflect the changes
					sortable.offset.click.top = draggable.offset.click.top;
					sortable.offset.click.left = draggable.offset.click.left;
					sortable.offset.parent.left -= draggable.offset.parent.left -
						sortable.offset.parent.left;
					sortable.offset.parent.top -= draggable.offset.parent.top -
						sortable.offset.parent.top;

					draggable._trigger( "toSortable", event );

					// Inform draggable that the helper is in a valid drop zone,
					// used solely in the revert option to handle "valid/invalid".
					draggable.dropped = sortable.element;

					// Need to refreshPositions of all sortables in the case that
					// adding to one sortable changes the location of the other sortables (#9675)
					$.each( draggable.sortables, function() {
						this.refreshPositions();
					});

					// hack so receive/update callbacks work (mostly)
					draggable.currentItem = draggable.element;
					sortable.fromOutside = draggable;
				}

				if ( sortable.currentItem ) {
					sortable._mouseDrag( event );
					// Copy the sortable's position because the draggable's can potentially reflect
					// a relative position, while sortable is always absolute, which the dragged
					// element has now become. (#8809)
					ui.position = sortable.position;
				}
			} else {
				// If it doesn't intersect with the sortable, and it intersected before,
				// we fake the drag stop of the sortable, but make sure it doesn't remove
				// the helper by using cancelHelperRemoval.
				if ( sortable.isOver ) {

					sortable.isOver = 0;
					sortable.cancelHelperRemoval = true;

					// Calling sortable's mouseStop would trigger a revert,
					// so revert must be temporarily false until after mouseStop is called.
					sortable.options._revert = sortable.options.revert;
					sortable.options.revert = false;

					sortable._trigger( "out", event, sortable._uiHash( sortable ) );
					sortable._mouseStop( event, true );

					// restore sortable behaviors that were modfied
					// when the draggable entered the sortable area (#9481)
					sortable.options.revert = sortable.options._revert;
					sortable.options.helper = sortable.options._helper;

					if ( sortable.placeholder ) {
						sortable.placeholder.remove();
					}

					// Restore and recalculate the draggable's offset considering the sortable
					// may have modified them in unexpected ways. (#8809, #10669)
					ui.helper.appendTo( draggable._parent );
					draggable._refreshOffsets( event );
					ui.position = draggable._generatePosition( event, true );

					draggable._trigger( "fromSortable", event );

					// Inform draggable that the helper is no longer in a valid drop zone
					draggable.dropped = false;

					// Need to refreshPositions of all sortables just in case removing
					// from one sortable changes the location of other sortables (#9675)
					$.each( draggable.sortables, function() {
						this.refreshPositions();
					});
				}
			}
		});
	}
});

$.ui.plugin.add("draggable", "cursor", {
	start: function( event, ui, instance ) {
		var t = $( "body" ),
			o = instance.options;

		if (t.css("cursor")) {
			o._cursor = t.css("cursor");
		}
		t.css("cursor", o.cursor);
	},
	stop: function( event, ui, instance ) {
		var o = instance.options;
		if (o._cursor) {
			$("body").css("cursor", o._cursor);
		}
	}
});

$.ui.plugin.add("draggable", "opacity", {
	start: function( event, ui, instance ) {
		var t = $( ui.helper ),
			o = instance.options;
		if (t.css("opacity")) {
			o._opacity = t.css("opacity");
		}
		t.css("opacity", o.opacity);
	},
	stop: function( event, ui, instance ) {
		var o = instance.options;
		if (o._opacity) {
			$(ui.helper).css("opacity", o._opacity);
		}
	}
});

$.ui.plugin.add("draggable", "scroll", {
	start: function( event, ui, i ) {
		if ( !i.scrollParentNotHidden ) {
			i.scrollParentNotHidden = i.helper.scrollParent( false );
		}

		if ( i.scrollParentNotHidden[ 0 ] !== i.document[ 0 ] && i.scrollParentNotHidden[ 0 ].tagName !== "HTML" ) {
			i.overflowOffset = i.scrollParentNotHidden.offset();
		}
	},
	drag: function( event, ui, i  ) {

		var o = i.options,
			scrolled = false,
			scrollParent = i.scrollParentNotHidden[ 0 ],
			document = i.document[ 0 ];

		if ( scrollParent !== document && scrollParent.tagName !== "HTML" ) {
			if ( !o.axis || o.axis !== "x" ) {
				if ( ( i.overflowOffset.top + scrollParent.offsetHeight ) - event.pageY < o.scrollSensitivity ) {
					scrollParent.scrollTop = scrolled = scrollParent.scrollTop + o.scrollSpeed;
				} else if ( event.pageY - i.overflowOffset.top < o.scrollSensitivity ) {
					scrollParent.scrollTop = scrolled = scrollParent.scrollTop - o.scrollSpeed;
				}
			}

			if ( !o.axis || o.axis !== "y" ) {
				if ( ( i.overflowOffset.left + scrollParent.offsetWidth ) - event.pageX < o.scrollSensitivity ) {
					scrollParent.scrollLeft = scrolled = scrollParent.scrollLeft + o.scrollSpeed;
				} else if ( event.pageX - i.overflowOffset.left < o.scrollSensitivity ) {
					scrollParent.scrollLeft = scrolled = scrollParent.scrollLeft - o.scrollSpeed;
				}
			}

		} else {

			if (!o.axis || o.axis !== "x") {
				if (event.pageY - $(document).scrollTop() < o.scrollSensitivity) {
					scrolled = $(document).scrollTop($(document).scrollTop() - o.scrollSpeed);
				} else if ($(window).height() - (event.pageY - $(document).scrollTop()) < o.scrollSensitivity) {
					scrolled = $(document).scrollTop($(document).scrollTop() + o.scrollSpeed);
				}
			}

			if (!o.axis || o.axis !== "y") {
				if (event.pageX - $(document).scrollLeft() < o.scrollSensitivity) {
					scrolled = $(document).scrollLeft($(document).scrollLeft() - o.scrollSpeed);
				} else if ($(window).width() - (event.pageX - $(document).scrollLeft()) < o.scrollSensitivity) {
					scrolled = $(document).scrollLeft($(document).scrollLeft() + o.scrollSpeed);
				}
			}

		}

		if (scrolled !== false && $.ui.ddmanager && !o.dropBehaviour) {
			$.ui.ddmanager.prepareOffsets(i, event);
		}

	}
});

$.ui.plugin.add("draggable", "snap", {
	start: function( event, ui, i ) {

		var o = i.options;

		i.snapElements = [];

		$(o.snap.constructor !== String ? ( o.snap.items || ":data(ui-draggable)" ) : o.snap).each(function() {
			var $t = $(this),
				$o = $t.offset();
			if (this !== i.element[0]) {
				i.snapElements.push({
					item: this,
					width: $t.outerWidth(), height: $t.outerHeight(),
					top: $o.top, left: $o.left
				});
			}
		});

	},
	drag: function( event, ui, inst ) {

		var ts, bs, ls, rs, l, r, t, b, i, first,
			o = inst.options,
			d = o.snapTolerance,
			x1 = ui.offset.left, x2 = x1 + inst.helperProportions.width,
			y1 = ui.offset.top, y2 = y1 + inst.helperProportions.height;

		for (i = inst.snapElements.length - 1; i >= 0; i--){

			l = inst.snapElements[i].left - inst.margins.left;
			r = l + inst.snapElements[i].width;
			t = inst.snapElements[i].top - inst.margins.top;
			b = t + inst.snapElements[i].height;

			if ( x2 < l - d || x1 > r + d || y2 < t - d || y1 > b + d || !$.contains( inst.snapElements[ i ].item.ownerDocument, inst.snapElements[ i ].item ) ) {
				if (inst.snapElements[i].snapping) {
					(inst.options.snap.release && inst.options.snap.release.call(inst.element, event, $.extend(inst._uiHash(), { snapItem: inst.snapElements[i].item })));
				}
				inst.snapElements[i].snapping = false;
				continue;
			}

			if (o.snapMode !== "inner") {
				ts = Math.abs(t - y2) <= d;
				bs = Math.abs(b - y1) <= d;
				ls = Math.abs(l - x2) <= d;
				rs = Math.abs(r - x1) <= d;
				if (ts) {
					ui.position.top = inst._convertPositionTo("relative", { top: t - inst.helperProportions.height, left: 0 }).top;
				}
				if (bs) {
					ui.position.top = inst._convertPositionTo("relative", { top: b, left: 0 }).top;
				}
				if (ls) {
					ui.position.left = inst._convertPositionTo("relative", { top: 0, left: l - inst.helperProportions.width }).left;
				}
				if (rs) {
					ui.position.left = inst._convertPositionTo("relative", { top: 0, left: r }).left;
				}
			}

			first = (ts || bs || ls || rs);

			if (o.snapMode !== "outer") {
				ts = Math.abs(t - y1) <= d;
				bs = Math.abs(b - y2) <= d;
				ls = Math.abs(l - x1) <= d;
				rs = Math.abs(r - x2) <= d;
				if (ts) {
					ui.position.top = inst._convertPositionTo("relative", { top: t, left: 0 }).top;
				}
				if (bs) {
					ui.position.top = inst._convertPositionTo("relative", { top: b - inst.helperProportions.height, left: 0 }).top;
				}
				if (ls) {
					ui.position.left = inst._convertPositionTo("relative", { top: 0, left: l }).left;
				}
				if (rs) {
					ui.position.left = inst._convertPositionTo("relative", { top: 0, left: r - inst.helperProportions.width }).left;
				}
			}

			if (!inst.snapElements[i].snapping && (ts || bs || ls || rs || first)) {
				(inst.options.snap.snap && inst.options.snap.snap.call(inst.element, event, $.extend(inst._uiHash(), { snapItem: inst.snapElements[i].item })));
			}
			inst.snapElements[i].snapping = (ts || bs || ls || rs || first);

		}

	}
});

$.ui.plugin.add("draggable", "stack", {
	start: function( event, ui, instance ) {
		var min,
			o = instance.options,
			group = $.makeArray($(o.stack)).sort(function(a, b) {
				return (parseInt($(a).css("zIndex"), 10) || 0) - (parseInt($(b).css("zIndex"), 10) || 0);
			});

		if (!group.length) { return; }

		min = parseInt($(group[0]).css("zIndex"), 10) || 0;
		$(group).each(function(i) {
			$(this).css("zIndex", min + i);
		});
		this.css("zIndex", (min + group.length));
	}
});

$.ui.plugin.add("draggable", "zIndex", {
	start: function( event, ui, instance ) {
		var t = $( ui.helper ),
			o = instance.options;

		if (t.css("zIndex")) {
			o._zIndex = t.css("zIndex");
		}
		t.css("zIndex", o.zIndex);
	},
	stop: function( event, ui, instance ) {
		var o = instance.options;

		if (o._zIndex) {
			$(ui.helper).css("zIndex", o._zIndex);
		}
	}
});

var draggable = $.ui.draggable;


/*!
 * jQuery UI Resizable 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/resizable/
 */


$.widget("ui.resizable", $.ui.mouse, {
	version: "1.11.4",
	widgetEventPrefix: "resize",
	options: {
		alsoResize: false,
		animate: false,
		animateDuration: "slow",
		animateEasing: "swing",
		aspectRatio: false,
		autoHide: false,
		containment: false,
		ghost: false,
		grid: false,
		handles: "e,s,se",
		helper: false,
		maxHeight: null,
		maxWidth: null,
		minHeight: 10,
		minWidth: 10,
		// See #7960
		zIndex: 90,

		// callbacks
		resize: null,
		start: null,
		stop: null
	},

	_num: function( value ) {
		return parseInt( value, 10 ) || 0;
	},

	_isNumber: function( value ) {
		return !isNaN( parseInt( value, 10 ) );
	},

	_hasScroll: function( el, a ) {

		if ( $( el ).css( "overflow" ) === "hidden") {
			return false;
		}

		var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
			has = false;

		if ( el[ scroll ] > 0 ) {
			return true;
		}

		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		el[ scroll ] = 1;
		has = ( el[ scroll ] > 0 );
		el[ scroll ] = 0;
		return has;
	},

	_create: function() {

		var n, i, handle, axis, hname,
			that = this,
			o = this.options;
		this.element.addClass("ui-resizable");

		$.extend(this, {
			_aspectRatio: !!(o.aspectRatio),
			aspectRatio: o.aspectRatio,
			originalElement: this.element,
			_proportionallyResizeElements: [],
			_helper: o.helper || o.ghost || o.animate ? o.helper || "ui-resizable-helper" : null
		});

		// Wrap the element if it cannot hold child nodes
		if (this.element[0].nodeName.match(/^(canvas|textarea|input|select|button|img)$/i)) {

			this.element.wrap(
				$("<div class='ui-wrapper' style='overflow: hidden;'></div>").css({
					position: this.element.css("position"),
					width: this.element.outerWidth(),
					height: this.element.outerHeight(),
					top: this.element.css("top"),
					left: this.element.css("left")
				})
			);

			this.element = this.element.parent().data(
				"ui-resizable", this.element.resizable( "instance" )
			);

			this.elementIsWrapper = true;

			this.element.css({
				marginLeft: this.originalElement.css("marginLeft"),
				marginTop: this.originalElement.css("marginTop"),
				marginRight: this.originalElement.css("marginRight"),
				marginBottom: this.originalElement.css("marginBottom")
			});
			this.originalElement.css({
				marginLeft: 0,
				marginTop: 0,
				marginRight: 0,
				marginBottom: 0
			});
			// support: Safari
			// Prevent Safari textarea resize
			this.originalResizeStyle = this.originalElement.css("resize");
			this.originalElement.css("resize", "none");

			this._proportionallyResizeElements.push( this.originalElement.css({
				position: "static",
				zoom: 1,
				display: "block"
			}) );

			// support: IE9
			// avoid IE jump (hard set the margin)
			this.originalElement.css({ margin: this.originalElement.css("margin") });

			this._proportionallyResize();
		}

		this.handles = o.handles ||
			( !$(".ui-resizable-handle", this.element).length ?
				"e,s,se" : {
					n: ".ui-resizable-n",
					e: ".ui-resizable-e",
					s: ".ui-resizable-s",
					w: ".ui-resizable-w",
					se: ".ui-resizable-se",
					sw: ".ui-resizable-sw",
					ne: ".ui-resizable-ne",
					nw: ".ui-resizable-nw"
				} );

		this._handles = $();
		if ( this.handles.constructor === String ) {

			if ( this.handles === "all") {
				this.handles = "n,e,s,w,se,sw,ne,nw";
			}

			n = this.handles.split(",");
			this.handles = {};

			for (i = 0; i < n.length; i++) {

				handle = $.trim(n[i]);
				hname = "ui-resizable-" + handle;
				axis = $("<div class='ui-resizable-handle " + hname + "'></div>");

				axis.css({ zIndex: o.zIndex });

				// TODO : What's going on here?
				if ("se" === handle) {
					axis.addClass("ui-icon ui-icon-gripsmall-diagonal-se");
				}

				this.handles[handle] = ".ui-resizable-" + handle;
				this.element.append(axis);
			}

		}

		this._renderAxis = function(target) {

			var i, axis, padPos, padWrapper;

			target = target || this.element;

			for (i in this.handles) {

				if (this.handles[i].constructor === String) {
					this.handles[i] = this.element.children( this.handles[ i ] ).first().show();
				} else if ( this.handles[ i ].jquery || this.handles[ i ].nodeType ) {
					this.handles[ i ] = $( this.handles[ i ] );
					this._on( this.handles[ i ], { "mousedown": that._mouseDown });
				}

				if (this.elementIsWrapper && this.originalElement[0].nodeName.match(/^(textarea|input|select|button)$/i)) {

					axis = $(this.handles[i], this.element);

					padWrapper = /sw|ne|nw|se|n|s/.test(i) ? axis.outerHeight() : axis.outerWidth();

					padPos = [ "padding",
						/ne|nw|n/.test(i) ? "Top" :
						/se|sw|s/.test(i) ? "Bottom" :
						/^e$/.test(i) ? "Right" : "Left" ].join("");

					target.css(padPos, padWrapper);

					this._proportionallyResize();
				}

				this._handles = this._handles.add( this.handles[ i ] );
			}
		};

		// TODO: make renderAxis a prototype function
		this._renderAxis(this.element);

		this._handles = this._handles.add( this.element.find( ".ui-resizable-handle" ) );
		this._handles.disableSelection();

		this._handles.mouseover(function() {
			if (!that.resizing) {
				if (this.className) {
					axis = this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i);
				}
				that.axis = axis && axis[1] ? axis[1] : "se";
			}
		});

		if (o.autoHide) {
			this._handles.hide();
			$(this.element)
				.addClass("ui-resizable-autohide")
				.mouseenter(function() {
					if (o.disabled) {
						return;
					}
					$(this).removeClass("ui-resizable-autohide");
					that._handles.show();
				})
				.mouseleave(function() {
					if (o.disabled) {
						return;
					}
					if (!that.resizing) {
						$(this).addClass("ui-resizable-autohide");
						that._handles.hide();
					}
				});
		}

		this._mouseInit();
	},

	_destroy: function() {

		this._mouseDestroy();

		var wrapper,
			_destroy = function(exp) {
				$(exp)
					.removeClass("ui-resizable ui-resizable-disabled ui-resizable-resizing")
					.removeData("resizable")
					.removeData("ui-resizable")
					.unbind(".resizable")
					.find(".ui-resizable-handle")
						.remove();
			};

		// TODO: Unwrap at same DOM position
		if (this.elementIsWrapper) {
			_destroy(this.element);
			wrapper = this.element;
			this.originalElement.css({
				position: wrapper.css("position"),
				width: wrapper.outerWidth(),
				height: wrapper.outerHeight(),
				top: wrapper.css("top"),
				left: wrapper.css("left")
			}).insertAfter( wrapper );
			wrapper.remove();
		}

		this.originalElement.css("resize", this.originalResizeStyle);
		_destroy(this.originalElement);

		return this;
	},

	_mouseCapture: function(event) {
		var i, handle,
			capture = false;

		for (i in this.handles) {
			handle = $(this.handles[i])[0];
			if (handle === event.target || $.contains(handle, event.target)) {
				capture = true;
			}
		}

		return !this.options.disabled && capture;
	},

	_mouseStart: function(event) {

		var curleft, curtop, cursor,
			o = this.options,
			el = this.element;

		this.resizing = true;

		this._renderProxy();

		curleft = this._num(this.helper.css("left"));
		curtop = this._num(this.helper.css("top"));

		if (o.containment) {
			curleft += $(o.containment).scrollLeft() || 0;
			curtop += $(o.containment).scrollTop() || 0;
		}

		this.offset = this.helper.offset();
		this.position = { left: curleft, top: curtop };

		this.size = this._helper ? {
				width: this.helper.width(),
				height: this.helper.height()
			} : {
				width: el.width(),
				height: el.height()
			};

		this.originalSize = this._helper ? {
				width: el.outerWidth(),
				height: el.outerHeight()
			} : {
				width: el.width(),
				height: el.height()
			};

		this.sizeDiff = {
			width: el.outerWidth() - el.width(),
			height: el.outerHeight() - el.height()
		};

		this.originalPosition = { left: curleft, top: curtop };
		this.originalMousePosition = { left: event.pageX, top: event.pageY };

		this.aspectRatio = (typeof o.aspectRatio === "number") ?
			o.aspectRatio :
			((this.originalSize.width / this.originalSize.height) || 1);

		cursor = $(".ui-resizable-" + this.axis).css("cursor");
		$("body").css("cursor", cursor === "auto" ? this.axis + "-resize" : cursor);

		el.addClass("ui-resizable-resizing");
		this._propagate("start", event);
		return true;
	},

	_mouseDrag: function(event) {

		var data, props,
			smp = this.originalMousePosition,
			a = this.axis,
			dx = (event.pageX - smp.left) || 0,
			dy = (event.pageY - smp.top) || 0,
			trigger = this._change[a];

		this._updatePrevProperties();

		if (!trigger) {
			return false;
		}

		data = trigger.apply(this, [ event, dx, dy ]);

		this._updateVirtualBoundaries(event.shiftKey);
		if (this._aspectRatio || event.shiftKey) {
			data = this._updateRatio(data, event);
		}

		data = this._respectSize(data, event);

		this._updateCache(data);

		this._propagate("resize", event);

		props = this._applyChanges();

		if ( !this._helper && this._proportionallyResizeElements.length ) {
			this._proportionallyResize();
		}

		if ( !$.isEmptyObject( props ) ) {
			this._updatePrevProperties();
			this._trigger( "resize", event, this.ui() );
			this._applyChanges();
		}

		return false;
	},

	_mouseStop: function(event) {

		this.resizing = false;
		var pr, ista, soffseth, soffsetw, s, left, top,
			o = this.options, that = this;

		if (this._helper) {

			pr = this._proportionallyResizeElements;
			ista = pr.length && (/textarea/i).test(pr[0].nodeName);
			soffseth = ista && this._hasScroll(pr[0], "left") ? 0 : that.sizeDiff.height;
			soffsetw = ista ? 0 : that.sizeDiff.width;

			s = {
				width: (that.helper.width()  - soffsetw),
				height: (that.helper.height() - soffseth)
			};
			left = (parseInt(that.element.css("left"), 10) +
				(that.position.left - that.originalPosition.left)) || null;
			top = (parseInt(that.element.css("top"), 10) +
				(that.position.top - that.originalPosition.top)) || null;

			if (!o.animate) {
				this.element.css($.extend(s, { top: top, left: left }));
			}

			that.helper.height(that.size.height);
			that.helper.width(that.size.width);

			if (this._helper && !o.animate) {
				this._proportionallyResize();
			}
		}

		$("body").css("cursor", "auto");

		this.element.removeClass("ui-resizable-resizing");

		this._propagate("stop", event);

		if (this._helper) {
			this.helper.remove();
		}

		return false;

	},

	_updatePrevProperties: function() {
		this.prevPosition = {
			top: this.position.top,
			left: this.position.left
		};
		this.prevSize = {
			width: this.size.width,
			height: this.size.height
		};
	},

	_applyChanges: function() {
		var props = {};

		if ( this.position.top !== this.prevPosition.top ) {
			props.top = this.position.top + "px";
		}
		if ( this.position.left !== this.prevPosition.left ) {
			props.left = this.position.left + "px";
		}
		if ( this.size.width !== this.prevSize.width ) {
			props.width = this.size.width + "px";
		}
		if ( this.size.height !== this.prevSize.height ) {
			props.height = this.size.height + "px";
		}

		this.helper.css( props );

		return props;
	},

	_updateVirtualBoundaries: function(forceAspectRatio) {
		var pMinWidth, pMaxWidth, pMinHeight, pMaxHeight, b,
			o = this.options;

		b = {
			minWidth: this._isNumber(o.minWidth) ? o.minWidth : 0,
			maxWidth: this._isNumber(o.maxWidth) ? o.maxWidth : Infinity,
			minHeight: this._isNumber(o.minHeight) ? o.minHeight : 0,
			maxHeight: this._isNumber(o.maxHeight) ? o.maxHeight : Infinity
		};

		if (this._aspectRatio || forceAspectRatio) {
			pMinWidth = b.minHeight * this.aspectRatio;
			pMinHeight = b.minWidth / this.aspectRatio;
			pMaxWidth = b.maxHeight * this.aspectRatio;
			pMaxHeight = b.maxWidth / this.aspectRatio;

			if (pMinWidth > b.minWidth) {
				b.minWidth = pMinWidth;
			}
			if (pMinHeight > b.minHeight) {
				b.minHeight = pMinHeight;
			}
			if (pMaxWidth < b.maxWidth) {
				b.maxWidth = pMaxWidth;
			}
			if (pMaxHeight < b.maxHeight) {
				b.maxHeight = pMaxHeight;
			}
		}
		this._vBoundaries = b;
	},

	_updateCache: function(data) {
		this.offset = this.helper.offset();
		if (this._isNumber(data.left)) {
			this.position.left = data.left;
		}
		if (this._isNumber(data.top)) {
			this.position.top = data.top;
		}
		if (this._isNumber(data.height)) {
			this.size.height = data.height;
		}
		if (this._isNumber(data.width)) {
			this.size.width = data.width;
		}
	},

	_updateRatio: function( data ) {

		var cpos = this.position,
			csize = this.size,
			a = this.axis;

		if (this._isNumber(data.height)) {
			data.width = (data.height * this.aspectRatio);
		} else if (this._isNumber(data.width)) {
			data.height = (data.width / this.aspectRatio);
		}

		if (a === "sw") {
			data.left = cpos.left + (csize.width - data.width);
			data.top = null;
		}
		if (a === "nw") {
			data.top = cpos.top + (csize.height - data.height);
			data.left = cpos.left + (csize.width - data.width);
		}

		return data;
	},

	_respectSize: function( data ) {

		var o = this._vBoundaries,
			a = this.axis,
			ismaxw = this._isNumber(data.width) && o.maxWidth && (o.maxWidth < data.width),
			ismaxh = this._isNumber(data.height) && o.maxHeight && (o.maxHeight < data.height),
			isminw = this._isNumber(data.width) && o.minWidth && (o.minWidth > data.width),
			isminh = this._isNumber(data.height) && o.minHeight && (o.minHeight > data.height),
			dw = this.originalPosition.left + this.originalSize.width,
			dh = this.position.top + this.size.height,
			cw = /sw|nw|w/.test(a), ch = /nw|ne|n/.test(a);
		if (isminw) {
			data.width = o.minWidth;
		}
		if (isminh) {
			data.height = o.minHeight;
		}
		if (ismaxw) {
			data.width = o.maxWidth;
		}
		if (ismaxh) {
			data.height = o.maxHeight;
		}

		if (isminw && cw) {
			data.left = dw - o.minWidth;
		}
		if (ismaxw && cw) {
			data.left = dw - o.maxWidth;
		}
		if (isminh && ch) {
			data.top = dh - o.minHeight;
		}
		if (ismaxh && ch) {
			data.top = dh - o.maxHeight;
		}

		// Fixing jump error on top/left - bug #2330
		if (!data.width && !data.height && !data.left && data.top) {
			data.top = null;
		} else if (!data.width && !data.height && !data.top && data.left) {
			data.left = null;
		}

		return data;
	},

	_getPaddingPlusBorderDimensions: function( element ) {
		var i = 0,
			widths = [],
			borders = [
				element.css( "borderTopWidth" ),
				element.css( "borderRightWidth" ),
				element.css( "borderBottomWidth" ),
				element.css( "borderLeftWidth" )
			],
			paddings = [
				element.css( "paddingTop" ),
				element.css( "paddingRight" ),
				element.css( "paddingBottom" ),
				element.css( "paddingLeft" )
			];

		for ( ; i < 4; i++ ) {
			widths[ i ] = ( parseInt( borders[ i ], 10 ) || 0 );
			widths[ i ] += ( parseInt( paddings[ i ], 10 ) || 0 );
		}

		return {
			height: widths[ 0 ] + widths[ 2 ],
			width: widths[ 1 ] + widths[ 3 ]
		};
	},

	_proportionallyResize: function() {

		if (!this._proportionallyResizeElements.length) {
			return;
		}

		var prel,
			i = 0,
			element = this.helper || this.element;

		for ( ; i < this._proportionallyResizeElements.length; i++) {

			prel = this._proportionallyResizeElements[i];

			// TODO: Seems like a bug to cache this.outerDimensions
			// considering that we are in a loop.
			if (!this.outerDimensions) {
				this.outerDimensions = this._getPaddingPlusBorderDimensions( prel );
			}

			prel.css({
				height: (element.height() - this.outerDimensions.height) || 0,
				width: (element.width() - this.outerDimensions.width) || 0
			});

		}

	},

	_renderProxy: function() {

		var el = this.element, o = this.options;
		this.elementOffset = el.offset();

		if (this._helper) {

			this.helper = this.helper || $("<div style='overflow:hidden;'></div>");

			this.helper.addClass(this._helper).css({
				width: this.element.outerWidth() - 1,
				height: this.element.outerHeight() - 1,
				position: "absolute",
				left: this.elementOffset.left + "px",
				top: this.elementOffset.top + "px",
				zIndex: ++o.zIndex //TODO: Don't modify option
			});

			this.helper
				.appendTo("body")
				.disableSelection();

		} else {
			this.helper = this.element;
		}

	},

	_change: {
		e: function(event, dx) {
			return { width: this.originalSize.width + dx };
		},
		w: function(event, dx) {
			var cs = this.originalSize, sp = this.originalPosition;
			return { left: sp.left + dx, width: cs.width - dx };
		},
		n: function(event, dx, dy) {
			var cs = this.originalSize, sp = this.originalPosition;
			return { top: sp.top + dy, height: cs.height - dy };
		},
		s: function(event, dx, dy) {
			return { height: this.originalSize.height + dy };
		},
		se: function(event, dx, dy) {
			return $.extend(this._change.s.apply(this, arguments),
				this._change.e.apply(this, [ event, dx, dy ]));
		},
		sw: function(event, dx, dy) {
			return $.extend(this._change.s.apply(this, arguments),
				this._change.w.apply(this, [ event, dx, dy ]));
		},
		ne: function(event, dx, dy) {
			return $.extend(this._change.n.apply(this, arguments),
				this._change.e.apply(this, [ event, dx, dy ]));
		},
		nw: function(event, dx, dy) {
			return $.extend(this._change.n.apply(this, arguments),
				this._change.w.apply(this, [ event, dx, dy ]));
		}
	},

	_propagate: function(n, event) {
		$.ui.plugin.call(this, n, [ event, this.ui() ]);
		(n !== "resize" && this._trigger(n, event, this.ui()));
	},

	plugins: {},

	ui: function() {
		return {
			originalElement: this.originalElement,
			element: this.element,
			helper: this.helper,
			position: this.position,
			size: this.size,
			originalSize: this.originalSize,
			originalPosition: this.originalPosition
		};
	}

});

/*
 * Resizable Extensions
 */

$.ui.plugin.add("resizable", "animate", {

	stop: function( event ) {
		var that = $(this).resizable( "instance" ),
			o = that.options,
			pr = that._proportionallyResizeElements,
			ista = pr.length && (/textarea/i).test(pr[0].nodeName),
			soffseth = ista && that._hasScroll(pr[0], "left") ? 0 : that.sizeDiff.height,
			soffsetw = ista ? 0 : that.sizeDiff.width,
			style = { width: (that.size.width - soffsetw), height: (that.size.height - soffseth) },
			left = (parseInt(that.element.css("left"), 10) +
				(that.position.left - that.originalPosition.left)) || null,
			top = (parseInt(that.element.css("top"), 10) +
				(that.position.top - that.originalPosition.top)) || null;

		that.element.animate(
			$.extend(style, top && left ? { top: top, left: left } : {}), {
				duration: o.animateDuration,
				easing: o.animateEasing,
				step: function() {

					var data = {
						width: parseInt(that.element.css("width"), 10),
						height: parseInt(that.element.css("height"), 10),
						top: parseInt(that.element.css("top"), 10),
						left: parseInt(that.element.css("left"), 10)
					};

					if (pr && pr.length) {
						$(pr[0]).css({ width: data.width, height: data.height });
					}

					// propagating resize, and updating values for each animation step
					that._updateCache(data);
					that._propagate("resize", event);

				}
			}
		);
	}

});

$.ui.plugin.add( "resizable", "containment", {

	start: function() {
		var element, p, co, ch, cw, width, height,
			that = $( this ).resizable( "instance" ),
			o = that.options,
			el = that.element,
			oc = o.containment,
			ce = ( oc instanceof $ ) ? oc.get( 0 ) : ( /parent/.test( oc ) ) ? el.parent().get( 0 ) : oc;

		if ( !ce ) {
			return;
		}

		that.containerElement = $( ce );

		if ( /document/.test( oc ) || oc === document ) {
			that.containerOffset = {
				left: 0,
				top: 0
			};
			that.containerPosition = {
				left: 0,
				top: 0
			};

			that.parentData = {
				element: $( document ),
				left: 0,
				top: 0,
				width: $( document ).width(),
				height: $( document ).height() || document.body.parentNode.scrollHeight
			};
		} else {
			element = $( ce );
			p = [];
			$([ "Top", "Right", "Left", "Bottom" ]).each(function( i, name ) {
				p[ i ] = that._num( element.css( "padding" + name ) );
			});

			that.containerOffset = element.offset();
			that.containerPosition = element.position();
			that.containerSize = {
				height: ( element.innerHeight() - p[ 3 ] ),
				width: ( element.innerWidth() - p[ 1 ] )
			};

			co = that.containerOffset;
			ch = that.containerSize.height;
			cw = that.containerSize.width;
			width = ( that._hasScroll ( ce, "left" ) ? ce.scrollWidth : cw );
			height = ( that._hasScroll ( ce ) ? ce.scrollHeight : ch ) ;

			that.parentData = {
				element: ce,
				left: co.left,
				top: co.top,
				width: width,
				height: height
			};
		}
	},

	resize: function( event ) {
		var woset, hoset, isParent, isOffsetRelative,
			that = $( this ).resizable( "instance" ),
			o = that.options,
			co = that.containerOffset,
			cp = that.position,
			pRatio = that._aspectRatio || event.shiftKey,
			cop = {
				top: 0,
				left: 0
			},
			ce = that.containerElement,
			continueResize = true;

		if ( ce[ 0 ] !== document && ( /static/ ).test( ce.css( "position" ) ) ) {
			cop = co;
		}

		if ( cp.left < ( that._helper ? co.left : 0 ) ) {
			that.size.width = that.size.width +
				( that._helper ?
					( that.position.left - co.left ) :
					( that.position.left - cop.left ) );

			if ( pRatio ) {
				that.size.height = that.size.width / that.aspectRatio;
				continueResize = false;
			}
			that.position.left = o.helper ? co.left : 0;
		}

		if ( cp.top < ( that._helper ? co.top : 0 ) ) {
			that.size.height = that.size.height +
				( that._helper ?
					( that.position.top - co.top ) :
					that.position.top );

			if ( pRatio ) {
				that.size.width = that.size.height * that.aspectRatio;
				continueResize = false;
			}
			that.position.top = that._helper ? co.top : 0;
		}

		isParent = that.containerElement.get( 0 ) === that.element.parent().get( 0 );
		isOffsetRelative = /relative|absolute/.test( that.containerElement.css( "position" ) );

		if ( isParent && isOffsetRelative ) {
			that.offset.left = that.parentData.left + that.position.left;
			that.offset.top = that.parentData.top + that.position.top;
		} else {
			that.offset.left = that.element.offset().left;
			that.offset.top = that.element.offset().top;
		}

		woset = Math.abs( that.sizeDiff.width +
			(that._helper ?
				that.offset.left - cop.left :
				(that.offset.left - co.left)) );

		hoset = Math.abs( that.sizeDiff.height +
			(that._helper ?
				that.offset.top - cop.top :
				(that.offset.top - co.top)) );

		if ( woset + that.size.width >= that.parentData.width ) {
			that.size.width = that.parentData.width - woset;
			if ( pRatio ) {
				that.size.height = that.size.width / that.aspectRatio;
				continueResize = false;
			}
		}

		if ( hoset + that.size.height >= that.parentData.height ) {
			that.size.height = that.parentData.height - hoset;
			if ( pRatio ) {
				that.size.width = that.size.height * that.aspectRatio;
				continueResize = false;
			}
		}

		if ( !continueResize ) {
			that.position.left = that.prevPosition.left;
			that.position.top = that.prevPosition.top;
			that.size.width = that.prevSize.width;
			that.size.height = that.prevSize.height;
		}
	},

	stop: function() {
		var that = $( this ).resizable( "instance" ),
			o = that.options,
			co = that.containerOffset,
			cop = that.containerPosition,
			ce = that.containerElement,
			helper = $( that.helper ),
			ho = helper.offset(),
			w = helper.outerWidth() - that.sizeDiff.width,
			h = helper.outerHeight() - that.sizeDiff.height;

		if ( that._helper && !o.animate && ( /relative/ ).test( ce.css( "position" ) ) ) {
			$( this ).css({
				left: ho.left - cop.left - co.left,
				width: w,
				height: h
			});
		}

		if ( that._helper && !o.animate && ( /static/ ).test( ce.css( "position" ) ) ) {
			$( this ).css({
				left: ho.left - cop.left - co.left,
				width: w,
				height: h
			});
		}
	}
});

$.ui.plugin.add("resizable", "alsoResize", {

	start: function() {
		var that = $(this).resizable( "instance" ),
			o = that.options;

		$(o.alsoResize).each(function() {
			var el = $(this);
			el.data("ui-resizable-alsoresize", {
				width: parseInt(el.width(), 10), height: parseInt(el.height(), 10),
				left: parseInt(el.css("left"), 10), top: parseInt(el.css("top"), 10)
			});
		});
	},

	resize: function(event, ui) {
		var that = $(this).resizable( "instance" ),
			o = that.options,
			os = that.originalSize,
			op = that.originalPosition,
			delta = {
				height: (that.size.height - os.height) || 0,
				width: (that.size.width - os.width) || 0,
				top: (that.position.top - op.top) || 0,
				left: (that.position.left - op.left) || 0
			};

			$(o.alsoResize).each(function() {
				var el = $(this), start = $(this).data("ui-resizable-alsoresize"), style = {},
					css = el.parents(ui.originalElement[0]).length ?
							[ "width", "height" ] :
							[ "width", "height", "top", "left" ];

				$.each(css, function(i, prop) {
					var sum = (start[prop] || 0) + (delta[prop] || 0);
					if (sum && sum >= 0) {
						style[prop] = sum || null;
					}
				});

				el.css(style);
			});
	},

	stop: function() {
		$(this).removeData("resizable-alsoresize");
	}
});

$.ui.plugin.add("resizable", "ghost", {

	start: function() {

		var that = $(this).resizable( "instance" ), o = that.options, cs = that.size;

		that.ghost = that.originalElement.clone();
		that.ghost
			.css({
				opacity: 0.25,
				display: "block",
				position: "relative",
				height: cs.height,
				width: cs.width,
				margin: 0,
				left: 0,
				top: 0
			})
			.addClass("ui-resizable-ghost")
			.addClass(typeof o.ghost === "string" ? o.ghost : "");

		that.ghost.appendTo(that.helper);

	},

	resize: function() {
		var that = $(this).resizable( "instance" );
		if (that.ghost) {
			that.ghost.css({
				position: "relative",
				height: that.size.height,
				width: that.size.width
			});
		}
	},

	stop: function() {
		var that = $(this).resizable( "instance" );
		if (that.ghost && that.helper) {
			that.helper.get(0).removeChild(that.ghost.get(0));
		}
	}

});

$.ui.plugin.add("resizable", "grid", {

	resize: function() {
		var outerDimensions,
			that = $(this).resizable( "instance" ),
			o = that.options,
			cs = that.size,
			os = that.originalSize,
			op = that.originalPosition,
			a = that.axis,
			grid = typeof o.grid === "number" ? [ o.grid, o.grid ] : o.grid,
			gridX = (grid[0] || 1),
			gridY = (grid[1] || 1),
			ox = Math.round((cs.width - os.width) / gridX) * gridX,
			oy = Math.round((cs.height - os.height) / gridY) * gridY,
			newWidth = os.width + ox,
			newHeight = os.height + oy,
			isMaxWidth = o.maxWidth && (o.maxWidth < newWidth),
			isMaxHeight = o.maxHeight && (o.maxHeight < newHeight),
			isMinWidth = o.minWidth && (o.minWidth > newWidth),
			isMinHeight = o.minHeight && (o.minHeight > newHeight);

		o.grid = grid;

		if (isMinWidth) {
			newWidth += gridX;
		}
		if (isMinHeight) {
			newHeight += gridY;
		}
		if (isMaxWidth) {
			newWidth -= gridX;
		}
		if (isMaxHeight) {
			newHeight -= gridY;
		}

		if (/^(se|s|e)$/.test(a)) {
			that.size.width = newWidth;
			that.size.height = newHeight;
		} else if (/^(ne)$/.test(a)) {
			that.size.width = newWidth;
			that.size.height = newHeight;
			that.position.top = op.top - oy;
		} else if (/^(sw)$/.test(a)) {
			that.size.width = newWidth;
			that.size.height = newHeight;
			that.position.left = op.left - ox;
		} else {
			if ( newHeight - gridY <= 0 || newWidth - gridX <= 0) {
				outerDimensions = that._getPaddingPlusBorderDimensions( this );
			}

			if ( newHeight - gridY > 0 ) {
				that.size.height = newHeight;
				that.position.top = op.top - oy;
			} else {
				newHeight = gridY - outerDimensions.height;
				that.size.height = newHeight;
				that.position.top = op.top + os.height - newHeight;
			}
			if ( newWidth - gridX > 0 ) {
				that.size.width = newWidth;
				that.position.left = op.left - ox;
			} else {
				newWidth = gridX - outerDimensions.width;
				that.size.width = newWidth;
				that.position.left = op.left + os.width - newWidth;
			}
		}
	}

});

var resizable = $.ui.resizable;


/*!
 * jQuery UI Dialog 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/dialog/
 */


var dialog = $.widget( "ui.dialog", {
	version: "1.11.4",
	options: {
		appendTo: "body",
		autoOpen: true,
		buttons: [],
		closeOnEscape: true,
		closeText: "Close",
		dialogClass: "",
		draggable: true,
		hide: null,
		height: "auto",
		maxHeight: null,
		maxWidth: null,
		minHeight: 150,
		minWidth: 150,
		modal: false,
		position: {
			my: "center",
			at: "center",
			of: window,
			collision: "fit",
			// Ensure the titlebar is always visible
			using: function( pos ) {
				var topOffset = $( this ).css( pos ).offset().top;
				if ( topOffset < 0 ) {
					$( this ).css( "top", pos.top - topOffset );
				}
			}
		},
		resizable: true,
		show: null,
		title: null,
		width: 300,

		// callbacks
		beforeClose: null,
		close: null,
		drag: null,
		dragStart: null,
		dragStop: null,
		focus: null,
		open: null,
		resize: null,
		resizeStart: null,
		resizeStop: null
	},

	sizeRelatedOptions: {
		buttons: true,
		height: true,
		maxHeight: true,
		maxWidth: true,
		minHeight: true,
		minWidth: true,
		width: true
	},

	resizableRelatedOptions: {
		maxHeight: true,
		maxWidth: true,
		minHeight: true,
		minWidth: true
	},

	_create: function() {
		this.originalCss = {
			display: this.element[ 0 ].style.display,
			width: this.element[ 0 ].style.width,
			minHeight: this.element[ 0 ].style.minHeight,
			maxHeight: this.element[ 0 ].style.maxHeight,
			height: this.element[ 0 ].style.height
		};
		this.originalPosition = {
			parent: this.element.parent(),
			index: this.element.parent().children().index( this.element )
		};
		this.originalTitle = this.element.attr( "title" );
		this.options.title = this.options.title || this.originalTitle;

		this._createWrapper();

		this.element
			.show()
			.removeAttr( "title" )
			.addClass( "ui-dialog-content ui-widget-content" )
			.appendTo( this.uiDialog );

		this._createTitlebar();
		this._createButtonPane();

		if ( this.options.draggable && $.fn.draggable ) {
			this._makeDraggable();
		}
		if ( this.options.resizable && $.fn.resizable ) {
			this._makeResizable();
		}

		this._isOpen = false;

		this._trackFocus();
	},

	_init: function() {
		if ( this.options.autoOpen ) {
			this.open();
		}
	},

	_appendTo: function() {
		var element = this.options.appendTo;
		if ( element && (element.jquery || element.nodeType) ) {
			return $( element );
		}
		return this.document.find( element || "body" ).eq( 0 );
	},

	_destroy: function() {
		var next,
			originalPosition = this.originalPosition;

		this._untrackInstance();
		this._destroyOverlay();

		this.element
			.removeUniqueId()
			.removeClass( "ui-dialog-content ui-widget-content" )
			.css( this.originalCss )
			// Without detaching first, the following becomes really slow
			.detach();

		this.uiDialog.stop( true, true ).remove();

		if ( this.originalTitle ) {
			this.element.attr( "title", this.originalTitle );
		}

		next = originalPosition.parent.children().eq( originalPosition.index );
		// Don't try to place the dialog next to itself (#8613)
		if ( next.length && next[ 0 ] !== this.element[ 0 ] ) {
			next.before( this.element );
		} else {
			originalPosition.parent.append( this.element );
		}
	},

	widget: function() {
		return this.uiDialog;
	},

	disable: $.noop,
	enable: $.noop,

	close: function( event ) {
		var activeElement,
			that = this;

		if ( !this._isOpen || this._trigger( "beforeClose", event ) === false ) {
			return;
		}

		this._isOpen = false;
		this._focusedElement = null;
		this._destroyOverlay();
		this._untrackInstance();

		if ( !this.opener.filter( ":focusable" ).focus().length ) {

			// support: IE9
			// IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
			try {
				activeElement = this.document[ 0 ].activeElement;

				// Support: IE9, IE10
				// If the <body> is blurred, IE will switch windows, see #4520
				if ( activeElement && activeElement.nodeName.toLowerCase() !== "body" ) {

					// Hiding a focused element doesn't trigger blur in WebKit
					// so in case we have nothing to focus on, explicitly blur the active element
					// https://bugs.webkit.org/show_bug.cgi?id=47182
					$( activeElement ).blur();
				}
			} catch ( error ) {}
		}

		this._hide( this.uiDialog, this.options.hide, function() {
			that._trigger( "close", event );
		});
	},

	isOpen: function() {
		return this._isOpen;
	},

	moveToTop: function() {
		this._moveToTop();
	},

	_moveToTop: function( event, silent ) {
		var moved = false,
			zIndices = this.uiDialog.siblings( ".ui-front:visible" ).map(function() {
				return +$( this ).css( "z-index" );
			}).get(),
			zIndexMax = Math.max.apply( null, zIndices );

		if ( zIndexMax >= +this.uiDialog.css( "z-index" ) ) {
			this.uiDialog.css( "z-index", zIndexMax + 1 );
			moved = true;
		}

		if ( moved && !silent ) {
			this._trigger( "focus", event );
		}
		return moved;
	},

	open: function() {
		var that = this;
		if ( this._isOpen ) {
			if ( this._moveToTop() ) {
				this._focusTabbable();
			}
			return;
		}

		this._isOpen = true;
		this.opener = $( this.document[ 0 ].activeElement );

		this._size();
		this._position();
		this._createOverlay();
		this._moveToTop( null, true );

		// Ensure the overlay is moved to the top with the dialog, but only when
		// opening. The overlay shouldn't move after the dialog is open so that
		// modeless dialogs opened after the modal dialog stack properly.
		if ( this.overlay ) {
			this.overlay.css( "z-index", this.uiDialog.css( "z-index" ) - 1 );
		}

		this._show( this.uiDialog, this.options.show, function() {
			that._focusTabbable();
			that._trigger( "focus" );
		});

		// Track the dialog immediately upon openening in case a focus event
		// somehow occurs outside of the dialog before an element inside the
		// dialog is focused (#10152)
		this._makeFocusTarget();

		this._trigger( "open" );
	},

	_focusTabbable: function() {
		// Set focus to the first match:
		// 1. An element that was focused previously
		// 2. First element inside the dialog matching [autofocus]
		// 3. Tabbable element inside the content element
		// 4. Tabbable element inside the buttonpane
		// 5. The close button
		// 6. The dialog itself
		var hasFocus = this._focusedElement;
		if ( !hasFocus ) {
			hasFocus = this.element.find( "[autofocus]" );
		}
		if ( !hasFocus.length ) {
			hasFocus = this.element.find( ":tabbable" );
		}
		if ( !hasFocus.length ) {
			hasFocus = this.uiDialogButtonPane.find( ":tabbable" );
		}
		if ( !hasFocus.length ) {
			hasFocus = this.uiDialogTitlebarClose.filter( ":tabbable" );
		}
		if ( !hasFocus.length ) {
			hasFocus = this.uiDialog;
		}
		hasFocus.eq( 0 ).focus();
	},

	_keepFocus: function( event ) {
		function checkFocus() {
			var activeElement = this.document[0].activeElement,
				isActive = this.uiDialog[0] === activeElement ||
					$.contains( this.uiDialog[0], activeElement );
			if ( !isActive ) {
				this._focusTabbable();
			}
		}
		event.preventDefault();
		checkFocus.call( this );
		// support: IE
		// IE <= 8 doesn't prevent moving focus even with event.preventDefault()
		// so we check again later
		this._delay( checkFocus );
	},

	_createWrapper: function() {
		this.uiDialog = $("<div>")
			.addClass( "ui-dialog ui-widget ui-widget-content ui-corner-all ui-front " +
				this.options.dialogClass )
			.hide()
			.attr({
				// Setting tabIndex makes the div focusable
				tabIndex: -1,
				role: "dialog"
			})
			.appendTo( this._appendTo() );

		this._on( this.uiDialog, {
			keydown: function( event ) {
				if ( this.options.closeOnEscape && !event.isDefaultPrevented() && event.keyCode &&
						event.keyCode === $.ui.keyCode.ESCAPE ) {
					event.preventDefault();
					this.close( event );
					return;
				}

				// prevent tabbing out of dialogs
				if ( event.keyCode !== $.ui.keyCode.TAB || event.isDefaultPrevented() ) {
					return;
				}
				var tabbables = this.uiDialog.find( ":tabbable" ),
					first = tabbables.filter( ":first" ),
					last = tabbables.filter( ":last" );

				if ( ( event.target === last[0] || event.target === this.uiDialog[0] ) && !event.shiftKey ) {
					this._delay(function() {
						first.focus();
					});
					event.preventDefault();
				} else if ( ( event.target === first[0] || event.target === this.uiDialog[0] ) && event.shiftKey ) {
					this._delay(function() {
						last.focus();
					});
					event.preventDefault();
				}
			},
			mousedown: function( event ) {
				if ( this._moveToTop( event ) ) {
					this._focusTabbable();
				}
			}
		});

		// We assume that any existing aria-describedby attribute means
		// that the dialog content is marked up properly
		// otherwise we brute force the content as the description
		if ( !this.element.find( "[aria-describedby]" ).length ) {
			this.uiDialog.attr({
				"aria-describedby": this.element.uniqueId().attr( "id" )
			});
		}
	},

	_createTitlebar: function() {
		var uiDialogTitle;

		this.uiDialogTitlebar = $( "<div>" )
			.addClass( "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix" )
			.prependTo( this.uiDialog );
		this._on( this.uiDialogTitlebar, {
			mousedown: function( event ) {
				// Don't prevent click on close button (#8838)
				// Focusing a dialog that is partially scrolled out of view
				// causes the browser to scroll it into view, preventing the click event
				if ( !$( event.target ).closest( ".ui-dialog-titlebar-close" ) ) {
					// Dialog isn't getting focus when dragging (#8063)
					this.uiDialog.focus();
				}
			}
		});

		// support: IE
		// Use type="button" to prevent enter keypresses in textboxes from closing the
		// dialog in IE (#9312)
		this.uiDialogTitlebarClose = $( "<button type='button'></button>" )
			.button({
				label: this.options.closeText,
				icons: {
					primary: "ui-icon-closethick"
				},
				text: false
			})
			.addClass( "ui-dialog-titlebar-close" )
			.appendTo( this.uiDialogTitlebar );
		this._on( this.uiDialogTitlebarClose, {
			click: function( event ) {
				event.preventDefault();
				this.close( event );
			}
		});

		uiDialogTitle = $( "<span>" )
			.uniqueId()
			.addClass( "ui-dialog-title" )
			.prependTo( this.uiDialogTitlebar );
		this._title( uiDialogTitle );

		this.uiDialog.attr({
			"aria-labelledby": uiDialogTitle.attr( "id" )
		});
	},

	_title: function( title ) {
		if ( !this.options.title ) {
			title.html( "&#160;" );
		}
		title.text( this.options.title );
	},

	_createButtonPane: function() {
		this.uiDialogButtonPane = $( "<div>" )
			.addClass( "ui-dialog-buttonpane ui-widget-content ui-helper-clearfix" );

		this.uiButtonSet = $( "<div>" )
			.addClass( "ui-dialog-buttonset" )
			.appendTo( this.uiDialogButtonPane );

		this._createButtons();
	},

	_createButtons: function() {
		var that = this,
			buttons = this.options.buttons;

		// if we already have a button pane, remove it
		this.uiDialogButtonPane.remove();
		this.uiButtonSet.empty();

		if ( $.isEmptyObject( buttons ) || ($.isArray( buttons ) && !buttons.length) ) {
			this.uiDialog.removeClass( "ui-dialog-buttons" );
			return;
		}

		$.each( buttons, function( name, props ) {
			var click, buttonOptions;
			props = $.isFunction( props ) ?
				{ click: props, text: name } :
				props;
			// Default to a non-submitting button
			props = $.extend( { type: "button" }, props );
			// Change the context for the click callback to be the main element
			click = props.click;
			props.click = function() {
				click.apply( that.element[ 0 ], arguments );
			};
			buttonOptions = {
				icons: props.icons,
				text: props.showText
			};
			delete props.icons;
			delete props.showText;
			$( "<button></button>", props )
				.button( buttonOptions )
				.appendTo( that.uiButtonSet );
		});
		this.uiDialog.addClass( "ui-dialog-buttons" );
		this.uiDialogButtonPane.appendTo( this.uiDialog );
	},

	_makeDraggable: function() {
		var that = this,
			options = this.options;

		function filteredUi( ui ) {
			return {
				position: ui.position,
				offset: ui.offset
			};
		}

		this.uiDialog.draggable({
			cancel: ".ui-dialog-content, .ui-dialog-titlebar-close",
			handle: ".ui-dialog-titlebar",
			containment: "document",
			start: function( event, ui ) {
				$( this ).addClass( "ui-dialog-dragging" );
				that._blockFrames();
				that._trigger( "dragStart", event, filteredUi( ui ) );
			},
			drag: function( event, ui ) {
				that._trigger( "drag", event, filteredUi( ui ) );
			},
			stop: function( event, ui ) {
				var left = ui.offset.left - that.document.scrollLeft(),
					top = ui.offset.top - that.document.scrollTop();

				options.position = {
					my: "left top",
					at: "left" + (left >= 0 ? "+" : "") + left + " " +
						"top" + (top >= 0 ? "+" : "") + top,
					of: that.window
				};
				$( this ).removeClass( "ui-dialog-dragging" );
				that._unblockFrames();
				that._trigger( "dragStop", event, filteredUi( ui ) );
			}
		});
	},

	_makeResizable: function() {
		var that = this,
			options = this.options,
			handles = options.resizable,
			// .ui-resizable has position: relative defined in the stylesheet
			// but dialogs have to use absolute or fixed positioning
			position = this.uiDialog.css("position"),
			resizeHandles = typeof handles === "string" ?
				handles	:
				"n,e,s,w,se,sw,ne,nw";

		function filteredUi( ui ) {
			return {
				originalPosition: ui.originalPosition,
				originalSize: ui.originalSize,
				position: ui.position,
				size: ui.size
			};
		}

		this.uiDialog.resizable({
			cancel: ".ui-dialog-content",
			containment: "document",
			alsoResize: this.element,
			maxWidth: options.maxWidth,
			maxHeight: options.maxHeight,
			minWidth: options.minWidth,
			minHeight: this._minHeight(),
			handles: resizeHandles,
			start: function( event, ui ) {
				$( this ).addClass( "ui-dialog-resizing" );
				that._blockFrames();
				that._trigger( "resizeStart", event, filteredUi( ui ) );
			},
			resize: function( event, ui ) {
				that._trigger( "resize", event, filteredUi( ui ) );
			},
			stop: function( event, ui ) {
				var offset = that.uiDialog.offset(),
					left = offset.left - that.document.scrollLeft(),
					top = offset.top - that.document.scrollTop();

				options.height = that.uiDialog.height();
				options.width = that.uiDialog.width();
				options.position = {
					my: "left top",
					at: "left" + (left >= 0 ? "+" : "") + left + " " +
						"top" + (top >= 0 ? "+" : "") + top,
					of: that.window
				};
				$( this ).removeClass( "ui-dialog-resizing" );
				that._unblockFrames();
				that._trigger( "resizeStop", event, filteredUi( ui ) );
			}
		})
		.css( "position", position );
	},

	_trackFocus: function() {
		this._on( this.widget(), {
			focusin: function( event ) {
				this._makeFocusTarget();
				this._focusedElement = $( event.target );
			}
		});
	},

	_makeFocusTarget: function() {
		this._untrackInstance();
		this._trackingInstances().unshift( this );
	},

	_untrackInstance: function() {
		var instances = this._trackingInstances(),
			exists = $.inArray( this, instances );
		if ( exists !== -1 ) {
			instances.splice( exists, 1 );
		}
	},

	_trackingInstances: function() {
		var instances = this.document.data( "ui-dialog-instances" );
		if ( !instances ) {
			instances = [];
			this.document.data( "ui-dialog-instances", instances );
		}
		return instances;
	},

	_minHeight: function() {
		var options = this.options;

		return options.height === "auto" ?
			options.minHeight :
			Math.min( options.minHeight, options.height );
	},

	_position: function() {
		// Need to show the dialog to get the actual offset in the position plugin
		var isVisible = this.uiDialog.is( ":visible" );
		if ( !isVisible ) {
			this.uiDialog.show();
		}
		this.uiDialog.position( this.options.position );
		if ( !isVisible ) {
			this.uiDialog.hide();
		}
	},

	_setOptions: function( options ) {
		var that = this,
			resize = false,
			resizableOptions = {};

		$.each( options, function( key, value ) {
			that._setOption( key, value );

			if ( key in that.sizeRelatedOptions ) {
				resize = true;
			}
			if ( key in that.resizableRelatedOptions ) {
				resizableOptions[ key ] = value;
			}
		});

		if ( resize ) {
			this._size();
			this._position();
		}
		if ( this.uiDialog.is( ":data(ui-resizable)" ) ) {
			this.uiDialog.resizable( "option", resizableOptions );
		}
	},

	_setOption: function( key, value ) {
		var isDraggable, isResizable,
			uiDialog = this.uiDialog;

		if ( key === "dialogClass" ) {
			uiDialog
				.removeClass( this.options.dialogClass )
				.addClass( value );
		}

		if ( key === "disabled" ) {
			return;
		}

		this._super( key, value );

		if ( key === "appendTo" ) {
			this.uiDialog.appendTo( this._appendTo() );
		}

		if ( key === "buttons" ) {
			this._createButtons();
		}

		if ( key === "closeText" ) {
			this.uiDialogTitlebarClose.button({
				// Ensure that we always pass a string
				label: "" + value
			});
		}

		if ( key === "draggable" ) {
			isDraggable = uiDialog.is( ":data(ui-draggable)" );
			if ( isDraggable && !value ) {
				uiDialog.draggable( "destroy" );
			}

			if ( !isDraggable && value ) {
				this._makeDraggable();
			}
		}

		if ( key === "position" ) {
			this._position();
		}

		if ( key === "resizable" ) {
			// currently resizable, becoming non-resizable
			isResizable = uiDialog.is( ":data(ui-resizable)" );
			if ( isResizable && !value ) {
				uiDialog.resizable( "destroy" );
			}

			// currently resizable, changing handles
			if ( isResizable && typeof value === "string" ) {
				uiDialog.resizable( "option", "handles", value );
			}

			// currently non-resizable, becoming resizable
			if ( !isResizable && value !== false ) {
				this._makeResizable();
			}
		}

		if ( key === "title" ) {
			this._title( this.uiDialogTitlebar.find( ".ui-dialog-title" ) );
		}
	},

	_size: function() {
		// If the user has resized the dialog, the .ui-dialog and .ui-dialog-content
		// divs will both have width and height set, so we need to reset them
		var nonContentHeight, minContentHeight, maxContentHeight,
			options = this.options;

		// Reset content sizing
		this.element.show().css({
			width: "auto",
			minHeight: 0,
			maxHeight: "none",
			height: 0
		});

		if ( options.minWidth > options.width ) {
			options.width = options.minWidth;
		}

		// reset wrapper sizing
		// determine the height of all the non-content elements
		nonContentHeight = this.uiDialog.css({
				height: "auto",
				width: options.width
			})
			.outerHeight();
		minContentHeight = Math.max( 0, options.minHeight - nonContentHeight );
		maxContentHeight = typeof options.maxHeight === "number" ?
			Math.max( 0, options.maxHeight - nonContentHeight ) :
			"none";

		if ( options.height === "auto" ) {
			this.element.css({
				minHeight: minContentHeight,
				maxHeight: maxContentHeight,
				height: "auto"
			});
		} else {
			this.element.height( Math.max( 0, options.height - nonContentHeight ) );
		}

		if ( this.uiDialog.is( ":data(ui-resizable)" ) ) {
			this.uiDialog.resizable( "option", "minHeight", this._minHeight() );
		}
	},

	_blockFrames: function() {
		this.iframeBlocks = this.document.find( "iframe" ).map(function() {
			var iframe = $( this );

			return $( "<div>" )
				.css({
					position: "absolute",
					width: iframe.outerWidth(),
					height: iframe.outerHeight()
				})
				.appendTo( iframe.parent() )
				.offset( iframe.offset() )[0];
		});
	},

	_unblockFrames: function() {
		if ( this.iframeBlocks ) {
			this.iframeBlocks.remove();
			delete this.iframeBlocks;
		}
	},

	_allowInteraction: function( event ) {
		if ( $( event.target ).closest( ".ui-dialog" ).length ) {
			return true;
		}

		// TODO: Remove hack when datepicker implements
		// the .ui-front logic (#8989)
		return !!$( event.target ).closest( ".ui-datepicker" ).length;
	},

	_createOverlay: function() {
		if ( !this.options.modal ) {
			return;
		}

		// We use a delay in case the overlay is created from an
		// event that we're going to be cancelling (#2804)
		var isOpening = true;
		this._delay(function() {
			isOpening = false;
		});

		if ( !this.document.data( "ui-dialog-overlays" ) ) {

			// Prevent use of anchors and inputs
			// Using _on() for an event handler shared across many instances is
			// safe because the dialogs stack and must be closed in reverse order
			this._on( this.document, {
				focusin: function( event ) {
					if ( isOpening ) {
						return;
					}

					if ( !this._allowInteraction( event ) ) {
						event.preventDefault();
						this._trackingInstances()[ 0 ]._focusTabbable();
					}
				}
			});
		}

		this.overlay = $( "<div>" )
			.addClass( "ui-widget-overlay ui-front" )
			.appendTo( this._appendTo() );
		this._on( this.overlay, {
			mousedown: "_keepFocus"
		});
		this.document.data( "ui-dialog-overlays",
			(this.document.data( "ui-dialog-overlays" ) || 0) + 1 );
	},

	_destroyOverlay: function() {
		if ( !this.options.modal ) {
			return;
		}

		if ( this.overlay ) {
			var overlays = this.document.data( "ui-dialog-overlays" ) - 1;

			if ( !overlays ) {
				this.document
					.unbind( "focusin" )
					.removeData( "ui-dialog-overlays" );
			} else {
				this.document.data( "ui-dialog-overlays", overlays );
			}

			this.overlay.remove();
			this.overlay = null;
		}
	}
});


/*!
 * jQuery UI Droppable 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/droppable/
 */


$.widget( "ui.droppable", {
	version: "1.11.4",
	widgetEventPrefix: "drop",
	options: {
		accept: "*",
		activeClass: false,
		addClasses: true,
		greedy: false,
		hoverClass: false,
		scope: "default",
		tolerance: "intersect",

		// callbacks
		activate: null,
		deactivate: null,
		drop: null,
		out: null,
		over: null
	},
	_create: function() {

		var proportions,
			o = this.options,
			accept = o.accept;

		this.isover = false;
		this.isout = true;

		this.accept = $.isFunction( accept ) ? accept : function( d ) {
			return d.is( accept );
		};

		this.proportions = function( /* valueToWrite */ ) {
			if ( arguments.length ) {
				// Store the droppable's proportions
				proportions = arguments[ 0 ];
			} else {
				// Retrieve or derive the droppable's proportions
				return proportions ?
					proportions :
					proportions = {
						width: this.element[ 0 ].offsetWidth,
						height: this.element[ 0 ].offsetHeight
					};
			}
		};

		this._addToManager( o.scope );

		o.addClasses && this.element.addClass( "ui-droppable" );

	},

	_addToManager: function( scope ) {
		// Add the reference and positions to the manager
		$.ui.ddmanager.droppables[ scope ] = $.ui.ddmanager.droppables[ scope ] || [];
		$.ui.ddmanager.droppables[ scope ].push( this );
	},

	_splice: function( drop ) {
		var i = 0;
		for ( ; i < drop.length; i++ ) {
			if ( drop[ i ] === this ) {
				drop.splice( i, 1 );
			}
		}
	},

	_destroy: function() {
		var drop = $.ui.ddmanager.droppables[ this.options.scope ];

		this._splice( drop );

		this.element.removeClass( "ui-droppable ui-droppable-disabled" );
	},

	_setOption: function( key, value ) {

		if ( key === "accept" ) {
			this.accept = $.isFunction( value ) ? value : function( d ) {
				return d.is( value );
			};
		} else if ( key === "scope" ) {
			var drop = $.ui.ddmanager.droppables[ this.options.scope ];

			this._splice( drop );
			this._addToManager( value );
		}

		this._super( key, value );
	},

	_activate: function( event ) {
		var draggable = $.ui.ddmanager.current;
		if ( this.options.activeClass ) {
			this.element.addClass( this.options.activeClass );
		}
		if ( draggable ){
			this._trigger( "activate", event, this.ui( draggable ) );
		}
	},

	_deactivate: function( event ) {
		var draggable = $.ui.ddmanager.current;
		if ( this.options.activeClass ) {
			this.element.removeClass( this.options.activeClass );
		}
		if ( draggable ){
			this._trigger( "deactivate", event, this.ui( draggable ) );
		}
	},

	_over: function( event ) {

		var draggable = $.ui.ddmanager.current;

		// Bail if draggable and droppable are same element
		if ( !draggable || ( draggable.currentItem || draggable.element )[ 0 ] === this.element[ 0 ] ) {
			return;
		}

		if ( this.accept.call( this.element[ 0 ], ( draggable.currentItem || draggable.element ) ) ) {
			if ( this.options.hoverClass ) {
				this.element.addClass( this.options.hoverClass );
			}
			this._trigger( "over", event, this.ui( draggable ) );
		}

	},

	_out: function( event ) {

		var draggable = $.ui.ddmanager.current;

		// Bail if draggable and droppable are same element
		if ( !draggable || ( draggable.currentItem || draggable.element )[ 0 ] === this.element[ 0 ] ) {
			return;
		}

		if ( this.accept.call( this.element[ 0 ], ( draggable.currentItem || draggable.element ) ) ) {
			if ( this.options.hoverClass ) {
				this.element.removeClass( this.options.hoverClass );
			}
			this._trigger( "out", event, this.ui( draggable ) );
		}

	},

	_drop: function( event, custom ) {

		var draggable = custom || $.ui.ddmanager.current,
			childrenIntersection = false;

		// Bail if draggable and droppable are same element
		if ( !draggable || ( draggable.currentItem || draggable.element )[ 0 ] === this.element[ 0 ] ) {
			return false;
		}

		this.element.find( ":data(ui-droppable)" ).not( ".ui-draggable-dragging" ).each(function() {
			var inst = $( this ).droppable( "instance" );
			if (
				inst.options.greedy &&
				!inst.options.disabled &&
				inst.options.scope === draggable.options.scope &&
				inst.accept.call( inst.element[ 0 ], ( draggable.currentItem || draggable.element ) ) &&
				$.ui.intersect( draggable, $.extend( inst, { offset: inst.element.offset() } ), inst.options.tolerance, event )
			) { childrenIntersection = true; return false; }
		});
		if ( childrenIntersection ) {
			return false;
		}

		if ( this.accept.call( this.element[ 0 ], ( draggable.currentItem || draggable.element ) ) ) {
			if ( this.options.activeClass ) {
				this.element.removeClass( this.options.activeClass );
			}
			if ( this.options.hoverClass ) {
				this.element.removeClass( this.options.hoverClass );
			}
			this._trigger( "drop", event, this.ui( draggable ) );
			return this.element;
		}

		return false;

	},

	ui: function( c ) {
		return {
			draggable: ( c.currentItem || c.element ),
			helper: c.helper,
			position: c.position,
			offset: c.positionAbs
		};
	}

});

$.ui.intersect = (function() {
	function isOverAxis( x, reference, size ) {
		return ( x >= reference ) && ( x < ( reference + size ) );
	}

	return function( draggable, droppable, toleranceMode, event ) {

		if ( !droppable.offset ) {
			return false;
		}

		var x1 = ( draggable.positionAbs || draggable.position.absolute ).left + draggable.margins.left,
			y1 = ( draggable.positionAbs || draggable.position.absolute ).top + draggable.margins.top,
			x2 = x1 + draggable.helperProportions.width,
			y2 = y1 + draggable.helperProportions.height,
			l = droppable.offset.left,
			t = droppable.offset.top,
			r = l + droppable.proportions().width,
			b = t + droppable.proportions().height;

		switch ( toleranceMode ) {
		case "fit":
			return ( l <= x1 && x2 <= r && t <= y1 && y2 <= b );
		case "intersect":
			return ( l < x1 + ( draggable.helperProportions.width / 2 ) && // Right Half
				x2 - ( draggable.helperProportions.width / 2 ) < r && // Left Half
				t < y1 + ( draggable.helperProportions.height / 2 ) && // Bottom Half
				y2 - ( draggable.helperProportions.height / 2 ) < b ); // Top Half
		case "pointer":
			return isOverAxis( event.pageY, t, droppable.proportions().height ) && isOverAxis( event.pageX, l, droppable.proportions().width );
		case "touch":
			return (
				( y1 >= t && y1 <= b ) || // Top edge touching
				( y2 >= t && y2 <= b ) || // Bottom edge touching
				( y1 < t && y2 > b ) // Surrounded vertically
			) && (
				( x1 >= l && x1 <= r ) || // Left edge touching
				( x2 >= l && x2 <= r ) || // Right edge touching
				( x1 < l && x2 > r ) // Surrounded horizontally
			);
		default:
			return false;
		}
	};
})();

/*
	This manager tracks offsets of draggables and droppables
*/
$.ui.ddmanager = {
	current: null,
	droppables: { "default": [] },
	prepareOffsets: function( t, event ) {

		var i, j,
			m = $.ui.ddmanager.droppables[ t.options.scope ] || [],
			type = event ? event.type : null, // workaround for #2317
			list = ( t.currentItem || t.element ).find( ":data(ui-droppable)" ).addBack();

		droppablesLoop: for ( i = 0; i < m.length; i++ ) {

			// No disabled and non-accepted
			if ( m[ i ].options.disabled || ( t && !m[ i ].accept.call( m[ i ].element[ 0 ], ( t.currentItem || t.element ) ) ) ) {
				continue;
			}

			// Filter out elements in the current dragged item
			for ( j = 0; j < list.length; j++ ) {
				if ( list[ j ] === m[ i ].element[ 0 ] ) {
					m[ i ].proportions().height = 0;
					continue droppablesLoop;
				}
			}

			m[ i ].visible = m[ i ].element.css( "display" ) !== "none";
			if ( !m[ i ].visible ) {
				continue;
			}

			// Activate the droppable if used directly from draggables
			if ( type === "mousedown" ) {
				m[ i ]._activate.call( m[ i ], event );
			}

			m[ i ].offset = m[ i ].element.offset();
			m[ i ].proportions({ width: m[ i ].element[ 0 ].offsetWidth, height: m[ i ].element[ 0 ].offsetHeight });

		}

	},
	drop: function( draggable, event ) {

		var dropped = false;
		// Create a copy of the droppables in case the list changes during the drop (#9116)
		$.each( ( $.ui.ddmanager.droppables[ draggable.options.scope ] || [] ).slice(), function() {

			if ( !this.options ) {
				return;
			}
			if ( !this.options.disabled && this.visible && $.ui.intersect( draggable, this, this.options.tolerance, event ) ) {
				dropped = this._drop.call( this, event ) || dropped;
			}

			if ( !this.options.disabled && this.visible && this.accept.call( this.element[ 0 ], ( draggable.currentItem || draggable.element ) ) ) {
				this.isout = true;
				this.isover = false;
				this._deactivate.call( this, event );
			}

		});
		return dropped;

	},
	dragStart: function( draggable, event ) {
		// Listen for scrolling so that if the dragging causes scrolling the position of the droppables can be recalculated (see #5003)
		draggable.element.parentsUntil( "body" ).bind( "scroll.droppable", function() {
			if ( !draggable.options.refreshPositions ) {
				$.ui.ddmanager.prepareOffsets( draggable, event );
			}
		});
	},
	drag: function( draggable, event ) {

		// If you have a highly dynamic page, you might try this option. It renders positions every time you move the mouse.
		if ( draggable.options.refreshPositions ) {
			$.ui.ddmanager.prepareOffsets( draggable, event );
		}

		// Run through all droppables and check their positions based on specific tolerance options
		$.each( $.ui.ddmanager.droppables[ draggable.options.scope ] || [], function() {

			if ( this.options.disabled || this.greedyChild || !this.visible ) {
				return;
			}

			var parentInstance, scope, parent,
				intersects = $.ui.intersect( draggable, this, this.options.tolerance, event ),
				c = !intersects && this.isover ? "isout" : ( intersects && !this.isover ? "isover" : null );
			if ( !c ) {
				return;
			}

			if ( this.options.greedy ) {
				// find droppable parents with same scope
				scope = this.options.scope;
				parent = this.element.parents( ":data(ui-droppable)" ).filter(function() {
					return $( this ).droppable( "instance" ).options.scope === scope;
				});

				if ( parent.length ) {
					parentInstance = $( parent[ 0 ] ).droppable( "instance" );
					parentInstance.greedyChild = ( c === "isover" );
				}
			}

			// we just moved into a greedy child
			if ( parentInstance && c === "isover" ) {
				parentInstance.isover = false;
				parentInstance.isout = true;
				parentInstance._out.call( parentInstance, event );
			}

			this[ c ] = true;
			this[c === "isout" ? "isover" : "isout"] = false;
			this[c === "isover" ? "_over" : "_out"].call( this, event );

			// we just moved out of a greedy child
			if ( parentInstance && c === "isout" ) {
				parentInstance.isout = false;
				parentInstance.isover = true;
				parentInstance._over.call( parentInstance, event );
			}
		});

	},
	dragStop: function( draggable, event ) {
		draggable.element.parentsUntil( "body" ).unbind( "scroll.droppable" );
		// Call prepareOffsets one final time since IE does not fire return scroll events when overflow was caused by drag (see #5003)
		if ( !draggable.options.refreshPositions ) {
			$.ui.ddmanager.prepareOffsets( draggable, event );
		}
	}
};

var droppable = $.ui.droppable;


/*!
 * jQuery UI Effects 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/category/effects-core/
 */


var dataSpace = "ui-effects-",

	// Create a local jQuery because jQuery Color relies on it and the
	// global may not exist with AMD and a custom build (#10199)
	jQuery = $;

$.effects = {
	effect: {}
};

/*!
 * jQuery Color Animations v2.1.2
 * https://github.com/jquery/jquery-color
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: Wed Jan 16 08:47:09 2013 -0600
 */
(function( jQuery, undefined ) {

	var stepHooks = "backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",

	// plusequals test for += 100 -= 100
	rplusequals = /^([\-+])=\s*(\d+\.?\d*)/,
	// a set of RE's that can match strings and generate color tuples.
	stringParsers = [ {
			re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ],
					execResult[ 3 ],
					execResult[ 4 ]
				];
			}
		}, {
			re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ] * 2.55,
					execResult[ 2 ] * 2.55,
					execResult[ 3 ] * 2.55,
					execResult[ 4 ]
				];
			}
		}, {
			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ], 16 )
				];
			}
		}, {
			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9])([a-f0-9])([a-f0-9])/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ] + execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ] + execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ] + execResult[ 3 ], 16 )
				];
			}
		}, {
			re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			space: "hsla",
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ] / 100,
					execResult[ 3 ] / 100,
					execResult[ 4 ]
				];
			}
		} ],

	// jQuery.Color( )
	color = jQuery.Color = function( color, green, blue, alpha ) {
		return new jQuery.Color.fn.parse( color, green, blue, alpha );
	},
	spaces = {
		rgba: {
			props: {
				red: {
					idx: 0,
					type: "byte"
				},
				green: {
					idx: 1,
					type: "byte"
				},
				blue: {
					idx: 2,
					type: "byte"
				}
			}
		},

		hsla: {
			props: {
				hue: {
					idx: 0,
					type: "degrees"
				},
				saturation: {
					idx: 1,
					type: "percent"
				},
				lightness: {
					idx: 2,
					type: "percent"
				}
			}
		}
	},
	propTypes = {
		"byte": {
			floor: true,
			max: 255
		},
		"percent": {
			max: 1
		},
		"degrees": {
			mod: 360,
			floor: true
		}
	},
	support = color.support = {},

	// element for support tests
	supportElem = jQuery( "<p>" )[ 0 ],

	// colors = jQuery.Color.names
	colors,

	// local aliases of functions called often
	each = jQuery.each;

// determine rgba support immediately
supportElem.style.cssText = "background-color:rgba(1,1,1,.5)";
support.rgba = supportElem.style.backgroundColor.indexOf( "rgba" ) > -1;

// define cache name and alpha properties
// for rgba and hsla spaces
each( spaces, function( spaceName, space ) {
	space.cache = "_" + spaceName;
	space.props.alpha = {
		idx: 3,
		type: "percent",
		def: 1
	};
});

function clamp( value, prop, allowEmpty ) {
	var type = propTypes[ prop.type ] || {};

	if ( value == null ) {
		return (allowEmpty || !prop.def) ? null : prop.def;
	}

	// ~~ is an short way of doing floor for positive numbers
	value = type.floor ? ~~value : parseFloat( value );

	// IE will pass in empty strings as value for alpha,
	// which will hit this case
	if ( isNaN( value ) ) {
		return prop.def;
	}

	if ( type.mod ) {
		// we add mod before modding to make sure that negatives values
		// get converted properly: -10 -> 350
		return (value + type.mod) % type.mod;
	}

	// for now all property types without mod have min and max
	return 0 > value ? 0 : type.max < value ? type.max : value;
}

function stringParse( string ) {
	var inst = color(),
		rgba = inst._rgba = [];

	string = string.toLowerCase();

	each( stringParsers, function( i, parser ) {
		var parsed,
			match = parser.re.exec( string ),
			values = match && parser.parse( match ),
			spaceName = parser.space || "rgba";

		if ( values ) {
			parsed = inst[ spaceName ]( values );

			// if this was an rgba parse the assignment might happen twice
			// oh well....
			inst[ spaces[ spaceName ].cache ] = parsed[ spaces[ spaceName ].cache ];
			rgba = inst._rgba = parsed._rgba;

			// exit each( stringParsers ) here because we matched
			return false;
		}
	});

	// Found a stringParser that handled it
	if ( rgba.length ) {

		// if this came from a parsed string, force "transparent" when alpha is 0
		// chrome, (and maybe others) return "transparent" as rgba(0,0,0,0)
		if ( rgba.join() === "0,0,0,0" ) {
			jQuery.extend( rgba, colors.transparent );
		}
		return inst;
	}

	// named colors
	return colors[ string ];
}

color.fn = jQuery.extend( color.prototype, {
	parse: function( red, green, blue, alpha ) {
		if ( red === undefined ) {
			this._rgba = [ null, null, null, null ];
			return this;
		}
		if ( red.jquery || red.nodeType ) {
			red = jQuery( red ).css( green );
			green = undefined;
		}

		var inst = this,
			type = jQuery.type( red ),
			rgba = this._rgba = [];

		// more than 1 argument specified - assume ( red, green, blue, alpha )
		if ( green !== undefined ) {
			red = [ red, green, blue, alpha ];
			type = "array";
		}

		if ( type === "string" ) {
			return this.parse( stringParse( red ) || colors._default );
		}

		if ( type === "array" ) {
			each( spaces.rgba.props, function( key, prop ) {
				rgba[ prop.idx ] = clamp( red[ prop.idx ], prop );
			});
			return this;
		}

		if ( type === "object" ) {
			if ( red instanceof color ) {
				each( spaces, function( spaceName, space ) {
					if ( red[ space.cache ] ) {
						inst[ space.cache ] = red[ space.cache ].slice();
					}
				});
			} else {
				each( spaces, function( spaceName, space ) {
					var cache = space.cache;
					each( space.props, function( key, prop ) {

						// if the cache doesn't exist, and we know how to convert
						if ( !inst[ cache ] && space.to ) {

							// if the value was null, we don't need to copy it
							// if the key was alpha, we don't need to copy it either
							if ( key === "alpha" || red[ key ] == null ) {
								return;
							}
							inst[ cache ] = space.to( inst._rgba );
						}

						// this is the only case where we allow nulls for ALL properties.
						// call clamp with alwaysAllowEmpty
						inst[ cache ][ prop.idx ] = clamp( red[ key ], prop, true );
					});

					// everything defined but alpha?
					if ( inst[ cache ] && jQuery.inArray( null, inst[ cache ].slice( 0, 3 ) ) < 0 ) {
						// use the default of 1
						inst[ cache ][ 3 ] = 1;
						if ( space.from ) {
							inst._rgba = space.from( inst[ cache ] );
						}
					}
				});
			}
			return this;
		}
	},
	is: function( compare ) {
		var is = color( compare ),
			same = true,
			inst = this;

		each( spaces, function( _, space ) {
			var localCache,
				isCache = is[ space.cache ];
			if (isCache) {
				localCache = inst[ space.cache ] || space.to && space.to( inst._rgba ) || [];
				each( space.props, function( _, prop ) {
					if ( isCache[ prop.idx ] != null ) {
						same = ( isCache[ prop.idx ] === localCache[ prop.idx ] );
						return same;
					}
				});
			}
			return same;
		});
		return same;
	},
	_space: function() {
		var used = [],
			inst = this;
		each( spaces, function( spaceName, space ) {
			if ( inst[ space.cache ] ) {
				used.push( spaceName );
			}
		});
		return used.pop();
	},
	transition: function( other, distance ) {
		var end = color( other ),
			spaceName = end._space(),
			space = spaces[ spaceName ],
			startColor = this.alpha() === 0 ? color( "transparent" ) : this,
			start = startColor[ space.cache ] || space.to( startColor._rgba ),
			result = start.slice();

		end = end[ space.cache ];
		each( space.props, function( key, prop ) {
			var index = prop.idx,
				startValue = start[ index ],
				endValue = end[ index ],
				type = propTypes[ prop.type ] || {};

			// if null, don't override start value
			if ( endValue === null ) {
				return;
			}
			// if null - use end
			if ( startValue === null ) {
				result[ index ] = endValue;
			} else {
				if ( type.mod ) {
					if ( endValue - startValue > type.mod / 2 ) {
						startValue += type.mod;
					} else if ( startValue - endValue > type.mod / 2 ) {
						startValue -= type.mod;
					}
				}
				result[ index ] = clamp( ( endValue - startValue ) * distance + startValue, prop );
			}
		});
		return this[ spaceName ]( result );
	},
	blend: function( opaque ) {
		// if we are already opaque - return ourself
		if ( this._rgba[ 3 ] === 1 ) {
			return this;
		}

		var rgb = this._rgba.slice(),
			a = rgb.pop(),
			blend = color( opaque )._rgba;

		return color( jQuery.map( rgb, function( v, i ) {
			return ( 1 - a ) * blend[ i ] + a * v;
		}));
	},
	toRgbaString: function() {
		var prefix = "rgba(",
			rgba = jQuery.map( this._rgba, function( v, i ) {
				return v == null ? ( i > 2 ? 1 : 0 ) : v;
			});

		if ( rgba[ 3 ] === 1 ) {
			rgba.pop();
			prefix = "rgb(";
		}

		return prefix + rgba.join() + ")";
	},
	toHslaString: function() {
		var prefix = "hsla(",
			hsla = jQuery.map( this.hsla(), function( v, i ) {
				if ( v == null ) {
					v = i > 2 ? 1 : 0;
				}

				// catch 1 and 2
				if ( i && i < 3 ) {
					v = Math.round( v * 100 ) + "%";
				}
				return v;
			});

		if ( hsla[ 3 ] === 1 ) {
			hsla.pop();
			prefix = "hsl(";
		}
		return prefix + hsla.join() + ")";
	},
	toHexString: function( includeAlpha ) {
		var rgba = this._rgba.slice(),
			alpha = rgba.pop();

		if ( includeAlpha ) {
			rgba.push( ~~( alpha * 255 ) );
		}

		return "#" + jQuery.map( rgba, function( v ) {

			// default to 0 when nulls exist
			v = ( v || 0 ).toString( 16 );
			return v.length === 1 ? "0" + v : v;
		}).join("");
	},
	toString: function() {
		return this._rgba[ 3 ] === 0 ? "transparent" : this.toRgbaString();
	}
});
color.fn.parse.prototype = color.fn;

// hsla conversions adapted from:
// https://code.google.com/p/maashaack/source/browse/packages/graphics/trunk/src/graphics/colors/HUE2RGB.as?r=5021

function hue2rgb( p, q, h ) {
	h = ( h + 1 ) % 1;
	if ( h * 6 < 1 ) {
		return p + ( q - p ) * h * 6;
	}
	if ( h * 2 < 1) {
		return q;
	}
	if ( h * 3 < 2 ) {
		return p + ( q - p ) * ( ( 2 / 3 ) - h ) * 6;
	}
	return p;
}

spaces.hsla.to = function( rgba ) {
	if ( rgba[ 0 ] == null || rgba[ 1 ] == null || rgba[ 2 ] == null ) {
		return [ null, null, null, rgba[ 3 ] ];
	}
	var r = rgba[ 0 ] / 255,
		g = rgba[ 1 ] / 255,
		b = rgba[ 2 ] / 255,
		a = rgba[ 3 ],
		max = Math.max( r, g, b ),
		min = Math.min( r, g, b ),
		diff = max - min,
		add = max + min,
		l = add * 0.5,
		h, s;

	if ( min === max ) {
		h = 0;
	} else if ( r === max ) {
		h = ( 60 * ( g - b ) / diff ) + 360;
	} else if ( g === max ) {
		h = ( 60 * ( b - r ) / diff ) + 120;
	} else {
		h = ( 60 * ( r - g ) / diff ) + 240;
	}

	// chroma (diff) == 0 means greyscale which, by definition, saturation = 0%
	// otherwise, saturation is based on the ratio of chroma (diff) to lightness (add)
	if ( diff === 0 ) {
		s = 0;
	} else if ( l <= 0.5 ) {
		s = diff / add;
	} else {
		s = diff / ( 2 - add );
	}
	return [ Math.round(h) % 360, s, l, a == null ? 1 : a ];
};

spaces.hsla.from = function( hsla ) {
	if ( hsla[ 0 ] == null || hsla[ 1 ] == null || hsla[ 2 ] == null ) {
		return [ null, null, null, hsla[ 3 ] ];
	}
	var h = hsla[ 0 ] / 360,
		s = hsla[ 1 ],
		l = hsla[ 2 ],
		a = hsla[ 3 ],
		q = l <= 0.5 ? l * ( 1 + s ) : l + s - l * s,
		p = 2 * l - q;

	return [
		Math.round( hue2rgb( p, q, h + ( 1 / 3 ) ) * 255 ),
		Math.round( hue2rgb( p, q, h ) * 255 ),
		Math.round( hue2rgb( p, q, h - ( 1 / 3 ) ) * 255 ),
		a
	];
};

each( spaces, function( spaceName, space ) {
	var props = space.props,
		cache = space.cache,
		to = space.to,
		from = space.from;

	// makes rgba() and hsla()
	color.fn[ spaceName ] = function( value ) {

		// generate a cache for this space if it doesn't exist
		if ( to && !this[ cache ] ) {
			this[ cache ] = to( this._rgba );
		}
		if ( value === undefined ) {
			return this[ cache ].slice();
		}

		var ret,
			type = jQuery.type( value ),
			arr = ( type === "array" || type === "object" ) ? value : arguments,
			local = this[ cache ].slice();

		each( props, function( key, prop ) {
			var val = arr[ type === "object" ? key : prop.idx ];
			if ( val == null ) {
				val = local[ prop.idx ];
			}
			local[ prop.idx ] = clamp( val, prop );
		});

		if ( from ) {
			ret = color( from( local ) );
			ret[ cache ] = local;
			return ret;
		} else {
			return color( local );
		}
	};

	// makes red() green() blue() alpha() hue() saturation() lightness()
	each( props, function( key, prop ) {
		// alpha is included in more than one space
		if ( color.fn[ key ] ) {
			return;
		}
		color.fn[ key ] = function( value ) {
			var vtype = jQuery.type( value ),
				fn = ( key === "alpha" ? ( this._hsla ? "hsla" : "rgba" ) : spaceName ),
				local = this[ fn ](),
				cur = local[ prop.idx ],
				match;

			if ( vtype === "undefined" ) {
				return cur;
			}

			if ( vtype === "function" ) {
				value = value.call( this, cur );
				vtype = jQuery.type( value );
			}
			if ( value == null && prop.empty ) {
				return this;
			}
			if ( vtype === "string" ) {
				match = rplusequals.exec( value );
				if ( match ) {
					value = cur + parseFloat( match[ 2 ] ) * ( match[ 1 ] === "+" ? 1 : -1 );
				}
			}
			local[ prop.idx ] = value;
			return this[ fn ]( local );
		};
	});
});

// add cssHook and .fx.step function for each named hook.
// accept a space separated string of properties
color.hook = function( hook ) {
	var hooks = hook.split( " " );
	each( hooks, function( i, hook ) {
		jQuery.cssHooks[ hook ] = {
			set: function( elem, value ) {
				var parsed, curElem,
					backgroundColor = "";

				if ( value !== "transparent" && ( jQuery.type( value ) !== "string" || ( parsed = stringParse( value ) ) ) ) {
					value = color( parsed || value );
					if ( !support.rgba && value._rgba[ 3 ] !== 1 ) {
						curElem = hook === "backgroundColor" ? elem.parentNode : elem;
						while (
							(backgroundColor === "" || backgroundColor === "transparent") &&
							curElem && curElem.style
						) {
							try {
								backgroundColor = jQuery.css( curElem, "backgroundColor" );
								curElem = curElem.parentNode;
							} catch ( e ) {
							}
						}

						value = value.blend( backgroundColor && backgroundColor !== "transparent" ?
							backgroundColor :
							"_default" );
					}

					value = value.toRgbaString();
				}
				try {
					elem.style[ hook ] = value;
				} catch ( e ) {
					// wrapped to prevent IE from throwing errors on "invalid" values like 'auto' or 'inherit'
				}
			}
		};
		jQuery.fx.step[ hook ] = function( fx ) {
			if ( !fx.colorInit ) {
				fx.start = color( fx.elem, hook );
				fx.end = color( fx.end );
				fx.colorInit = true;
			}
			jQuery.cssHooks[ hook ].set( fx.elem, fx.start.transition( fx.end, fx.pos ) );
		};
	});

};

color.hook( stepHooks );

jQuery.cssHooks.borderColor = {
	expand: function( value ) {
		var expanded = {};

		each( [ "Top", "Right", "Bottom", "Left" ], function( i, part ) {
			expanded[ "border" + part + "Color" ] = value;
		});
		return expanded;
	}
};

// Basic color names only.
// Usage of any of the other color names requires adding yourself or including
// jquery.color.svg-names.js.
colors = jQuery.Color.names = {
	// 4.1. Basic color keywords
	aqua: "#00ffff",
	black: "#000000",
	blue: "#0000ff",
	fuchsia: "#ff00ff",
	gray: "#808080",
	green: "#008000",
	lime: "#00ff00",
	maroon: "#800000",
	navy: "#000080",
	olive: "#808000",
	purple: "#800080",
	red: "#ff0000",
	silver: "#c0c0c0",
	teal: "#008080",
	white: "#ffffff",
	yellow: "#ffff00",

	// 4.2.3. "transparent" color keyword
	transparent: [ null, null, null, 0 ],

	_default: "#ffffff"
};

})( jQuery );

/******************************************************************************/
/****************************** CLASS ANIMATIONS ******************************/
/******************************************************************************/
(function() {

var classAnimationActions = [ "add", "remove", "toggle" ],
	shorthandStyles = {
		border: 1,
		borderBottom: 1,
		borderColor: 1,
		borderLeft: 1,
		borderRight: 1,
		borderTop: 1,
		borderWidth: 1,
		margin: 1,
		padding: 1
	};

$.each([ "borderLeftStyle", "borderRightStyle", "borderBottomStyle", "borderTopStyle" ], function( _, prop ) {
	$.fx.step[ prop ] = function( fx ) {
		if ( fx.end !== "none" && !fx.setAttr || fx.pos === 1 && !fx.setAttr ) {
			jQuery.style( fx.elem, prop, fx.end );
			fx.setAttr = true;
		}
	};
});

function getElementStyles( elem ) {
	var key, len,
		style = elem.ownerDocument.defaultView ?
			elem.ownerDocument.defaultView.getComputedStyle( elem, null ) :
			elem.currentStyle,
		styles = {};

	if ( style && style.length && style[ 0 ] && style[ style[ 0 ] ] ) {
		len = style.length;
		while ( len-- ) {
			key = style[ len ];
			if ( typeof style[ key ] === "string" ) {
				styles[ $.camelCase( key ) ] = style[ key ];
			}
		}
	// support: Opera, IE <9
	} else {
		for ( key in style ) {
			if ( typeof style[ key ] === "string" ) {
				styles[ key ] = style[ key ];
			}
		}
	}

	return styles;
}

function styleDifference( oldStyle, newStyle ) {
	var diff = {},
		name, value;

	for ( name in newStyle ) {
		value = newStyle[ name ];
		if ( oldStyle[ name ] !== value ) {
			if ( !shorthandStyles[ name ] ) {
				if ( $.fx.step[ name ] || !isNaN( parseFloat( value ) ) ) {
					diff[ name ] = value;
				}
			}
		}
	}

	return diff;
}

// support: jQuery <1.8
if ( !$.fn.addBack ) {
	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

$.effects.animateClass = function( value, duration, easing, callback ) {
	var o = $.speed( duration, easing, callback );

	return this.queue( function() {
		var animated = $( this ),
			baseClass = animated.attr( "class" ) || "",
			applyClassChange,
			allAnimations = o.children ? animated.find( "*" ).addBack() : animated;

		// map the animated objects to store the original styles.
		allAnimations = allAnimations.map(function() {
			var el = $( this );
			return {
				el: el,
				start: getElementStyles( this )
			};
		});

		// apply class change
		applyClassChange = function() {
			$.each( classAnimationActions, function(i, action) {
				if ( value[ action ] ) {
					animated[ action + "Class" ]( value[ action ] );
				}
			});
		};
		applyClassChange();

		// map all animated objects again - calculate new styles and diff
		allAnimations = allAnimations.map(function() {
			this.end = getElementStyles( this.el[ 0 ] );
			this.diff = styleDifference( this.start, this.end );
			return this;
		});

		// apply original class
		animated.attr( "class", baseClass );

		// map all animated objects again - this time collecting a promise
		allAnimations = allAnimations.map(function() {
			var styleInfo = this,
				dfd = $.Deferred(),
				opts = $.extend({}, o, {
					queue: false,
					complete: function() {
						dfd.resolve( styleInfo );
					}
				});

			this.el.animate( this.diff, opts );
			return dfd.promise();
		});

		// once all animations have completed:
		$.when.apply( $, allAnimations.get() ).done(function() {

			// set the final class
			applyClassChange();

			// for each animated element,
			// clear all css properties that were animated
			$.each( arguments, function() {
				var el = this.el;
				$.each( this.diff, function(key) {
					el.css( key, "" );
				});
			});

			// this is guarnteed to be there if you use jQuery.speed()
			// it also handles dequeuing the next anim...
			o.complete.call( animated[ 0 ] );
		});
	});
};

$.fn.extend({
	addClass: (function( orig ) {
		return function( classNames, speed, easing, callback ) {
			return speed ?
				$.effects.animateClass.call( this,
					{ add: classNames }, speed, easing, callback ) :
				orig.apply( this, arguments );
		};
	})( $.fn.addClass ),

	removeClass: (function( orig ) {
		return function( classNames, speed, easing, callback ) {
			return arguments.length > 1 ?
				$.effects.animateClass.call( this,
					{ remove: classNames }, speed, easing, callback ) :
				orig.apply( this, arguments );
		};
	})( $.fn.removeClass ),

	toggleClass: (function( orig ) {
		return function( classNames, force, speed, easing, callback ) {
			if ( typeof force === "boolean" || force === undefined ) {
				if ( !speed ) {
					// without speed parameter
					return orig.apply( this, arguments );
				} else {
					return $.effects.animateClass.call( this,
						(force ? { add: classNames } : { remove: classNames }),
						speed, easing, callback );
				}
			} else {
				// without force parameter
				return $.effects.animateClass.call( this,
					{ toggle: classNames }, force, speed, easing );
			}
		};
	})( $.fn.toggleClass ),

	switchClass: function( remove, add, speed, easing, callback) {
		return $.effects.animateClass.call( this, {
			add: add,
			remove: remove
		}, speed, easing, callback );
	}
});

})();

/******************************************************************************/
/*********************************** EFFECTS **********************************/
/******************************************************************************/

(function() {

$.extend( $.effects, {
	version: "1.11.4",

	// Saves a set of properties in a data storage
	save: function( element, set ) {
		for ( var i = 0; i < set.length; i++ ) {
			if ( set[ i ] !== null ) {
				element.data( dataSpace + set[ i ], element[ 0 ].style[ set[ i ] ] );
			}
		}
	},

	// Restores a set of previously saved properties from a data storage
	restore: function( element, set ) {
		var val, i;
		for ( i = 0; i < set.length; i++ ) {
			if ( set[ i ] !== null ) {
				val = element.data( dataSpace + set[ i ] );
				// support: jQuery 1.6.2
				// http://bugs.jquery.com/ticket/9917
				// jQuery 1.6.2 incorrectly returns undefined for any falsy value.
				// We can't differentiate between "" and 0 here, so we just assume
				// empty string since it's likely to be a more common value...
				if ( val === undefined ) {
					val = "";
				}
				element.css( set[ i ], val );
			}
		}
	},

	setMode: function( el, mode ) {
		if (mode === "toggle") {
			mode = el.is( ":hidden" ) ? "show" : "hide";
		}
		return mode;
	},

	// Translates a [top,left] array into a baseline value
	// this should be a little more flexible in the future to handle a string & hash
	getBaseline: function( origin, original ) {
		var y, x;
		switch ( origin[ 0 ] ) {
			case "top": y = 0; break;
			case "middle": y = 0.5; break;
			case "bottom": y = 1; break;
			default: y = origin[ 0 ] / original.height;
		}
		switch ( origin[ 1 ] ) {
			case "left": x = 0; break;
			case "center": x = 0.5; break;
			case "right": x = 1; break;
			default: x = origin[ 1 ] / original.width;
		}
		return {
			x: x,
			y: y
		};
	},

	// Wraps the element around a wrapper that copies position properties
	createWrapper: function( element ) {

		// if the element is already wrapped, return it
		if ( element.parent().is( ".ui-effects-wrapper" )) {
			return element.parent();
		}

		// wrap the element
		var props = {
				width: element.outerWidth(true),
				height: element.outerHeight(true),
				"float": element.css( "float" )
			},
			wrapper = $( "<div></div>" )
				.addClass( "ui-effects-wrapper" )
				.css({
					fontSize: "100%",
					background: "transparent",
					border: "none",
					margin: 0,
					padding: 0
				}),
			// Store the size in case width/height are defined in % - Fixes #5245
			size = {
				width: element.width(),
				height: element.height()
			},
			active = document.activeElement;

		// support: Firefox
		// Firefox incorrectly exposes anonymous content
		// https://bugzilla.mozilla.org/show_bug.cgi?id=561664
		try {
			active.id;
		} catch ( e ) {
			active = document.body;
		}

		element.wrap( wrapper );

		// Fixes #7595 - Elements lose focus when wrapped.
		if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
			$( active ).focus();
		}

		wrapper = element.parent(); //Hotfix for jQuery 1.4 since some change in wrap() seems to actually lose the reference to the wrapped element

		// transfer positioning properties to the wrapper
		if ( element.css( "position" ) === "static" ) {
			wrapper.css({ position: "relative" });
			element.css({ position: "relative" });
		} else {
			$.extend( props, {
				position: element.css( "position" ),
				zIndex: element.css( "z-index" )
			});
			$.each([ "top", "left", "bottom", "right" ], function(i, pos) {
				props[ pos ] = element.css( pos );
				if ( isNaN( parseInt( props[ pos ], 10 ) ) ) {
					props[ pos ] = "auto";
				}
			});
			element.css({
				position: "relative",
				top: 0,
				left: 0,
				right: "auto",
				bottom: "auto"
			});
		}
		element.css(size);

		return wrapper.css( props ).show();
	},

	removeWrapper: function( element ) {
		var active = document.activeElement;

		if ( element.parent().is( ".ui-effects-wrapper" ) ) {
			element.parent().replaceWith( element );

			// Fixes #7595 - Elements lose focus when wrapped.
			if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
				$( active ).focus();
			}
		}

		return element;
	},

	setTransition: function( element, list, factor, value ) {
		value = value || {};
		$.each( list, function( i, x ) {
			var unit = element.cssUnit( x );
			if ( unit[ 0 ] > 0 ) {
				value[ x ] = unit[ 0 ] * factor + unit[ 1 ];
			}
		});
		return value;
	}
});

// return an effect options object for the given parameters:
function _normalizeArguments( effect, options, speed, callback ) {

	// allow passing all options as the first parameter
	if ( $.isPlainObject( effect ) ) {
		options = effect;
		effect = effect.effect;
	}

	// convert to an object
	effect = { effect: effect };

	// catch (effect, null, ...)
	if ( options == null ) {
		options = {};
	}

	// catch (effect, callback)
	if ( $.isFunction( options ) ) {
		callback = options;
		speed = null;
		options = {};
	}

	// catch (effect, speed, ?)
	if ( typeof options === "number" || $.fx.speeds[ options ] ) {
		callback = speed;
		speed = options;
		options = {};
	}

	// catch (effect, options, callback)
	if ( $.isFunction( speed ) ) {
		callback = speed;
		speed = null;
	}

	// add options to effect
	if ( options ) {
		$.extend( effect, options );
	}

	speed = speed || options.duration;
	effect.duration = $.fx.off ? 0 :
		typeof speed === "number" ? speed :
		speed in $.fx.speeds ? $.fx.speeds[ speed ] :
		$.fx.speeds._default;

	effect.complete = callback || options.complete;

	return effect;
}

function standardAnimationOption( option ) {
	// Valid standard speeds (nothing, number, named speed)
	if ( !option || typeof option === "number" || $.fx.speeds[ option ] ) {
		return true;
	}

	// Invalid strings - treat as "normal" speed
	if ( typeof option === "string" && !$.effects.effect[ option ] ) {
		return true;
	}

	// Complete callback
	if ( $.isFunction( option ) ) {
		return true;
	}

	// Options hash (but not naming an effect)
	if ( typeof option === "object" && !option.effect ) {
		return true;
	}

	// Didn't match any standard API
	return false;
}

$.fn.extend({
	effect: function( /* effect, options, speed, callback */ ) {
		var args = _normalizeArguments.apply( this, arguments ),
			mode = args.mode,
			queue = args.queue,
			effectMethod = $.effects.effect[ args.effect ];

		if ( $.fx.off || !effectMethod ) {
			// delegate to the original method (e.g., .show()) if possible
			if ( mode ) {
				return this[ mode ]( args.duration, args.complete );
			} else {
				return this.each( function() {
					if ( args.complete ) {
						args.complete.call( this );
					}
				});
			}
		}

		function run( next ) {
			var elem = $( this ),
				complete = args.complete,
				mode = args.mode;

			function done() {
				if ( $.isFunction( complete ) ) {
					complete.call( elem[0] );
				}
				if ( $.isFunction( next ) ) {
					next();
				}
			}

			// If the element already has the correct final state, delegate to
			// the core methods so the internal tracking of "olddisplay" works.
			if ( elem.is( ":hidden" ) ? mode === "hide" : mode === "show" ) {
				elem[ mode ]();
				done();
			} else {
				effectMethod.call( elem[0], args, done );
			}
		}

		return queue === false ? this.each( run ) : this.queue( queue || "fx", run );
	},

	show: (function( orig ) {
		return function( option ) {
			if ( standardAnimationOption( option ) ) {
				return orig.apply( this, arguments );
			} else {
				var args = _normalizeArguments.apply( this, arguments );
				args.mode = "show";
				return this.effect.call( this, args );
			}
		};
	})( $.fn.show ),

	hide: (function( orig ) {
		return function( option ) {
			if ( standardAnimationOption( option ) ) {
				return orig.apply( this, arguments );
			} else {
				var args = _normalizeArguments.apply( this, arguments );
				args.mode = "hide";
				return this.effect.call( this, args );
			}
		};
	})( $.fn.hide ),

	toggle: (function( orig ) {
		return function( option ) {
			if ( standardAnimationOption( option ) || typeof option === "boolean" ) {
				return orig.apply( this, arguments );
			} else {
				var args = _normalizeArguments.apply( this, arguments );
				args.mode = "toggle";
				return this.effect.call( this, args );
			}
		};
	})( $.fn.toggle ),

	// helper functions
	cssUnit: function(key) {
		var style = this.css( key ),
			val = [];

		$.each( [ "em", "px", "%", "pt" ], function( i, unit ) {
			if ( style.indexOf( unit ) > 0 ) {
				val = [ parseFloat( style ), unit ];
			}
		});
		return val;
	}
});

})();

/******************************************************************************/
/*********************************** EASING ***********************************/
/******************************************************************************/

(function() {

// based on easing equations from Robert Penner (http://www.robertpenner.com/easing)

var baseEasings = {};

$.each( [ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function( i, name ) {
	baseEasings[ name ] = function( p ) {
		return Math.pow( p, i + 2 );
	};
});

$.extend( baseEasings, {
	Sine: function( p ) {
		return 1 - Math.cos( p * Math.PI / 2 );
	},
	Circ: function( p ) {
		return 1 - Math.sqrt( 1 - p * p );
	},
	Elastic: function( p ) {
		return p === 0 || p === 1 ? p :
			-Math.pow( 2, 8 * (p - 1) ) * Math.sin( ( (p - 1) * 80 - 7.5 ) * Math.PI / 15 );
	},
	Back: function( p ) {
		return p * p * ( 3 * p - 2 );
	},
	Bounce: function( p ) {
		var pow2,
			bounce = 4;

		while ( p < ( ( pow2 = Math.pow( 2, --bounce ) ) - 1 ) / 11 ) {}
		return 1 / Math.pow( 4, 3 - bounce ) - 7.5625 * Math.pow( ( pow2 * 3 - 2 ) / 22 - p, 2 );
	}
});

$.each( baseEasings, function( name, easeIn ) {
	$.easing[ "easeIn" + name ] = easeIn;
	$.easing[ "easeOut" + name ] = function( p ) {
		return 1 - easeIn( 1 - p );
	};
	$.easing[ "easeInOut" + name ] = function( p ) {
		return p < 0.5 ?
			easeIn( p * 2 ) / 2 :
			1 - easeIn( p * -2 + 2 ) / 2;
	};
});

})();

var effect = $.effects;


/*!
 * jQuery UI Effects Blind 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/blind-effect/
 */


var effectBlind = $.effects.effect.blind = function( o, done ) {
	// Create element
	var el = $( this ),
		rvertical = /up|down|vertical/,
		rpositivemotion = /up|left|vertical|horizontal/,
		props = [ "position", "top", "bottom", "left", "right", "height", "width" ],
		mode = $.effects.setMode( el, o.mode || "hide" ),
		direction = o.direction || "up",
		vertical = rvertical.test( direction ),
		ref = vertical ? "height" : "width",
		ref2 = vertical ? "top" : "left",
		motion = rpositivemotion.test( direction ),
		animation = {},
		show = mode === "show",
		wrapper, distance, margin;

	// if already wrapped, the wrapper's properties are my property. #6245
	if ( el.parent().is( ".ui-effects-wrapper" ) ) {
		$.effects.save( el.parent(), props );
	} else {
		$.effects.save( el, props );
	}
	el.show();
	wrapper = $.effects.createWrapper( el ).css({
		overflow: "hidden"
	});

	distance = wrapper[ ref ]();
	margin = parseFloat( wrapper.css( ref2 ) ) || 0;

	animation[ ref ] = show ? distance : 0;
	if ( !motion ) {
		el
			.css( vertical ? "bottom" : "right", 0 )
			.css( vertical ? "top" : "left", "auto" )
			.css({ position: "absolute" });

		animation[ ref2 ] = show ? margin : distance + margin;
	}

	// start at 0 if we are showing
	if ( show ) {
		wrapper.css( ref, 0 );
		if ( !motion ) {
			wrapper.css( ref2, margin + distance );
		}
	}

	// Animate
	wrapper.animate( animation, {
		duration: o.duration,
		easing: o.easing,
		queue: false,
		complete: function() {
			if ( mode === "hide" ) {
				el.hide();
			}
			$.effects.restore( el, props );
			$.effects.removeWrapper( el );
			done();
		}
	});
};


/*!
 * jQuery UI Effects Bounce 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/bounce-effect/
 */


var effectBounce = $.effects.effect.bounce = function( o, done ) {
	var el = $( this ),
		props = [ "position", "top", "bottom", "left", "right", "height", "width" ],

		// defaults:
		mode = $.effects.setMode( el, o.mode || "effect" ),
		hide = mode === "hide",
		show = mode === "show",
		direction = o.direction || "up",
		distance = o.distance,
		times = o.times || 5,

		// number of internal animations
		anims = times * 2 + ( show || hide ? 1 : 0 ),
		speed = o.duration / anims,
		easing = o.easing,

		// utility:
		ref = ( direction === "up" || direction === "down" ) ? "top" : "left",
		motion = ( direction === "up" || direction === "left" ),
		i,
		upAnim,
		downAnim,

		// we will need to re-assemble the queue to stack our animations in place
		queue = el.queue(),
		queuelen = queue.length;

	// Avoid touching opacity to prevent clearType and PNG issues in IE
	if ( show || hide ) {
		props.push( "opacity" );
	}

	$.effects.save( el, props );
	el.show();
	$.effects.createWrapper( el ); // Create Wrapper

	// default distance for the BIGGEST bounce is the outer Distance / 3
	if ( !distance ) {
		distance = el[ ref === "top" ? "outerHeight" : "outerWidth" ]() / 3;
	}

	if ( show ) {
		downAnim = { opacity: 1 };
		downAnim[ ref ] = 0;

		// if we are showing, force opacity 0 and set the initial position
		// then do the "first" animation
		el.css( "opacity", 0 )
			.css( ref, motion ? -distance * 2 : distance * 2 )
			.animate( downAnim, speed, easing );
	}

	// start at the smallest distance if we are hiding
	if ( hide ) {
		distance = distance / Math.pow( 2, times - 1 );
	}

	downAnim = {};
	downAnim[ ref ] = 0;
	// Bounces up/down/left/right then back to 0 -- times * 2 animations happen here
	for ( i = 0; i < times; i++ ) {
		upAnim = {};
		upAnim[ ref ] = ( motion ? "-=" : "+=" ) + distance;

		el.animate( upAnim, speed, easing )
			.animate( downAnim, speed, easing );

		distance = hide ? distance * 2 : distance / 2;
	}

	// Last Bounce when Hiding
	if ( hide ) {
		upAnim = { opacity: 0 };
		upAnim[ ref ] = ( motion ? "-=" : "+=" ) + distance;

		el.animate( upAnim, speed, easing );
	}

	el.queue(function() {
		if ( hide ) {
			el.hide();
		}
		$.effects.restore( el, props );
		$.effects.removeWrapper( el );
		done();
	});

	// inject all the animations we just queued to be first in line (after "inprogress")
	if ( queuelen > 1) {
		queue.splice.apply( queue,
			[ 1, 0 ].concat( queue.splice( queuelen, anims + 1 ) ) );
	}
	el.dequeue();

};


/*!
 * jQuery UI Effects Clip 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/clip-effect/
 */


var effectClip = $.effects.effect.clip = function( o, done ) {
	// Create element
	var el = $( this ),
		props = [ "position", "top", "bottom", "left", "right", "height", "width" ],
		mode = $.effects.setMode( el, o.mode || "hide" ),
		show = mode === "show",
		direction = o.direction || "vertical",
		vert = direction === "vertical",
		size = vert ? "height" : "width",
		position = vert ? "top" : "left",
		animation = {},
		wrapper, animate, distance;

	// Save & Show
	$.effects.save( el, props );
	el.show();

	// Create Wrapper
	wrapper = $.effects.createWrapper( el ).css({
		overflow: "hidden"
	});
	animate = ( el[0].tagName === "IMG" ) ? wrapper : el;
	distance = animate[ size ]();

	// Shift
	if ( show ) {
		animate.css( size, 0 );
		animate.css( position, distance / 2 );
	}

	// Create Animation Object:
	animation[ size ] = show ? distance : 0;
	animation[ position ] = show ? 0 : distance / 2;

	// Animate
	animate.animate( animation, {
		queue: false,
		duration: o.duration,
		easing: o.easing,
		complete: function() {
			if ( !show ) {
				el.hide();
			}
			$.effects.restore( el, props );
			$.effects.removeWrapper( el );
			done();
		}
	});

};


/*!
 * jQuery UI Effects Drop 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/drop-effect/
 */


var effectDrop = $.effects.effect.drop = function( o, done ) {

	var el = $( this ),
		props = [ "position", "top", "bottom", "left", "right", "opacity", "height", "width" ],
		mode = $.effects.setMode( el, o.mode || "hide" ),
		show = mode === "show",
		direction = o.direction || "left",
		ref = ( direction === "up" || direction === "down" ) ? "top" : "left",
		motion = ( direction === "up" || direction === "left" ) ? "pos" : "neg",
		animation = {
			opacity: show ? 1 : 0
		},
		distance;

	// Adjust
	$.effects.save( el, props );
	el.show();
	$.effects.createWrapper( el );

	distance = o.distance || el[ ref === "top" ? "outerHeight" : "outerWidth" ]( true ) / 2;

	if ( show ) {
		el
			.css( "opacity", 0 )
			.css( ref, motion === "pos" ? -distance : distance );
	}

	// Animation
	animation[ ref ] = ( show ?
		( motion === "pos" ? "+=" : "-=" ) :
		( motion === "pos" ? "-=" : "+=" ) ) +
		distance;

	// Animate
	el.animate( animation, {
		queue: false,
		duration: o.duration,
		easing: o.easing,
		complete: function() {
			if ( mode === "hide" ) {
				el.hide();
			}
			$.effects.restore( el, props );
			$.effects.removeWrapper( el );
			done();
		}
	});
};


/*!
 * jQuery UI Effects Explode 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/explode-effect/
 */


var effectExplode = $.effects.effect.explode = function( o, done ) {

	var rows = o.pieces ? Math.round( Math.sqrt( o.pieces ) ) : 3,
		cells = rows,
		el = $( this ),
		mode = $.effects.setMode( el, o.mode || "hide" ),
		show = mode === "show",

		// show and then visibility:hidden the element before calculating offset
		offset = el.show().css( "visibility", "hidden" ).offset(),

		// width and height of a piece
		width = Math.ceil( el.outerWidth() / cells ),
		height = Math.ceil( el.outerHeight() / rows ),
		pieces = [],

		// loop
		i, j, left, top, mx, my;

	// children animate complete:
	function childComplete() {
		pieces.push( this );
		if ( pieces.length === rows * cells ) {
			animComplete();
		}
	}

	// clone the element for each row and cell.
	for ( i = 0; i < rows ; i++ ) { // ===>
		top = offset.top + i * height;
		my = i - ( rows - 1 ) / 2 ;

		for ( j = 0; j < cells ; j++ ) { // |||
			left = offset.left + j * width;
			mx = j - ( cells - 1 ) / 2 ;

			// Create a clone of the now hidden main element that will be absolute positioned
			// within a wrapper div off the -left and -top equal to size of our pieces
			el
				.clone()
				.appendTo( "body" )
				.wrap( "<div></div>" )
				.css({
					position: "absolute",
					visibility: "visible",
					left: -j * width,
					top: -i * height
				})

			// select the wrapper - make it overflow: hidden and absolute positioned based on
			// where the original was located +left and +top equal to the size of pieces
				.parent()
				.addClass( "ui-effects-explode" )
				.css({
					position: "absolute",
					overflow: "hidden",
					width: width,
					height: height,
					left: left + ( show ? mx * width : 0 ),
					top: top + ( show ? my * height : 0 ),
					opacity: show ? 0 : 1
				}).animate({
					left: left + ( show ? 0 : mx * width ),
					top: top + ( show ? 0 : my * height ),
					opacity: show ? 1 : 0
				}, o.duration || 500, o.easing, childComplete );
		}
	}

	function animComplete() {
		el.css({
			visibility: "visible"
		});
		$( pieces ).remove();
		if ( !show ) {
			el.hide();
		}
		done();
	}
};


/*!
 * jQuery UI Effects Fade 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/fade-effect/
 */


var effectFade = $.effects.effect.fade = function( o, done ) {
	var el = $( this ),
		mode = $.effects.setMode( el, o.mode || "toggle" );

	el.animate({
		opacity: mode
	}, {
		queue: false,
		duration: o.duration,
		easing: o.easing,
		complete: done
	});
};


/*!
 * jQuery UI Effects Fold 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/fold-effect/
 */


var effectFold = $.effects.effect.fold = function( o, done ) {

	// Create element
	var el = $( this ),
		props = [ "position", "top", "bottom", "left", "right", "height", "width" ],
		mode = $.effects.setMode( el, o.mode || "hide" ),
		show = mode === "show",
		hide = mode === "hide",
		size = o.size || 15,
		percent = /([0-9]+)%/.exec( size ),
		horizFirst = !!o.horizFirst,
		widthFirst = show !== horizFirst,
		ref = widthFirst ? [ "width", "height" ] : [ "height", "width" ],
		duration = o.duration / 2,
		wrapper, distance,
		animation1 = {},
		animation2 = {};

	$.effects.save( el, props );
	el.show();

	// Create Wrapper
	wrapper = $.effects.createWrapper( el ).css({
		overflow: "hidden"
	});
	distance = widthFirst ?
		[ wrapper.width(), wrapper.height() ] :
		[ wrapper.height(), wrapper.width() ];

	if ( percent ) {
		size = parseInt( percent[ 1 ], 10 ) / 100 * distance[ hide ? 0 : 1 ];
	}
	if ( show ) {
		wrapper.css( horizFirst ? {
			height: 0,
			width: size
		} : {
			height: size,
			width: 0
		});
	}

	// Animation
	animation1[ ref[ 0 ] ] = show ? distance[ 0 ] : size;
	animation2[ ref[ 1 ] ] = show ? distance[ 1 ] : 0;

	// Animate
	wrapper
		.animate( animation1, duration, o.easing )
		.animate( animation2, duration, o.easing, function() {
			if ( hide ) {
				el.hide();
			}
			$.effects.restore( el, props );
			$.effects.removeWrapper( el );
			done();
		});

};


/*!
 * jQuery UI Effects Highlight 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/highlight-effect/
 */


var effectHighlight = $.effects.effect.highlight = function( o, done ) {
	var elem = $( this ),
		props = [ "backgroundImage", "backgroundColor", "opacity" ],
		mode = $.effects.setMode( elem, o.mode || "show" ),
		animation = {
			backgroundColor: elem.css( "backgroundColor" )
		};

	if (mode === "hide") {
		animation.opacity = 0;
	}

	$.effects.save( elem, props );

	elem
		.show()
		.css({
			backgroundImage: "none",
			backgroundColor: o.color || "#ffff99"
		})
		.animate( animation, {
			queue: false,
			duration: o.duration,
			easing: o.easing,
			complete: function() {
				if ( mode === "hide" ) {
					elem.hide();
				}
				$.effects.restore( elem, props );
				done();
			}
		});
};


/*!
 * jQuery UI Effects Size 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/size-effect/
 */


var effectSize = $.effects.effect.size = function( o, done ) {

	// Create element
	var original, baseline, factor,
		el = $( this ),
		props0 = [ "position", "top", "bottom", "left", "right", "width", "height", "overflow", "opacity" ],

		// Always restore
		props1 = [ "position", "top", "bottom", "left", "right", "overflow", "opacity" ],

		// Copy for children
		props2 = [ "width", "height", "overflow" ],
		cProps = [ "fontSize" ],
		vProps = [ "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom" ],
		hProps = [ "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight" ],

		// Set options
		mode = $.effects.setMode( el, o.mode || "effect" ),
		restore = o.restore || mode !== "effect",
		scale = o.scale || "both",
		origin = o.origin || [ "middle", "center" ],
		position = el.css( "position" ),
		props = restore ? props0 : props1,
		zero = {
			height: 0,
			width: 0,
			outerHeight: 0,
			outerWidth: 0
		};

	if ( mode === "show" ) {
		el.show();
	}
	original = {
		height: el.height(),
		width: el.width(),
		outerHeight: el.outerHeight(),
		outerWidth: el.outerWidth()
	};

	if ( o.mode === "toggle" && mode === "show" ) {
		el.from = o.to || zero;
		el.to = o.from || original;
	} else {
		el.from = o.from || ( mode === "show" ? zero : original );
		el.to = o.to || ( mode === "hide" ? zero : original );
	}

	// Set scaling factor
	factor = {
		from: {
			y: el.from.height / original.height,
			x: el.from.width / original.width
		},
		to: {
			y: el.to.height / original.height,
			x: el.to.width / original.width
		}
	};

	// Scale the css box
	if ( scale === "box" || scale === "both" ) {

		// Vertical props scaling
		if ( factor.from.y !== factor.to.y ) {
			props = props.concat( vProps );
			el.from = $.effects.setTransition( el, vProps, factor.from.y, el.from );
			el.to = $.effects.setTransition( el, vProps, factor.to.y, el.to );
		}

		// Horizontal props scaling
		if ( factor.from.x !== factor.to.x ) {
			props = props.concat( hProps );
			el.from = $.effects.setTransition( el, hProps, factor.from.x, el.from );
			el.to = $.effects.setTransition( el, hProps, factor.to.x, el.to );
		}
	}

	// Scale the content
	if ( scale === "content" || scale === "both" ) {

		// Vertical props scaling
		if ( factor.from.y !== factor.to.y ) {
			props = props.concat( cProps ).concat( props2 );
			el.from = $.effects.setTransition( el, cProps, factor.from.y, el.from );
			el.to = $.effects.setTransition( el, cProps, factor.to.y, el.to );
		}
	}

	$.effects.save( el, props );
	el.show();
	$.effects.createWrapper( el );
	el.css( "overflow", "hidden" ).css( el.from );

	// Adjust
	if (origin) { // Calculate baseline shifts
		baseline = $.effects.getBaseline( origin, original );
		el.from.top = ( original.outerHeight - el.outerHeight() ) * baseline.y;
		el.from.left = ( original.outerWidth - el.outerWidth() ) * baseline.x;
		el.to.top = ( original.outerHeight - el.to.outerHeight ) * baseline.y;
		el.to.left = ( original.outerWidth - el.to.outerWidth ) * baseline.x;
	}
	el.css( el.from ); // set top & left

	// Animate
	if ( scale === "content" || scale === "both" ) { // Scale the children

		// Add margins/font-size
		vProps = vProps.concat([ "marginTop", "marginBottom" ]).concat(cProps);
		hProps = hProps.concat([ "marginLeft", "marginRight" ]);
		props2 = props0.concat(vProps).concat(hProps);

		el.find( "*[width]" ).each( function() {
			var child = $( this ),
				c_original = {
					height: child.height(),
					width: child.width(),
					outerHeight: child.outerHeight(),
					outerWidth: child.outerWidth()
				};
			if (restore) {
				$.effects.save(child, props2);
			}

			child.from = {
				height: c_original.height * factor.from.y,
				width: c_original.width * factor.from.x,
				outerHeight: c_original.outerHeight * factor.from.y,
				outerWidth: c_original.outerWidth * factor.from.x
			};
			child.to = {
				height: c_original.height * factor.to.y,
				width: c_original.width * factor.to.x,
				outerHeight: c_original.height * factor.to.y,
				outerWidth: c_original.width * factor.to.x
			};

			// Vertical props scaling
			if ( factor.from.y !== factor.to.y ) {
				child.from = $.effects.setTransition( child, vProps, factor.from.y, child.from );
				child.to = $.effects.setTransition( child, vProps, factor.to.y, child.to );
			}

			// Horizontal props scaling
			if ( factor.from.x !== factor.to.x ) {
				child.from = $.effects.setTransition( child, hProps, factor.from.x, child.from );
				child.to = $.effects.setTransition( child, hProps, factor.to.x, child.to );
			}

			// Animate children
			child.css( child.from );
			child.animate( child.to, o.duration, o.easing, function() {

				// Restore children
				if ( restore ) {
					$.effects.restore( child, props2 );
				}
			});
		});
	}

	// Animate
	el.animate( el.to, {
		queue: false,
		duration: o.duration,
		easing: o.easing,
		complete: function() {
			if ( el.to.opacity === 0 ) {
				el.css( "opacity", el.from.opacity );
			}
			if ( mode === "hide" ) {
				el.hide();
			}
			$.effects.restore( el, props );
			if ( !restore ) {

				// we need to calculate our new positioning based on the scaling
				if ( position === "static" ) {
					el.css({
						position: "relative",
						top: el.to.top,
						left: el.to.left
					});
				} else {
					$.each([ "top", "left" ], function( idx, pos ) {
						el.css( pos, function( _, str ) {
							var val = parseInt( str, 10 ),
								toRef = idx ? el.to.left : el.to.top;

							// if original was "auto", recalculate the new value from wrapper
							if ( str === "auto" ) {
								return toRef + "px";
							}

							return val + toRef + "px";
						});
					});
				}
			}

			$.effects.removeWrapper( el );
			done();
		}
	});

};


/*!
 * jQuery UI Effects Scale 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/scale-effect/
 */


var effectScale = $.effects.effect.scale = function( o, done ) {

	// Create element
	var el = $( this ),
		options = $.extend( true, {}, o ),
		mode = $.effects.setMode( el, o.mode || "effect" ),
		percent = parseInt( o.percent, 10 ) ||
			( parseInt( o.percent, 10 ) === 0 ? 0 : ( mode === "hide" ? 0 : 100 ) ),
		direction = o.direction || "both",
		origin = o.origin,
		original = {
			height: el.height(),
			width: el.width(),
			outerHeight: el.outerHeight(),
			outerWidth: el.outerWidth()
		},
		factor = {
			y: direction !== "horizontal" ? (percent / 100) : 1,
			x: direction !== "vertical" ? (percent / 100) : 1
		};

	// We are going to pass this effect to the size effect:
	options.effect = "size";
	options.queue = false;
	options.complete = done;

	// Set default origin and restore for show/hide
	if ( mode !== "effect" ) {
		options.origin = origin || [ "middle", "center" ];
		options.restore = true;
	}

	options.from = o.from || ( mode === "show" ? {
		height: 0,
		width: 0,
		outerHeight: 0,
		outerWidth: 0
	} : original );
	options.to = {
		height: original.height * factor.y,
		width: original.width * factor.x,
		outerHeight: original.outerHeight * factor.y,
		outerWidth: original.outerWidth * factor.x
	};

	// Fade option to support puff
	if ( options.fade ) {
		if ( mode === "show" ) {
			options.from.opacity = 0;
			options.to.opacity = 1;
		}
		if ( mode === "hide" ) {
			options.from.opacity = 1;
			options.to.opacity = 0;
		}
	}

	// Animate
	el.effect( options );

};


/*!
 * jQuery UI Effects Puff 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/puff-effect/
 */


var effectPuff = $.effects.effect.puff = function( o, done ) {
	var elem = $( this ),
		mode = $.effects.setMode( elem, o.mode || "hide" ),
		hide = mode === "hide",
		percent = parseInt( o.percent, 10 ) || 150,
		factor = percent / 100,
		original = {
			height: elem.height(),
			width: elem.width(),
			outerHeight: elem.outerHeight(),
			outerWidth: elem.outerWidth()
		};

	$.extend( o, {
		effect: "scale",
		queue: false,
		fade: true,
		mode: mode,
		complete: done,
		percent: hide ? percent : 100,
		from: hide ?
			original :
			{
				height: original.height * factor,
				width: original.width * factor,
				outerHeight: original.outerHeight * factor,
				outerWidth: original.outerWidth * factor
			}
	});

	elem.effect( o );
};


/*!
 * jQuery UI Effects Pulsate 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/pulsate-effect/
 */


var effectPulsate = $.effects.effect.pulsate = function( o, done ) {
	var elem = $( this ),
		mode = $.effects.setMode( elem, o.mode || "show" ),
		show = mode === "show",
		hide = mode === "hide",
		showhide = ( show || mode === "hide" ),

		// showing or hiding leaves of the "last" animation
		anims = ( ( o.times || 5 ) * 2 ) + ( showhide ? 1 : 0 ),
		duration = o.duration / anims,
		animateTo = 0,
		queue = elem.queue(),
		queuelen = queue.length,
		i;

	if ( show || !elem.is(":visible")) {
		elem.css( "opacity", 0 ).show();
		animateTo = 1;
	}

	// anims - 1 opacity "toggles"
	for ( i = 1; i < anims; i++ ) {
		elem.animate({
			opacity: animateTo
		}, duration, o.easing );
		animateTo = 1 - animateTo;
	}

	elem.animate({
		opacity: animateTo
	}, duration, o.easing);

	elem.queue(function() {
		if ( hide ) {
			elem.hide();
		}
		done();
	});

	// We just queued up "anims" animations, we need to put them next in the queue
	if ( queuelen > 1 ) {
		queue.splice.apply( queue,
			[ 1, 0 ].concat( queue.splice( queuelen, anims + 1 ) ) );
	}
	elem.dequeue();
};


/*!
 * jQuery UI Effects Shake 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/shake-effect/
 */


var effectShake = $.effects.effect.shake = function( o, done ) {

	var el = $( this ),
		props = [ "position", "top", "bottom", "left", "right", "height", "width" ],
		mode = $.effects.setMode( el, o.mode || "effect" ),
		direction = o.direction || "left",
		distance = o.distance || 20,
		times = o.times || 3,
		anims = times * 2 + 1,
		speed = Math.round( o.duration / anims ),
		ref = (direction === "up" || direction === "down") ? "top" : "left",
		positiveMotion = (direction === "up" || direction === "left"),
		animation = {},
		animation1 = {},
		animation2 = {},
		i,

		// we will need to re-assemble the queue to stack our animations in place
		queue = el.queue(),
		queuelen = queue.length;

	$.effects.save( el, props );
	el.show();
	$.effects.createWrapper( el );

	// Animation
	animation[ ref ] = ( positiveMotion ? "-=" : "+=" ) + distance;
	animation1[ ref ] = ( positiveMotion ? "+=" : "-=" ) + distance * 2;
	animation2[ ref ] = ( positiveMotion ? "-=" : "+=" ) + distance * 2;

	// Animate
	el.animate( animation, speed, o.easing );

	// Shakes
	for ( i = 1; i < times; i++ ) {
		el.animate( animation1, speed, o.easing ).animate( animation2, speed, o.easing );
	}
	el
		.animate( animation1, speed, o.easing )
		.animate( animation, speed / 2, o.easing )
		.queue(function() {
			if ( mode === "hide" ) {
				el.hide();
			}
			$.effects.restore( el, props );
			$.effects.removeWrapper( el );
			done();
		});

	// inject all the animations we just queued to be first in line (after "inprogress")
	if ( queuelen > 1) {
		queue.splice.apply( queue,
			[ 1, 0 ].concat( queue.splice( queuelen, anims + 1 ) ) );
	}
	el.dequeue();

};


/*!
 * jQuery UI Effects Slide 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/slide-effect/
 */


var effectSlide = $.effects.effect.slide = function( o, done ) {

	// Create element
	var el = $( this ),
		props = [ "position", "top", "bottom", "left", "right", "width", "height" ],
		mode = $.effects.setMode( el, o.mode || "show" ),
		show = mode === "show",
		direction = o.direction || "left",
		ref = (direction === "up" || direction === "down") ? "top" : "left",
		positiveMotion = (direction === "up" || direction === "left"),
		distance,
		animation = {};

	// Adjust
	$.effects.save( el, props );
	el.show();
	distance = o.distance || el[ ref === "top" ? "outerHeight" : "outerWidth" ]( true );

	$.effects.createWrapper( el ).css({
		overflow: "hidden"
	});

	if ( show ) {
		el.css( ref, positiveMotion ? (isNaN(distance) ? "-" + distance : -distance) : distance );
	}

	// Animation
	animation[ ref ] = ( show ?
		( positiveMotion ? "+=" : "-=") :
		( positiveMotion ? "-=" : "+=")) +
		distance;

	// Animate
	el.animate( animation, {
		queue: false,
		duration: o.duration,
		easing: o.easing,
		complete: function() {
			if ( mode === "hide" ) {
				el.hide();
			}
			$.effects.restore( el, props );
			$.effects.removeWrapper( el );
			done();
		}
	});
};


/*!
 * jQuery UI Effects Transfer 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/transfer-effect/
 */


var effectTransfer = $.effects.effect.transfer = function( o, done ) {
	var elem = $( this ),
		target = $( o.to ),
		targetFixed = target.css( "position" ) === "fixed",
		body = $("body"),
		fixTop = targetFixed ? body.scrollTop() : 0,
		fixLeft = targetFixed ? body.scrollLeft() : 0,
		endPosition = target.offset(),
		animation = {
			top: endPosition.top - fixTop,
			left: endPosition.left - fixLeft,
			height: target.innerHeight(),
			width: target.innerWidth()
		},
		startPosition = elem.offset(),
		transfer = $( "<div class='ui-effects-transfer'></div>" )
			.appendTo( document.body )
			.addClass( o.className )
			.css({
				top: startPosition.top - fixTop,
				left: startPosition.left - fixLeft,
				height: elem.innerHeight(),
				width: elem.innerWidth(),
				position: targetFixed ? "fixed" : "absolute"
			})
			.animate( animation, o.duration, o.easing, function() {
				transfer.remove();
				done();
			});
};


/*!
 * jQuery UI Progressbar 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/progressbar/
 */


var progressbar = $.widget( "ui.progressbar", {
	version: "1.11.4",
	options: {
		max: 100,
		value: 0,

		change: null,
		complete: null
	},

	min: 0,

	_create: function() {
		// Constrain initial value
		this.oldValue = this.options.value = this._constrainedValue();

		this.element
			.addClass( "ui-progressbar ui-widget ui-widget-content ui-corner-all" )
			.attr({
				// Only set static values, aria-valuenow and aria-valuemax are
				// set inside _refreshValue()
				role: "progressbar",
				"aria-valuemin": this.min
			});

		this.valueDiv = $( "<div class='ui-progressbar-value ui-widget-header ui-corner-left'></div>" )
			.appendTo( this.element );

		this._refreshValue();
	},

	_destroy: function() {
		this.element
			.removeClass( "ui-progressbar ui-widget ui-widget-content ui-corner-all" )
			.removeAttr( "role" )
			.removeAttr( "aria-valuemin" )
			.removeAttr( "aria-valuemax" )
			.removeAttr( "aria-valuenow" );

		this.valueDiv.remove();
	},

	value: function( newValue ) {
		if ( newValue === undefined ) {
			return this.options.value;
		}

		this.options.value = this._constrainedValue( newValue );
		this._refreshValue();
	},

	_constrainedValue: function( newValue ) {
		if ( newValue === undefined ) {
			newValue = this.options.value;
		}

		this.indeterminate = newValue === false;

		// sanitize value
		if ( typeof newValue !== "number" ) {
			newValue = 0;
		}

		return this.indeterminate ? false :
			Math.min( this.options.max, Math.max( this.min, newValue ) );
	},

	_setOptions: function( options ) {
		// Ensure "value" option is set after other values (like max)
		var value = options.value;
		delete options.value;

		this._super( options );

		this.options.value = this._constrainedValue( value );
		this._refreshValue();
	},

	_setOption: function( key, value ) {
		if ( key === "max" ) {
			// Don't allow a max less than min
			value = Math.max( this.min, value );
		}
		if ( key === "disabled" ) {
			this.element
				.toggleClass( "ui-state-disabled", !!value )
				.attr( "aria-disabled", value );
		}
		this._super( key, value );
	},

	_percentage: function() {
		return this.indeterminate ? 100 : 100 * ( this.options.value - this.min ) / ( this.options.max - this.min );
	},

	_refreshValue: function() {
		var value = this.options.value,
			percentage = this._percentage();

		this.valueDiv
			.toggle( this.indeterminate || value > this.min )
			.toggleClass( "ui-corner-right", value === this.options.max )
			.width( percentage.toFixed(0) + "%" );

		this.element.toggleClass( "ui-progressbar-indeterminate", this.indeterminate );

		if ( this.indeterminate ) {
			this.element.removeAttr( "aria-valuenow" );
			if ( !this.overlayDiv ) {
				this.overlayDiv = $( "<div class='ui-progressbar-overlay'></div>" ).appendTo( this.valueDiv );
			}
		} else {
			this.element.attr({
				"aria-valuemax": this.options.max,
				"aria-valuenow": value
			});
			if ( this.overlayDiv ) {
				this.overlayDiv.remove();
				this.overlayDiv = null;
			}
		}

		if ( this.oldValue !== value ) {
			this.oldValue = value;
			this._trigger( "change" );
		}
		if ( value === this.options.max ) {
			this._trigger( "complete" );
		}
	}
});


/*!
 * jQuery UI Selectable 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/selectable/
 */


var selectable = $.widget("ui.selectable", $.ui.mouse, {
	version: "1.11.4",
	options: {
		appendTo: "body",
		autoRefresh: true,
		distance: 0,
		filter: "*",
		tolerance: "touch",

		// callbacks
		selected: null,
		selecting: null,
		start: null,
		stop: null,
		unselected: null,
		unselecting: null
	},
	_create: function() {
		var selectees,
			that = this;

		this.element.addClass("ui-selectable");

		this.dragged = false;

		// cache selectee children based on filter
		this.refresh = function() {
			selectees = $(that.options.filter, that.element[0]);
			selectees.addClass("ui-selectee");
			selectees.each(function() {
				var $this = $(this),
					pos = $this.offset();
				$.data(this, "selectable-item", {
					element: this,
					$element: $this,
					left: pos.left,
					top: pos.top,
					right: pos.left + $this.outerWidth(),
					bottom: pos.top + $this.outerHeight(),
					startselected: false,
					selected: $this.hasClass("ui-selected"),
					selecting: $this.hasClass("ui-selecting"),
					unselecting: $this.hasClass("ui-unselecting")
				});
			});
		};
		this.refresh();

		this.selectees = selectees.addClass("ui-selectee");

		this._mouseInit();

		this.helper = $("<div class='ui-selectable-helper'></div>");
	},

	_destroy: function() {
		this.selectees
			.removeClass("ui-selectee")
			.removeData("selectable-item");
		this.element
			.removeClass("ui-selectable ui-selectable-disabled");
		this._mouseDestroy();
	},

	_mouseStart: function(event) {
		var that = this,
			options = this.options;

		this.opos = [ event.pageX, event.pageY ];

		if (this.options.disabled) {
			return;
		}

		this.selectees = $(options.filter, this.element[0]);

		this._trigger("start", event);

		$(options.appendTo).append(this.helper);
		// position helper (lasso)
		this.helper.css({
			"left": event.pageX,
			"top": event.pageY,
			"width": 0,
			"height": 0
		});

		if (options.autoRefresh) {
			this.refresh();
		}

		this.selectees.filter(".ui-selected").each(function() {
			var selectee = $.data(this, "selectable-item");
			selectee.startselected = true;
			if (!event.metaKey && !event.ctrlKey) {
				selectee.$element.removeClass("ui-selected");
				selectee.selected = false;
				selectee.$element.addClass("ui-unselecting");
				selectee.unselecting = true;
				// selectable UNSELECTING callback
				that._trigger("unselecting", event, {
					unselecting: selectee.element
				});
			}
		});

		$(event.target).parents().addBack().each(function() {
			var doSelect,
				selectee = $.data(this, "selectable-item");
			if (selectee) {
				doSelect = (!event.metaKey && !event.ctrlKey) || !selectee.$element.hasClass("ui-selected");
				selectee.$element
					.removeClass(doSelect ? "ui-unselecting" : "ui-selected")
					.addClass(doSelect ? "ui-selecting" : "ui-unselecting");
				selectee.unselecting = !doSelect;
				selectee.selecting = doSelect;
				selectee.selected = doSelect;
				// selectable (UN)SELECTING callback
				if (doSelect) {
					that._trigger("selecting", event, {
						selecting: selectee.element
					});
				} else {
					that._trigger("unselecting", event, {
						unselecting: selectee.element
					});
				}
				return false;
			}
		});

	},

	_mouseDrag: function(event) {

		this.dragged = true;

		if (this.options.disabled) {
			return;
		}

		var tmp,
			that = this,
			options = this.options,
			x1 = this.opos[0],
			y1 = this.opos[1],
			x2 = event.pageX,
			y2 = event.pageY;

		if (x1 > x2) { tmp = x2; x2 = x1; x1 = tmp; }
		if (y1 > y2) { tmp = y2; y2 = y1; y1 = tmp; }
		this.helper.css({ left: x1, top: y1, width: x2 - x1, height: y2 - y1 });

		this.selectees.each(function() {
			var selectee = $.data(this, "selectable-item"),
				hit = false;

			//prevent helper from being selected if appendTo: selectable
			if (!selectee || selectee.element === that.element[0]) {
				return;
			}

			if (options.tolerance === "touch") {
				hit = ( !(selectee.left > x2 || selectee.right < x1 || selectee.top > y2 || selectee.bottom < y1) );
			} else if (options.tolerance === "fit") {
				hit = (selectee.left > x1 && selectee.right < x2 && selectee.top > y1 && selectee.bottom < y2);
			}

			if (hit) {
				// SELECT
				if (selectee.selected) {
					selectee.$element.removeClass("ui-selected");
					selectee.selected = false;
				}
				if (selectee.unselecting) {
					selectee.$element.removeClass("ui-unselecting");
					selectee.unselecting = false;
				}
				if (!selectee.selecting) {
					selectee.$element.addClass("ui-selecting");
					selectee.selecting = true;
					// selectable SELECTING callback
					that._trigger("selecting", event, {
						selecting: selectee.element
					});
				}
			} else {
				// UNSELECT
				if (selectee.selecting) {
					if ((event.metaKey || event.ctrlKey) && selectee.startselected) {
						selectee.$element.removeClass("ui-selecting");
						selectee.selecting = false;
						selectee.$element.addClass("ui-selected");
						selectee.selected = true;
					} else {
						selectee.$element.removeClass("ui-selecting");
						selectee.selecting = false;
						if (selectee.startselected) {
							selectee.$element.addClass("ui-unselecting");
							selectee.unselecting = true;
						}
						// selectable UNSELECTING callback
						that._trigger("unselecting", event, {
							unselecting: selectee.element
						});
					}
				}
				if (selectee.selected) {
					if (!event.metaKey && !event.ctrlKey && !selectee.startselected) {
						selectee.$element.removeClass("ui-selected");
						selectee.selected = false;

						selectee.$element.addClass("ui-unselecting");
						selectee.unselecting = true;
						// selectable UNSELECTING callback
						that._trigger("unselecting", event, {
							unselecting: selectee.element
						});
					}
				}
			}
		});

		return false;
	},

	_mouseStop: function(event) {
		var that = this;

		this.dragged = false;

		$(".ui-unselecting", this.element[0]).each(function() {
			var selectee = $.data(this, "selectable-item");
			selectee.$element.removeClass("ui-unselecting");
			selectee.unselecting = false;
			selectee.startselected = false;
			that._trigger("unselected", event, {
				unselected: selectee.element
			});
		});
		$(".ui-selecting", this.element[0]).each(function() {
			var selectee = $.data(this, "selectable-item");
			selectee.$element.removeClass("ui-selecting").addClass("ui-selected");
			selectee.selecting = false;
			selectee.selected = true;
			selectee.startselected = true;
			that._trigger("selected", event, {
				selected: selectee.element
			});
		});
		this._trigger("stop", event);

		this.helper.remove();

		return false;
	}

});


/*!
 * jQuery UI Selectmenu 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/selectmenu
 */


var selectmenu = $.widget( "ui.selectmenu", {
	version: "1.11.4",
	defaultElement: "<select>",
	options: {
		appendTo: null,
		disabled: null,
		icons: {
			button: "ui-icon-triangle-1-s"
		},
		position: {
			my: "left top",
			at: "left bottom",
			collision: "none"
		},
		width: null,

		// callbacks
		change: null,
		close: null,
		focus: null,
		open: null,
		select: null
	},

	_create: function() {
		var selectmenuId = this.element.uniqueId().attr( "id" );
		this.ids = {
			element: selectmenuId,
			button: selectmenuId + "-button",
			menu: selectmenuId + "-menu"
		};

		this._drawButton();
		this._drawMenu();

		if ( this.options.disabled ) {
			this.disable();
		}
	},

	_drawButton: function() {
		var that = this;

		// Associate existing label with the new button
		this.label = $( "label[for='" + this.ids.element + "']" ).attr( "for", this.ids.button );
		this._on( this.label, {
			click: function( event ) {
				this.button.focus();
				event.preventDefault();
			}
		});

		// Hide original select element
		this.element.hide();

		// Create button
		this.button = $( "<span>", {
			"class": "ui-selectmenu-button ui-widget ui-state-default ui-corner-all",
			tabindex: this.options.disabled ? -1 : 0,
			id: this.ids.button,
			role: "combobox",
			"aria-expanded": "false",
			"aria-autocomplete": "list",
			"aria-owns": this.ids.menu,
			"aria-haspopup": "true"
		})
			.insertAfter( this.element );

		$( "<span>", {
			"class": "ui-icon " + this.options.icons.button
		})
			.prependTo( this.button );

		this.buttonText = $( "<span>", {
			"class": "ui-selectmenu-text"
		})
			.appendTo( this.button );

		this._setText( this.buttonText, this.element.find( "option:selected" ).text() );
		this._resizeButton();

		this._on( this.button, this._buttonEvents );
		this.button.one( "focusin", function() {

			// Delay rendering the menu items until the button receives focus.
			// The menu may have already been rendered via a programmatic open.
			if ( !that.menuItems ) {
				that._refreshMenu();
			}
		});
		this._hoverable( this.button );
		this._focusable( this.button );
	},

	_drawMenu: function() {
		var that = this;

		// Create menu
		this.menu = $( "<ul>", {
			"aria-hidden": "true",
			"aria-labelledby": this.ids.button,
			id: this.ids.menu
		});

		// Wrap menu
		this.menuWrap = $( "<div>", {
			"class": "ui-selectmenu-menu ui-front"
		})
			.append( this.menu )
			.appendTo( this._appendTo() );

		// Initialize menu widget
		this.menuInstance = this.menu
			.menu({
				role: "listbox",
				select: function( event, ui ) {
					event.preventDefault();

					// support: IE8
					// If the item was selected via a click, the text selection
					// will be destroyed in IE
					that._setSelection();

					that._select( ui.item.data( "ui-selectmenu-item" ), event );
				},
				focus: function( event, ui ) {
					var item = ui.item.data( "ui-selectmenu-item" );

					// Prevent inital focus from firing and check if its a newly focused item
					if ( that.focusIndex != null && item.index !== that.focusIndex ) {
						that._trigger( "focus", event, { item: item } );
						if ( !that.isOpen ) {
							that._select( item, event );
						}
					}
					that.focusIndex = item.index;

					that.button.attr( "aria-activedescendant",
						that.menuItems.eq( item.index ).attr( "id" ) );
				}
			})
			.menu( "instance" );

		// Adjust menu styles to dropdown
		this.menu
			.addClass( "ui-corner-bottom" )
			.removeClass( "ui-corner-all" );

		// Don't close the menu on mouseleave
		this.menuInstance._off( this.menu, "mouseleave" );

		// Cancel the menu's collapseAll on document click
		this.menuInstance._closeOnDocumentClick = function() {
			return false;
		};

		// Selects often contain empty items, but never contain dividers
		this.menuInstance._isDivider = function() {
			return false;
		};
	},

	refresh: function() {
		this._refreshMenu();
		this._setText( this.buttonText, this._getSelectedItem().text() );
		if ( !this.options.width ) {
			this._resizeButton();
		}
	},

	_refreshMenu: function() {
		this.menu.empty();

		var item,
			options = this.element.find( "option" );

		if ( !options.length ) {
			return;
		}

		this._parseOptions( options );
		this._renderMenu( this.menu, this.items );

		this.menuInstance.refresh();
		this.menuItems = this.menu.find( "li" ).not( ".ui-selectmenu-optgroup" );

		item = this._getSelectedItem();

		// Update the menu to have the correct item focused
		this.menuInstance.focus( null, item );
		this._setAria( item.data( "ui-selectmenu-item" ) );

		// Set disabled state
		this._setOption( "disabled", this.element.prop( "disabled" ) );
	},

	open: function( event ) {
		if ( this.options.disabled ) {
			return;
		}

		// If this is the first time the menu is being opened, render the items
		if ( !this.menuItems ) {
			this._refreshMenu();
		} else {

			// Menu clears focus on close, reset focus to selected item
			this.menu.find( ".ui-state-focus" ).removeClass( "ui-state-focus" );
			this.menuInstance.focus( null, this._getSelectedItem() );
		}

		this.isOpen = true;
		this._toggleAttr();
		this._resizeMenu();
		this._position();

		this._on( this.document, this._documentClick );

		this._trigger( "open", event );
	},

	_position: function() {
		this.menuWrap.position( $.extend( { of: this.button }, this.options.position ) );
	},

	close: function( event ) {
		if ( !this.isOpen ) {
			return;
		}

		this.isOpen = false;
		this._toggleAttr();

		this.range = null;
		this._off( this.document );

		this._trigger( "close", event );
	},

	widget: function() {
		return this.button;
	},

	menuWidget: function() {
		return this.menu;
	},

	_renderMenu: function( ul, items ) {
		var that = this,
			currentOptgroup = "";

		$.each( items, function( index, item ) {
			if ( item.optgroup !== currentOptgroup ) {
				$( "<li>", {
					"class": "ui-selectmenu-optgroup ui-menu-divider" +
						( item.element.parent( "optgroup" ).prop( "disabled" ) ?
							" ui-state-disabled" :
							"" ),
					text: item.optgroup
				})
					.appendTo( ul );

				currentOptgroup = item.optgroup;
			}

			that._renderItemData( ul, item );
		});
	},

	_renderItemData: function( ul, item ) {
		return this._renderItem( ul, item ).data( "ui-selectmenu-item", item );
	},

	_renderItem: function( ul, item ) {
		var li = $( "<li>" );

		if ( item.disabled ) {
			li.addClass( "ui-state-disabled" );
		}
		this._setText( li, item.label );

		return li.appendTo( ul );
	},

	_setText: function( element, value ) {
		if ( value ) {
			element.text( value );
		} else {
			element.html( "&#160;" );
		}
	},

	_move: function( direction, event ) {
		var item, next,
			filter = ".ui-menu-item";

		if ( this.isOpen ) {
			item = this.menuItems.eq( this.focusIndex );
		} else {
			item = this.menuItems.eq( this.element[ 0 ].selectedIndex );
			filter += ":not(.ui-state-disabled)";
		}

		if ( direction === "first" || direction === "last" ) {
			next = item[ direction === "first" ? "prevAll" : "nextAll" ]( filter ).eq( -1 );
		} else {
			next = item[ direction + "All" ]( filter ).eq( 0 );
		}

		if ( next.length ) {
			this.menuInstance.focus( event, next );
		}
	},

	_getSelectedItem: function() {
		return this.menuItems.eq( this.element[ 0 ].selectedIndex );
	},

	_toggle: function( event ) {
		this[ this.isOpen ? "close" : "open" ]( event );
	},

	_setSelection: function() {
		var selection;

		if ( !this.range ) {
			return;
		}

		if ( window.getSelection ) {
			selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange( this.range );

		// support: IE8
		} else {
			this.range.select();
		}

		// support: IE
		// Setting the text selection kills the button focus in IE, but
		// restoring the focus doesn't kill the selection.
		this.button.focus();
	},

	_documentClick: {
		mousedown: function( event ) {
			if ( !this.isOpen ) {
				return;
			}

			if ( !$( event.target ).closest( ".ui-selectmenu-menu, #" + this.ids.button ).length ) {
				this.close( event );
			}
		}
	},

	_buttonEvents: {

		// Prevent text selection from being reset when interacting with the selectmenu (#10144)
		mousedown: function() {
			var selection;

			if ( window.getSelection ) {
				selection = window.getSelection();
				if ( selection.rangeCount ) {
					this.range = selection.getRangeAt( 0 );
				}

			// support: IE8
			} else {
				this.range = document.selection.createRange();
			}
		},

		click: function( event ) {
			this._setSelection();
			this._toggle( event );
		},

		keydown: function( event ) {
			var preventDefault = true;
			switch ( event.keyCode ) {
				case $.ui.keyCode.TAB:
				case $.ui.keyCode.ESCAPE:
					this.close( event );
					preventDefault = false;
					break;
				case $.ui.keyCode.ENTER:
					if ( this.isOpen ) {
						this._selectFocusedItem( event );
					}
					break;
				case $.ui.keyCode.UP:
					if ( event.altKey ) {
						this._toggle( event );
					} else {
						this._move( "prev", event );
					}
					break;
				case $.ui.keyCode.DOWN:
					if ( event.altKey ) {
						this._toggle( event );
					} else {
						this._move( "next", event );
					}
					break;
				case $.ui.keyCode.SPACE:
					if ( this.isOpen ) {
						this._selectFocusedItem( event );
					} else {
						this._toggle( event );
					}
					break;
				case $.ui.keyCode.LEFT:
					this._move( "prev", event );
					break;
				case $.ui.keyCode.RIGHT:
					this._move( "next", event );
					break;
				case $.ui.keyCode.HOME:
				case $.ui.keyCode.PAGE_UP:
					this._move( "first", event );
					break;
				case $.ui.keyCode.END:
				case $.ui.keyCode.PAGE_DOWN:
					this._move( "last", event );
					break;
				default:
					this.menu.trigger( event );
					preventDefault = false;
			}

			if ( preventDefault ) {
				event.preventDefault();
			}
		}
	},

	_selectFocusedItem: function( event ) {
		var item = this.menuItems.eq( this.focusIndex );
		if ( !item.hasClass( "ui-state-disabled" ) ) {
			this._select( item.data( "ui-selectmenu-item" ), event );
		}
	},

	_select: function( item, event ) {
		var oldIndex = this.element[ 0 ].selectedIndex;

		// Change native select element
		this.element[ 0 ].selectedIndex = item.index;
		this._setText( this.buttonText, item.label );
		this._setAria( item );
		this._trigger( "select", event, { item: item } );

		if ( item.index !== oldIndex ) {
			this._trigger( "change", event, { item: item } );
		}

		this.close( event );
	},

	_setAria: function( item ) {
		var id = this.menuItems.eq( item.index ).attr( "id" );

		this.button.attr({
			"aria-labelledby": id,
			"aria-activedescendant": id
		});
		this.menu.attr( "aria-activedescendant", id );
	},

	_setOption: function( key, value ) {
		if ( key === "icons" ) {
			this.button.find( "span.ui-icon" )
				.removeClass( this.options.icons.button )
				.addClass( value.button );
		}

		this._super( key, value );

		if ( key === "appendTo" ) {
			this.menuWrap.appendTo( this._appendTo() );
		}

		if ( key === "disabled" ) {
			this.menuInstance.option( "disabled", value );
			this.button
				.toggleClass( "ui-state-disabled", value )
				.attr( "aria-disabled", value );

			this.element.prop( "disabled", value );
			if ( value ) {
				this.button.attr( "tabindex", -1 );
				this.close();
			} else {
				this.button.attr( "tabindex", 0 );
			}
		}

		if ( key === "width" ) {
			this._resizeButton();
		}
	},

	_appendTo: function() {
		var element = this.options.appendTo;

		if ( element ) {
			element = element.jquery || element.nodeType ?
				$( element ) :
				this.document.find( element ).eq( 0 );
		}

		if ( !element || !element[ 0 ] ) {
			element = this.element.closest( ".ui-front" );
		}

		if ( !element.length ) {
			element = this.document[ 0 ].body;
		}

		return element;
	},

	_toggleAttr: function() {
		this.button
			.toggleClass( "ui-corner-top", this.isOpen )
			.toggleClass( "ui-corner-all", !this.isOpen )
			.attr( "aria-expanded", this.isOpen );
		this.menuWrap.toggleClass( "ui-selectmenu-open", this.isOpen );
		this.menu.attr( "aria-hidden", !this.isOpen );
	},

	_resizeButton: function() {
		var width = this.options.width;

		if ( !width ) {
			width = this.element.show().outerWidth();
			this.element.hide();
		}

		this.button.outerWidth( width );
	},

	_resizeMenu: function() {
		this.menu.outerWidth( Math.max(
			this.button.outerWidth(),

			// support: IE10
			// IE10 wraps long text (possibly a rounding bug)
			// so we add 1px to avoid the wrapping
			this.menu.width( "" ).outerWidth() + 1
		) );
	},

	_getCreateOptions: function() {
		return { disabled: this.element.prop( "disabled" ) };
	},

	_parseOptions: function( options ) {
		var data = [];
		options.each(function( index, item ) {
			var option = $( item ),
				optgroup = option.parent( "optgroup" );
			data.push({
				element: option,
				index: index,
				value: option.val(),
				label: option.text(),
				optgroup: optgroup.attr( "label" ) || "",
				disabled: optgroup.prop( "disabled" ) || option.prop( "disabled" )
			});
		});
		this.items = data;
	},

	_destroy: function() {
		this.menuWrap.remove();
		this.button.remove();
		this.element.show();
		this.element.removeUniqueId();
		this.label.attr( "for", this.ids.element );
	}
});


/*!
 * jQuery UI Slider 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/slider/
 */


var slider = $.widget( "ui.slider", $.ui.mouse, {
	version: "1.11.4",
	widgetEventPrefix: "slide",

	options: {
		animate: false,
		distance: 0,
		max: 100,
		min: 0,
		orientation: "horizontal",
		range: false,
		step: 1,
		value: 0,
		values: null,

		// callbacks
		change: null,
		slide: null,
		start: null,
		stop: null
	},

	// number of pages in a slider
	// (how many times can you page up/down to go through the whole range)
	numPages: 5,

	_create: function() {
		this._keySliding = false;
		this._mouseSliding = false;
		this._animateOff = true;
		this._handleIndex = null;
		this._detectOrientation();
		this._mouseInit();
		this._calculateNewMax();

		this.element
			.addClass( "ui-slider" +
				" ui-slider-" + this.orientation +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all");

		this._refresh();
		this._setOption( "disabled", this.options.disabled );

		this._animateOff = false;
	},

	_refresh: function() {
		this._createRange();
		this._createHandles();
		this._setupEvents();
		this._refreshValue();
	},

	_createHandles: function() {
		var i, handleCount,
			options = this.options,
			existingHandles = this.element.find( ".ui-slider-handle" ).addClass( "ui-state-default ui-corner-all" ),
			handle = "<span class='ui-slider-handle ui-state-default ui-corner-all' tabindex='0'></span>",
			handles = [];

		handleCount = ( options.values && options.values.length ) || 1;

		if ( existingHandles.length > handleCount ) {
			existingHandles.slice( handleCount ).remove();
			existingHandles = existingHandles.slice( 0, handleCount );
		}

		for ( i = existingHandles.length; i < handleCount; i++ ) {
			handles.push( handle );
		}

		this.handles = existingHandles.add( $( handles.join( "" ) ).appendTo( this.element ) );

		this.handle = this.handles.eq( 0 );

		this.handles.each(function( i ) {
			$( this ).data( "ui-slider-handle-index", i );
		});
	},

	_createRange: function() {
		var options = this.options,
			classes = "";

		if ( options.range ) {
			if ( options.range === true ) {
				if ( !options.values ) {
					options.values = [ this._valueMin(), this._valueMin() ];
				} else if ( options.values.length && options.values.length !== 2 ) {
					options.values = [ options.values[0], options.values[0] ];
				} else if ( $.isArray( options.values ) ) {
					options.values = options.values.slice(0);
				}
			}

			if ( !this.range || !this.range.length ) {
				this.range = $( "<div></div>" )
					.appendTo( this.element );

				classes = "ui-slider-range" +
				// note: this isn't the most fittingly semantic framework class for this element,
				// but worked best visually with a variety of themes
				" ui-widget-header ui-corner-all";
			} else {
				this.range.removeClass( "ui-slider-range-min ui-slider-range-max" )
					// Handle range switching from true to min/max
					.css({
						"left": "",
						"bottom": ""
					});
			}

			this.range.addClass( classes +
				( ( options.range === "min" || options.range === "max" ) ? " ui-slider-range-" + options.range : "" ) );
		} else {
			if ( this.range ) {
				this.range.remove();
			}
			this.range = null;
		}
	},

	_setupEvents: function() {
		this._off( this.handles );
		this._on( this.handles, this._handleEvents );
		this._hoverable( this.handles );
		this._focusable( this.handles );
	},

	_destroy: function() {
		this.handles.remove();
		if ( this.range ) {
			this.range.remove();
		}

		this.element
			.removeClass( "ui-slider" +
				" ui-slider-horizontal" +
				" ui-slider-vertical" +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all" );

		this._mouseDestroy();
	},

	_mouseCapture: function( event ) {
		var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
			that = this,
			o = this.options;

		if ( o.disabled ) {
			return false;
		}

		this.elementSize = {
			width: this.element.outerWidth(),
			height: this.element.outerHeight()
		};
		this.elementOffset = this.element.offset();

		position = { x: event.pageX, y: event.pageY };
		normValue = this._normValueFromMouse( position );
		distance = this._valueMax() - this._valueMin() + 1;
		this.handles.each(function( i ) {
			var thisDistance = Math.abs( normValue - that.values(i) );
			if (( distance > thisDistance ) ||
				( distance === thisDistance &&
					(i === that._lastChangedValue || that.values(i) === o.min ))) {
				distance = thisDistance;
				closestHandle = $( this );
				index = i;
			}
		});

		allowed = this._start( event, index );
		if ( allowed === false ) {
			return false;
		}
		this._mouseSliding = true;

		this._handleIndex = index;

		closestHandle
			.addClass( "ui-state-active" )
			.focus();

		offset = closestHandle.offset();
		mouseOverHandle = !$( event.target ).parents().addBack().is( ".ui-slider-handle" );
		this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
			left: event.pageX - offset.left - ( closestHandle.width() / 2 ),
			top: event.pageY - offset.top -
				( closestHandle.height() / 2 ) -
				( parseInt( closestHandle.css("borderTopWidth"), 10 ) || 0 ) -
				( parseInt( closestHandle.css("borderBottomWidth"), 10 ) || 0) +
				( parseInt( closestHandle.css("marginTop"), 10 ) || 0)
		};

		if ( !this.handles.hasClass( "ui-state-hover" ) ) {
			this._slide( event, index, normValue );
		}
		this._animateOff = true;
		return true;
	},

	_mouseStart: function() {
		return true;
	},

	_mouseDrag: function( event ) {
		var position = { x: event.pageX, y: event.pageY },
			normValue = this._normValueFromMouse( position );

		this._slide( event, this._handleIndex, normValue );

		return false;
	},

	_mouseStop: function( event ) {
		this.handles.removeClass( "ui-state-active" );
		this._mouseSliding = false;

		this._stop( event, this._handleIndex );
		this._change( event, this._handleIndex );

		this._handleIndex = null;
		this._clickOffset = null;
		this._animateOff = false;

		return false;
	},

	_detectOrientation: function() {
		this.orientation = ( this.options.orientation === "vertical" ) ? "vertical" : "horizontal";
	},

	_normValueFromMouse: function( position ) {
		var pixelTotal,
			pixelMouse,
			percentMouse,
			valueTotal,
			valueMouse;

		if ( this.orientation === "horizontal" ) {
			pixelTotal = this.elementSize.width;
			pixelMouse = position.x - this.elementOffset.left - ( this._clickOffset ? this._clickOffset.left : 0 );
		} else {
			pixelTotal = this.elementSize.height;
			pixelMouse = position.y - this.elementOffset.top - ( this._clickOffset ? this._clickOffset.top : 0 );
		}

		percentMouse = ( pixelMouse / pixelTotal );
		if ( percentMouse > 1 ) {
			percentMouse = 1;
		}
		if ( percentMouse < 0 ) {
			percentMouse = 0;
		}
		if ( this.orientation === "vertical" ) {
			percentMouse = 1 - percentMouse;
		}

		valueTotal = this._valueMax() - this._valueMin();
		valueMouse = this._valueMin() + percentMouse * valueTotal;

		return this._trimAlignValue( valueMouse );
	},

	_start: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}
		return this._trigger( "start", event, uiHash );
	},

	_slide: function( event, index, newVal ) {
		var otherVal,
			newValues,
			allowed;

		if ( this.options.values && this.options.values.length ) {
			otherVal = this.values( index ? 0 : 1 );

			if ( ( this.options.values.length === 2 && this.options.range === true ) &&
					( ( index === 0 && newVal > otherVal) || ( index === 1 && newVal < otherVal ) )
				) {
				newVal = otherVal;
			}

			if ( newVal !== this.values( index ) ) {
				newValues = this.values();
				newValues[ index ] = newVal;
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal,
					values: newValues
				} );
				otherVal = this.values( index ? 0 : 1 );
				if ( allowed !== false ) {
					this.values( index, newVal );
				}
			}
		} else {
			if ( newVal !== this.value() ) {
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal
				} );
				if ( allowed !== false ) {
					this.value( newVal );
				}
			}
		}
	},

	_stop: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}

		this._trigger( "stop", event, uiHash );
	},

	_change: function( event, index ) {
		if ( !this._keySliding && !this._mouseSliding ) {
			var uiHash = {
				handle: this.handles[ index ],
				value: this.value()
			};
			if ( this.options.values && this.options.values.length ) {
				uiHash.value = this.values( index );
				uiHash.values = this.values();
			}

			//store the last changed value index for reference when handles overlap
			this._lastChangedValue = index;

			this._trigger( "change", event, uiHash );
		}
	},

	value: function( newValue ) {
		if ( arguments.length ) {
			this.options.value = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, 0 );
			return;
		}

		return this._value();
	},

	values: function( index, newValue ) {
		var vals,
			newValues,
			i;

		if ( arguments.length > 1 ) {
			this.options.values[ index ] = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, index );
			return;
		}

		if ( arguments.length ) {
			if ( $.isArray( arguments[ 0 ] ) ) {
				vals = this.options.values;
				newValues = arguments[ 0 ];
				for ( i = 0; i < vals.length; i += 1 ) {
					vals[ i ] = this._trimAlignValue( newValues[ i ] );
					this._change( null, i );
				}
				this._refreshValue();
			} else {
				if ( this.options.values && this.options.values.length ) {
					return this._values( index );
				} else {
					return this.value();
				}
			}
		} else {
			return this._values();
		}
	},

	_setOption: function( key, value ) {
		var i,
			valsLength = 0;

		if ( key === "range" && this.options.range === true ) {
			if ( value === "min" ) {
				this.options.value = this._values( 0 );
				this.options.values = null;
			} else if ( value === "max" ) {
				this.options.value = this._values( this.options.values.length - 1 );
				this.options.values = null;
			}
		}

		if ( $.isArray( this.options.values ) ) {
			valsLength = this.options.values.length;
		}

		if ( key === "disabled" ) {
			this.element.toggleClass( "ui-state-disabled", !!value );
		}

		this._super( key, value );

		switch ( key ) {
			case "orientation":
				this._detectOrientation();
				this.element
					.removeClass( "ui-slider-horizontal ui-slider-vertical" )
					.addClass( "ui-slider-" + this.orientation );
				this._refreshValue();

				// Reset positioning from previous orientation
				this.handles.css( value === "horizontal" ? "bottom" : "left", "" );
				break;
			case "value":
				this._animateOff = true;
				this._refreshValue();
				this._change( null, 0 );
				this._animateOff = false;
				break;
			case "values":
				this._animateOff = true;
				this._refreshValue();
				for ( i = 0; i < valsLength; i += 1 ) {
					this._change( null, i );
				}
				this._animateOff = false;
				break;
			case "step":
			case "min":
			case "max":
				this._animateOff = true;
				this._calculateNewMax();
				this._refreshValue();
				this._animateOff = false;
				break;
			case "range":
				this._animateOff = true;
				this._refresh();
				this._animateOff = false;
				break;
		}
	},

	//internal value getter
	// _value() returns value trimmed by min and max, aligned by step
	_value: function() {
		var val = this.options.value;
		val = this._trimAlignValue( val );

		return val;
	},

	//internal values getter
	// _values() returns array of values trimmed by min and max, aligned by step
	// _values( index ) returns single value trimmed by min and max, aligned by step
	_values: function( index ) {
		var val,
			vals,
			i;

		if ( arguments.length ) {
			val = this.options.values[ index ];
			val = this._trimAlignValue( val );

			return val;
		} else if ( this.options.values && this.options.values.length ) {
			// .slice() creates a copy of the array
			// this copy gets trimmed by min and max and then returned
			vals = this.options.values.slice();
			for ( i = 0; i < vals.length; i += 1) {
				vals[ i ] = this._trimAlignValue( vals[ i ] );
			}

			return vals;
		} else {
			return [];
		}
	},

	// returns the step-aligned value that val is closest to, between (inclusive) min and max
	_trimAlignValue: function( val ) {
		if ( val <= this._valueMin() ) {
			return this._valueMin();
		}
		if ( val >= this._valueMax() ) {
			return this._valueMax();
		}
		var step = ( this.options.step > 0 ) ? this.options.step : 1,
			valModStep = (val - this._valueMin()) % step,
			alignValue = val - valModStep;

		if ( Math.abs(valModStep) * 2 >= step ) {
			alignValue += ( valModStep > 0 ) ? step : ( -step );
		}

		// Since JavaScript has problems with large floats, round
		// the final value to 5 digits after the decimal point (see #4124)
		return parseFloat( alignValue.toFixed(5) );
	},

	_calculateNewMax: function() {
		var max = this.options.max,
			min = this._valueMin(),
			step = this.options.step,
			aboveMin = Math.floor( ( +( max - min ).toFixed( this._precision() ) ) / step ) * step;
		max = aboveMin + min;
		this.max = parseFloat( max.toFixed( this._precision() ) );
	},

	_precision: function() {
		var precision = this._precisionOf( this.options.step );
		if ( this.options.min !== null ) {
			precision = Math.max( precision, this._precisionOf( this.options.min ) );
		}
		return precision;
	},

	_precisionOf: function( num ) {
		var str = num.toString(),
			decimal = str.indexOf( "." );
		return decimal === -1 ? 0 : str.length - decimal - 1;
	},

	_valueMin: function() {
		return this.options.min;
	},

	_valueMax: function() {
		return this.max;
	},

	_refreshValue: function() {
		var lastValPercent, valPercent, value, valueMin, valueMax,
			oRange = this.options.range,
			o = this.options,
			that = this,
			animate = ( !this._animateOff ) ? o.animate : false,
			_set = {};

		if ( this.options.values && this.options.values.length ) {
			this.handles.each(function( i ) {
				valPercent = ( that.values(i) - that._valueMin() ) / ( that._valueMax() - that._valueMin() ) * 100;
				_set[ that.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
				$( this ).stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );
				if ( that.options.range === true ) {
					if ( that.orientation === "horizontal" ) {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { left: valPercent + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { width: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					} else {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { bottom: ( valPercent ) + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { height: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					}
				}
				lastValPercent = valPercent;
			});
		} else {
			value = this.value();
			valueMin = this._valueMin();
			valueMax = this._valueMax();
			valPercent = ( valueMax !== valueMin ) ?
					( value - valueMin ) / ( valueMax - valueMin ) * 100 :
					0;
			_set[ this.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
			this.handle.stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );

			if ( oRange === "min" && this.orientation === "horizontal" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { width: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "horizontal" ) {
				this.range[ animate ? "animate" : "css" ]( { width: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
			if ( oRange === "min" && this.orientation === "vertical" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { height: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "vertical" ) {
				this.range[ animate ? "animate" : "css" ]( { height: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
		}
	},

	_handleEvents: {
		keydown: function( event ) {
			var allowed, curVal, newVal, step,
				index = $( event.target ).data( "ui-slider-handle-index" );

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
				case $.ui.keyCode.END:
				case $.ui.keyCode.PAGE_UP:
				case $.ui.keyCode.PAGE_DOWN:
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					event.preventDefault();
					if ( !this._keySliding ) {
						this._keySliding = true;
						$( event.target ).addClass( "ui-state-active" );
						allowed = this._start( event, index );
						if ( allowed === false ) {
							return;
						}
					}
					break;
			}

			step = this.options.step;
			if ( this.options.values && this.options.values.length ) {
				curVal = newVal = this.values( index );
			} else {
				curVal = newVal = this.value();
			}

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
					newVal = this._valueMin();
					break;
				case $.ui.keyCode.END:
					newVal = this._valueMax();
					break;
				case $.ui.keyCode.PAGE_UP:
					newVal = this._trimAlignValue(
						curVal + ( ( this._valueMax() - this._valueMin() ) / this.numPages )
					);
					break;
				case $.ui.keyCode.PAGE_DOWN:
					newVal = this._trimAlignValue(
						curVal - ( (this._valueMax() - this._valueMin()) / this.numPages ) );
					break;
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
					if ( curVal === this._valueMax() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal + step );
					break;
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					if ( curVal === this._valueMin() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal - step );
					break;
			}

			this._slide( event, index, newVal );
		},
		keyup: function( event ) {
			var index = $( event.target ).data( "ui-slider-handle-index" );

			if ( this._keySliding ) {
				this._keySliding = false;
				this._stop( event, index );
				this._change( event, index );
				$( event.target ).removeClass( "ui-state-active" );
			}
		}
	}
});


/*!
 * jQuery UI Sortable 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/sortable/
 */


var sortable = $.widget("ui.sortable", $.ui.mouse, {
	version: "1.11.4",
	widgetEventPrefix: "sort",
	ready: false,
	options: {
		appendTo: "parent",
		axis: false,
		connectWith: false,
		containment: false,
		cursor: "auto",
		cursorAt: false,
		dropOnEmpty: true,
		forcePlaceholderSize: false,
		forceHelperSize: false,
		grid: false,
		handle: false,
		helper: "original",
		items: "> *",
		opacity: false,
		placeholder: false,
		revert: false,
		scroll: true,
		scrollSensitivity: 20,
		scrollSpeed: 20,
		scope: "default",
		tolerance: "intersect",
		zIndex: 1000,

		// callbacks
		activate: null,
		beforeStop: null,
		change: null,
		deactivate: null,
		out: null,
		over: null,
		receive: null,
		remove: null,
		sort: null,
		start: null,
		stop: null,
		update: null
	},

	_isOverAxis: function( x, reference, size ) {
		return ( x >= reference ) && ( x < ( reference + size ) );
	},

	_isFloating: function( item ) {
		return (/left|right/).test(item.css("float")) || (/inline|table-cell/).test(item.css("display"));
	},

	_create: function() {
		this.containerCache = {};
		this.element.addClass("ui-sortable");

		//Get the items
		this.refresh();

		//Let's determine the parent's offset
		this.offset = this.element.offset();

		//Initialize mouse events for interaction
		this._mouseInit();

		this._setHandleClassName();

		//We're ready to go
		this.ready = true;

	},

	_setOption: function( key, value ) {
		this._super( key, value );

		if ( key === "handle" ) {
			this._setHandleClassName();
		}
	},

	_setHandleClassName: function() {
		this.element.find( ".ui-sortable-handle" ).removeClass( "ui-sortable-handle" );
		$.each( this.items, function() {
			( this.instance.options.handle ?
				this.item.find( this.instance.options.handle ) : this.item )
				.addClass( "ui-sortable-handle" );
		});
	},

	_destroy: function() {
		this.element
			.removeClass( "ui-sortable ui-sortable-disabled" )
			.find( ".ui-sortable-handle" )
				.removeClass( "ui-sortable-handle" );
		this._mouseDestroy();

		for ( var i = this.items.length - 1; i >= 0; i-- ) {
			this.items[i].item.removeData(this.widgetName + "-item");
		}

		return this;
	},

	_mouseCapture: function(event, overrideHandle) {
		var currentItem = null,
			validHandle = false,
			that = this;

		if (this.reverting) {
			return false;
		}

		if(this.options.disabled || this.options.type === "static") {
			return false;
		}

		//We have to refresh the items data once first
		this._refreshItems(event);

		//Find out if the clicked node (or one of its parents) is a actual item in this.items
		$(event.target).parents().each(function() {
			if($.data(this, that.widgetName + "-item") === that) {
				currentItem = $(this);
				return false;
			}
		});
		if($.data(event.target, that.widgetName + "-item") === that) {
			currentItem = $(event.target);
		}

		if(!currentItem) {
			return false;
		}
		if(this.options.handle && !overrideHandle) {
			$(this.options.handle, currentItem).find("*").addBack().each(function() {
				if(this === event.target) {
					validHandle = true;
				}
			});
			if(!validHandle) {
				return false;
			}
		}

		this.currentItem = currentItem;
		this._removeCurrentsFromItems();
		return true;

	},

	_mouseStart: function(event, overrideHandle, noActivation) {

		var i, body,
			o = this.options;

		this.currentContainer = this;

		//We only need to call refreshPositions, because the refreshItems call has been moved to mouseCapture
		this.refreshPositions();

		//Create and append the visible helper
		this.helper = this._createHelper(event);

		//Cache the helper size
		this._cacheHelperProportions();

		/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of draggables.
		 */

		//Cache the margins of the original element
		this._cacheMargins();

		//Get the next scrolling parent
		this.scrollParent = this.helper.scrollParent();

		//The element's absolute position on the page minus margins
		this.offset = this.currentItem.offset();
		this.offset = {
			top: this.offset.top - this.margins.top,
			left: this.offset.left - this.margins.left
		};

		$.extend(this.offset, {
			click: { //Where the click happened, relative to the element
				left: event.pageX - this.offset.left,
				top: event.pageY - this.offset.top
			},
			parent: this._getParentOffset(),
			relative: this._getRelativeOffset() //This is a relative to absolute position minus the actual position calculation - only used for relative positioned helper
		});

		// Only after we got the offset, we can change the helper's position to absolute
		// TODO: Still need to figure out a way to make relative sorting possible
		this.helper.css("position", "absolute");
		this.cssPosition = this.helper.css("position");

		//Generate the original position
		this.originalPosition = this._generatePosition(event);
		this.originalPageX = event.pageX;
		this.originalPageY = event.pageY;

		//Adjust the mouse offset relative to the helper if "cursorAt" is supplied
		(o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt));

		//Cache the former DOM position
		this.domPosition = { prev: this.currentItem.prev()[0], parent: this.currentItem.parent()[0] };

		//If the helper is not the original, hide the original so it's not playing any role during the drag, won't cause anything bad this way
		if(this.helper[0] !== this.currentItem[0]) {
			this.currentItem.hide();
		}

		//Create the placeholder
		this._createPlaceholder();

		//Set a containment if given in the options
		if(o.containment) {
			this._setContainment();
		}

		if( o.cursor && o.cursor !== "auto" ) { // cursor option
			body = this.document.find( "body" );

			// support: IE
			this.storedCursor = body.css( "cursor" );
			body.css( "cursor", o.cursor );

			this.storedStylesheet = $( "<style>*{ cursor: "+o.cursor+" !important; }</style>" ).appendTo( body );
		}

		if(o.opacity) { // opacity option
			if (this.helper.css("opacity")) {
				this._storedOpacity = this.helper.css("opacity");
			}
			this.helper.css("opacity", o.opacity);
		}

		if(o.zIndex) { // zIndex option
			if (this.helper.css("zIndex")) {
				this._storedZIndex = this.helper.css("zIndex");
			}
			this.helper.css("zIndex", o.zIndex);
		}

		//Prepare scrolling
		if(this.scrollParent[0] !== this.document[0] && this.scrollParent[0].tagName !== "HTML") {
			this.overflowOffset = this.scrollParent.offset();
		}

		//Call callbacks
		this._trigger("start", event, this._uiHash());

		//Recache the helper size
		if(!this._preserveHelperProportions) {
			this._cacheHelperProportions();
		}


		//Post "activate" events to possible containers
		if( !noActivation ) {
			for ( i = this.containers.length - 1; i >= 0; i-- ) {
				this.containers[ i ]._trigger( "activate", event, this._uiHash( this ) );
			}
		}

		//Prepare possible droppables
		if($.ui.ddmanager) {
			$.ui.ddmanager.current = this;
		}

		if ($.ui.ddmanager && !o.dropBehaviour) {
			$.ui.ddmanager.prepareOffsets(this, event);
		}

		this.dragging = true;

		this.helper.addClass("ui-sortable-helper");
		this._mouseDrag(event); //Execute the drag once - this causes the helper not to be visible before getting its correct position
		return true;

	},

	_mouseDrag: function(event) {
		var i, item, itemElement, intersection,
			o = this.options,
			scrolled = false;

		//Compute the helpers position
		this.position = this._generatePosition(event);
		this.positionAbs = this._convertPositionTo("absolute");

		if (!this.lastPositionAbs) {
			this.lastPositionAbs = this.positionAbs;
		}

		//Do scrolling
		if(this.options.scroll) {
			if(this.scrollParent[0] !== this.document[0] && this.scrollParent[0].tagName !== "HTML") {

				if((this.overflowOffset.top + this.scrollParent[0].offsetHeight) - event.pageY < o.scrollSensitivity) {
					this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop + o.scrollSpeed;
				} else if(event.pageY - this.overflowOffset.top < o.scrollSensitivity) {
					this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop - o.scrollSpeed;
				}

				if((this.overflowOffset.left + this.scrollParent[0].offsetWidth) - event.pageX < o.scrollSensitivity) {
					this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft + o.scrollSpeed;
				} else if(event.pageX - this.overflowOffset.left < o.scrollSensitivity) {
					this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft - o.scrollSpeed;
				}

			} else {

				if(event.pageY - this.document.scrollTop() < o.scrollSensitivity) {
					scrolled = this.document.scrollTop(this.document.scrollTop() - o.scrollSpeed);
				} else if(this.window.height() - (event.pageY - this.document.scrollTop()) < o.scrollSensitivity) {
					scrolled = this.document.scrollTop(this.document.scrollTop() + o.scrollSpeed);
				}

				if(event.pageX - this.document.scrollLeft() < o.scrollSensitivity) {
					scrolled = this.document.scrollLeft(this.document.scrollLeft() - o.scrollSpeed);
				} else if(this.window.width() - (event.pageX - this.document.scrollLeft()) < o.scrollSensitivity) {
					scrolled = this.document.scrollLeft(this.document.scrollLeft() + o.scrollSpeed);
				}

			}

			if(scrolled !== false && $.ui.ddmanager && !o.dropBehaviour) {
				$.ui.ddmanager.prepareOffsets(this, event);
			}
		}

		//Regenerate the absolute position used for position checks
		this.positionAbs = this._convertPositionTo("absolute");

		//Set the helper position
		if(!this.options.axis || this.options.axis !== "y") {
			this.helper[0].style.left = this.position.left+"px";
		}
		if(!this.options.axis || this.options.axis !== "x") {
			this.helper[0].style.top = this.position.top+"px";
		}

		//Rearrange
		for (i = this.items.length - 1; i >= 0; i--) {

			//Cache variables and intersection, continue if no intersection
			item = this.items[i];
			itemElement = item.item[0];
			intersection = this._intersectsWithPointer(item);
			if (!intersection) {
				continue;
			}

			// Only put the placeholder inside the current Container, skip all
			// items from other containers. This works because when moving
			// an item from one container to another the
			// currentContainer is switched before the placeholder is moved.
			//
			// Without this, moving items in "sub-sortables" can cause
			// the placeholder to jitter between the outer and inner container.
			if (item.instance !== this.currentContainer) {
				continue;
			}

			// cannot intersect with itself
			// no useless actions that have been done before
			// no action if the item moved is the parent of the item checked
			if (itemElement !== this.currentItem[0] &&
				this.placeholder[intersection === 1 ? "next" : "prev"]()[0] !== itemElement &&
				!$.contains(this.placeholder[0], itemElement) &&
				(this.options.type === "semi-dynamic" ? !$.contains(this.element[0], itemElement) : true)
			) {

				this.direction = intersection === 1 ? "down" : "up";

				if (this.options.tolerance === "pointer" || this._intersectsWithSides(item)) {
					this._rearrange(event, item);
				} else {
					break;
				}

				this._trigger("change", event, this._uiHash());
				break;
			}
		}

		//Post events to containers
		this._contactContainers(event);

		//Interconnect with droppables
		if($.ui.ddmanager) {
			$.ui.ddmanager.drag(this, event);
		}

		//Call callbacks
		this._trigger("sort", event, this._uiHash());

		this.lastPositionAbs = this.positionAbs;
		return false;

	},

	_mouseStop: function(event, noPropagation) {

		if(!event) {
			return;
		}

		//If we are using droppables, inform the manager about the drop
		if ($.ui.ddmanager && !this.options.dropBehaviour) {
			$.ui.ddmanager.drop(this, event);
		}

		if(this.options.revert) {
			var that = this,
				cur = this.placeholder.offset(),
				axis = this.options.axis,
				animation = {};

			if ( !axis || axis === "x" ) {
				animation.left = cur.left - this.offset.parent.left - this.margins.left + (this.offsetParent[0] === this.document[0].body ? 0 : this.offsetParent[0].scrollLeft);
			}
			if ( !axis || axis === "y" ) {
				animation.top = cur.top - this.offset.parent.top - this.margins.top + (this.offsetParent[0] === this.document[0].body ? 0 : this.offsetParent[0].scrollTop);
			}
			this.reverting = true;
			$(this.helper).animate( animation, parseInt(this.options.revert, 10) || 500, function() {
				that._clear(event);
			});
		} else {
			this._clear(event, noPropagation);
		}

		return false;

	},

	cancel: function() {

		if(this.dragging) {

			this._mouseUp({ target: null });

			if(this.options.helper === "original") {
				this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper");
			} else {
				this.currentItem.show();
			}

			//Post deactivating events to containers
			for (var i = this.containers.length - 1; i >= 0; i--){
				this.containers[i]._trigger("deactivate", null, this._uiHash(this));
				if(this.containers[i].containerCache.over) {
					this.containers[i]._trigger("out", null, this._uiHash(this));
					this.containers[i].containerCache.over = 0;
				}
			}

		}

		if (this.placeholder) {
			//$(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately, it unbinds ALL events from the original node!
			if(this.placeholder[0].parentNode) {
				this.placeholder[0].parentNode.removeChild(this.placeholder[0]);
			}
			if(this.options.helper !== "original" && this.helper && this.helper[0].parentNode) {
				this.helper.remove();
			}

			$.extend(this, {
				helper: null,
				dragging: false,
				reverting: false,
				_noFinalSort: null
			});

			if(this.domPosition.prev) {
				$(this.domPosition.prev).after(this.currentItem);
			} else {
				$(this.domPosition.parent).prepend(this.currentItem);
			}
		}

		return this;

	},

	serialize: function(o) {

		var items = this._getItemsAsjQuery(o && o.connected),
			str = [];
		o = o || {};

		$(items).each(function() {
			var res = ($(o.item || this).attr(o.attribute || "id") || "").match(o.expression || (/(.+)[\-=_](.+)/));
			if (res) {
				str.push((o.key || res[1]+"[]")+"="+(o.key && o.expression ? res[1] : res[2]));
			}
		});

		if(!str.length && o.key) {
			str.push(o.key + "=");
		}

		return str.join("&");

	},

	toArray: function(o) {

		var items = this._getItemsAsjQuery(o && o.connected),
			ret = [];

		o = o || {};

		items.each(function() { ret.push($(o.item || this).attr(o.attribute || "id") || ""); });
		return ret;

	},

	/* Be careful with the following core functions */
	_intersectsWith: function(item) {

		var x1 = this.positionAbs.left,
			x2 = x1 + this.helperProportions.width,
			y1 = this.positionAbs.top,
			y2 = y1 + this.helperProportions.height,
			l = item.left,
			r = l + item.width,
			t = item.top,
			b = t + item.height,
			dyClick = this.offset.click.top,
			dxClick = this.offset.click.left,
			isOverElementHeight = ( this.options.axis === "x" ) || ( ( y1 + dyClick ) > t && ( y1 + dyClick ) < b ),
			isOverElementWidth = ( this.options.axis === "y" ) || ( ( x1 + dxClick ) > l && ( x1 + dxClick ) < r ),
			isOverElement = isOverElementHeight && isOverElementWidth;

		if ( this.options.tolerance === "pointer" ||
			this.options.forcePointerForContainers ||
			(this.options.tolerance !== "pointer" && this.helperProportions[this.floating ? "width" : "height"] > item[this.floating ? "width" : "height"])
		) {
			return isOverElement;
		} else {

			return (l < x1 + (this.helperProportions.width / 2) && // Right Half
				x2 - (this.helperProportions.width / 2) < r && // Left Half
				t < y1 + (this.helperProportions.height / 2) && // Bottom Half
				y2 - (this.helperProportions.height / 2) < b ); // Top Half

		}
	},

	_intersectsWithPointer: function(item) {

		var isOverElementHeight = (this.options.axis === "x") || this._isOverAxis(this.positionAbs.top + this.offset.click.top, item.top, item.height),
			isOverElementWidth = (this.options.axis === "y") || this._isOverAxis(this.positionAbs.left + this.offset.click.left, item.left, item.width),
			isOverElement = isOverElementHeight && isOverElementWidth,
			verticalDirection = this._getDragVerticalDirection(),
			horizontalDirection = this._getDragHorizontalDirection();

		if (!isOverElement) {
			return false;
		}

		return this.floating ?
			( ((horizontalDirection && horizontalDirection === "right") || verticalDirection === "down") ? 2 : 1 )
			: ( verticalDirection && (verticalDirection === "down" ? 2 : 1) );

	},

	_intersectsWithSides: function(item) {

		var isOverBottomHalf = this._isOverAxis(this.positionAbs.top + this.offset.click.top, item.top + (item.height/2), item.height),
			isOverRightHalf = this._isOverAxis(this.positionAbs.left + this.offset.click.left, item.left + (item.width/2), item.width),
			verticalDirection = this._getDragVerticalDirection(),
			horizontalDirection = this._getDragHorizontalDirection();

		if (this.floating && horizontalDirection) {
			return ((horizontalDirection === "right" && isOverRightHalf) || (horizontalDirection === "left" && !isOverRightHalf));
		} else {
			return verticalDirection && ((verticalDirection === "down" && isOverBottomHalf) || (verticalDirection === "up" && !isOverBottomHalf));
		}

	},

	_getDragVerticalDirection: function() {
		var delta = this.positionAbs.top - this.lastPositionAbs.top;
		return delta !== 0 && (delta > 0 ? "down" : "up");
	},

	_getDragHorizontalDirection: function() {
		var delta = this.positionAbs.left - this.lastPositionAbs.left;
		return delta !== 0 && (delta > 0 ? "right" : "left");
	},

	refresh: function(event) {
		this._refreshItems(event);
		this._setHandleClassName();
		this.refreshPositions();
		return this;
	},

	_connectWith: function() {
		var options = this.options;
		return options.connectWith.constructor === String ? [options.connectWith] : options.connectWith;
	},

	_getItemsAsjQuery: function(connected) {

		var i, j, cur, inst,
			items = [],
			queries = [],
			connectWith = this._connectWith();

		if(connectWith && connected) {
			for (i = connectWith.length - 1; i >= 0; i--){
				cur = $(connectWith[i], this.document[0]);
				for ( j = cur.length - 1; j >= 0; j--){
					inst = $.data(cur[j], this.widgetFullName);
					if(inst && inst !== this && !inst.options.disabled) {
						queries.push([$.isFunction(inst.options.items) ? inst.options.items.call(inst.element) : $(inst.options.items, inst.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"), inst]);
					}
				}
			}
		}

		queries.push([$.isFunction(this.options.items) ? this.options.items.call(this.element, null, { options: this.options, item: this.currentItem }) : $(this.options.items, this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"), this]);

		function addItems() {
			items.push( this );
		}
		for (i = queries.length - 1; i >= 0; i--){
			queries[i][0].each( addItems );
		}

		return $(items);

	},

	_removeCurrentsFromItems: function() {

		var list = this.currentItem.find(":data(" + this.widgetName + "-item)");

		this.items = $.grep(this.items, function (item) {
			for (var j=0; j < list.length; j++) {
				if(list[j] === item.item[0]) {
					return false;
				}
			}
			return true;
		});

	},

	_refreshItems: function(event) {

		this.items = [];
		this.containers = [this];

		var i, j, cur, inst, targetData, _queries, item, queriesLength,
			items = this.items,
			queries = [[$.isFunction(this.options.items) ? this.options.items.call(this.element[0], event, { item: this.currentItem }) : $(this.options.items, this.element), this]],
			connectWith = this._connectWith();

		if(connectWith && this.ready) { //Shouldn't be run the first time through due to massive slow-down
			for (i = connectWith.length - 1; i >= 0; i--){
				cur = $(connectWith[i], this.document[0]);
				for (j = cur.length - 1; j >= 0; j--){
					inst = $.data(cur[j], this.widgetFullName);
					if(inst && inst !== this && !inst.options.disabled) {
						queries.push([$.isFunction(inst.options.items) ? inst.options.items.call(inst.element[0], event, { item: this.currentItem }) : $(inst.options.items, inst.element), inst]);
						this.containers.push(inst);
					}
				}
			}
		}

		for (i = queries.length - 1; i >= 0; i--) {
			targetData = queries[i][1];
			_queries = queries[i][0];

			for (j=0, queriesLength = _queries.length; j < queriesLength; j++) {
				item = $(_queries[j]);

				item.data(this.widgetName + "-item", targetData); // Data for target checking (mouse manager)

				items.push({
					item: item,
					instance: targetData,
					width: 0, height: 0,
					left: 0, top: 0
				});
			}
		}

	},

	refreshPositions: function(fast) {

		// Determine whether items are being displayed horizontally
		this.floating = this.items.length ?
			this.options.axis === "x" || this._isFloating( this.items[ 0 ].item ) :
			false;

		//This has to be redone because due to the item being moved out/into the offsetParent, the offsetParent's position will change
		if(this.offsetParent && this.helper) {
			this.offset.parent = this._getParentOffset();
		}

		var i, item, t, p;

		for (i = this.items.length - 1; i >= 0; i--){
			item = this.items[i];

			//We ignore calculating positions of all connected containers when we're not over them
			if(item.instance !== this.currentContainer && this.currentContainer && item.item[0] !== this.currentItem[0]) {
				continue;
			}

			t = this.options.toleranceElement ? $(this.options.toleranceElement, item.item) : item.item;

			if (!fast) {
				item.width = t.outerWidth();
				item.height = t.outerHeight();
			}

			p = t.offset();
			item.left = p.left;
			item.top = p.top;
		}

		if(this.options.custom && this.options.custom.refreshContainers) {
			this.options.custom.refreshContainers.call(this);
		} else {
			for (i = this.containers.length - 1; i >= 0; i--){
				p = this.containers[i].element.offset();
				this.containers[i].containerCache.left = p.left;
				this.containers[i].containerCache.top = p.top;
				this.containers[i].containerCache.width = this.containers[i].element.outerWidth();
				this.containers[i].containerCache.height = this.containers[i].element.outerHeight();
			}
		}

		return this;
	},

	_createPlaceholder: function(that) {
		that = that || this;
		var className,
			o = that.options;

		if(!o.placeholder || o.placeholder.constructor === String) {
			className = o.placeholder;
			o.placeholder = {
				element: function() {

					var nodeName = that.currentItem[0].nodeName.toLowerCase(),
						element = $( "<" + nodeName + ">", that.document[0] )
							.addClass(className || that.currentItem[0].className+" ui-sortable-placeholder")
							.removeClass("ui-sortable-helper");

					if ( nodeName === "tbody" ) {
						that._createTrPlaceholder(
							that.currentItem.find( "tr" ).eq( 0 ),
							$( "<tr>", that.document[ 0 ] ).appendTo( element )
						);
					} else if ( nodeName === "tr" ) {
						that._createTrPlaceholder( that.currentItem, element );
					} else if ( nodeName === "img" ) {
						element.attr( "src", that.currentItem.attr( "src" ) );
					}

					if ( !className ) {
						element.css( "visibility", "hidden" );
					}

					return element;
				},
				update: function(container, p) {

					// 1. If a className is set as 'placeholder option, we don't force sizes - the class is responsible for that
					// 2. The option 'forcePlaceholderSize can be enabled to force it even if a class name is specified
					if(className && !o.forcePlaceholderSize) {
						return;
					}

					//If the element doesn't have a actual height by itself (without styles coming from a stylesheet), it receives the inline height from the dragged item
					if(!p.height()) { p.height(that.currentItem.innerHeight() - parseInt(that.currentItem.css("paddingTop")||0, 10) - parseInt(that.currentItem.css("paddingBottom")||0, 10)); }
					if(!p.width()) { p.width(that.currentItem.innerWidth() - parseInt(that.currentItem.css("paddingLeft")||0, 10) - parseInt(that.currentItem.css("paddingRight")||0, 10)); }
				}
			};
		}

		//Create the placeholder
		that.placeholder = $(o.placeholder.element.call(that.element, that.currentItem));

		//Append it after the actual current item
		that.currentItem.after(that.placeholder);

		//Update the size of the placeholder (TODO: Logic to fuzzy, see line 316/317)
		o.placeholder.update(that, that.placeholder);

	},

	_createTrPlaceholder: function( sourceTr, targetTr ) {
		var that = this;

		sourceTr.children().each(function() {
			$( "<td>&#160;</td>", that.document[ 0 ] )
				.attr( "colspan", $( this ).attr( "colspan" ) || 1 )
				.appendTo( targetTr );
		});
	},

	_contactContainers: function(event) {
		var i, j, dist, itemWithLeastDistance, posProperty, sizeProperty, cur, nearBottom, floating, axis,
			innermostContainer = null,
			innermostIndex = null;

		// get innermost container that intersects with item
		for (i = this.containers.length - 1; i >= 0; i--) {

			// never consider a container that's located within the item itself
			if($.contains(this.currentItem[0], this.containers[i].element[0])) {
				continue;
			}

			if(this._intersectsWith(this.containers[i].containerCache)) {

				// if we've already found a container and it's more "inner" than this, then continue
				if(innermostContainer && $.contains(this.containers[i].element[0], innermostContainer.element[0])) {
					continue;
				}

				innermostContainer = this.containers[i];
				innermostIndex = i;

			} else {
				// container doesn't intersect. trigger "out" event if necessary
				if(this.containers[i].containerCache.over) {
					this.containers[i]._trigger("out", event, this._uiHash(this));
					this.containers[i].containerCache.over = 0;
				}
			}

		}

		// if no intersecting containers found, return
		if(!innermostContainer) {
			return;
		}

		// move the item into the container if it's not there already
		if(this.containers.length === 1) {
			if (!this.containers[innermostIndex].containerCache.over) {
				this.containers[innermostIndex]._trigger("over", event, this._uiHash(this));
				this.containers[innermostIndex].containerCache.over = 1;
			}
		} else {

			//When entering a new container, we will find the item with the least distance and append our item near it
			dist = 10000;
			itemWithLeastDistance = null;
			floating = innermostContainer.floating || this._isFloating(this.currentItem);
			posProperty = floating ? "left" : "top";
			sizeProperty = floating ? "width" : "height";
			axis = floating ? "clientX" : "clientY";

			for (j = this.items.length - 1; j >= 0; j--) {
				if(!$.contains(this.containers[innermostIndex].element[0], this.items[j].item[0])) {
					continue;
				}
				if(this.items[j].item[0] === this.currentItem[0]) {
					continue;
				}

				cur = this.items[j].item.offset()[posProperty];
				nearBottom = false;
				if ( event[ axis ] - cur > this.items[ j ][ sizeProperty ] / 2 ) {
					nearBottom = true;
				}

				if ( Math.abs( event[ axis ] - cur ) < dist ) {
					dist = Math.abs( event[ axis ] - cur );
					itemWithLeastDistance = this.items[ j ];
					this.direction = nearBottom ? "up": "down";
				}
			}

			//Check if dropOnEmpty is enabled
			if(!itemWithLeastDistance && !this.options.dropOnEmpty) {
				return;
			}

			if(this.currentContainer === this.containers[innermostIndex]) {
				if ( !this.currentContainer.containerCache.over ) {
					this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash() );
					this.currentContainer.containerCache.over = 1;
				}
				return;
			}

			itemWithLeastDistance ? this._rearrange(event, itemWithLeastDistance, null, true) : this._rearrange(event, null, this.containers[innermostIndex].element, true);
			this._trigger("change", event, this._uiHash());
			this.containers[innermostIndex]._trigger("change", event, this._uiHash(this));
			this.currentContainer = this.containers[innermostIndex];

			//Update the placeholder
			this.options.placeholder.update(this.currentContainer, this.placeholder);

			this.containers[innermostIndex]._trigger("over", event, this._uiHash(this));
			this.containers[innermostIndex].containerCache.over = 1;
		}


	},

	_createHelper: function(event) {

		var o = this.options,
			helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [event, this.currentItem])) : (o.helper === "clone" ? this.currentItem.clone() : this.currentItem);

		//Add the helper to the DOM if that didn't happen already
		if(!helper.parents("body").length) {
			$(o.appendTo !== "parent" ? o.appendTo : this.currentItem[0].parentNode)[0].appendChild(helper[0]);
		}

		if(helper[0] === this.currentItem[0]) {
			this._storedCSS = { width: this.currentItem[0].style.width, height: this.currentItem[0].style.height, position: this.currentItem.css("position"), top: this.currentItem.css("top"), left: this.currentItem.css("left") };
		}

		if(!helper[0].style.width || o.forceHelperSize) {
			helper.width(this.currentItem.width());
		}
		if(!helper[0].style.height || o.forceHelperSize) {
			helper.height(this.currentItem.height());
		}

		return helper;

	},

	_adjustOffsetFromHelper: function(obj) {
		if (typeof obj === "string") {
			obj = obj.split(" ");
		}
		if ($.isArray(obj)) {
			obj = {left: +obj[0], top: +obj[1] || 0};
		}
		if ("left" in obj) {
			this.offset.click.left = obj.left + this.margins.left;
		}
		if ("right" in obj) {
			this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
		}
		if ("top" in obj) {
			this.offset.click.top = obj.top + this.margins.top;
		}
		if ("bottom" in obj) {
			this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
		}
	},

	_getParentOffset: function() {


		//Get the offsetParent and cache its position
		this.offsetParent = this.helper.offsetParent();
		var po = this.offsetParent.offset();

		// This is a special case where we need to modify a offset calculated on start, since the following happened:
		// 1. The position of the helper is absolute, so it's position is calculated based on the next positioned parent
		// 2. The actual offset parent is a child of the scroll parent, and the scroll parent isn't the document, which means that
		//    the scroll is included in the initial calculation of the offset of the parent, and never recalculated upon drag
		if(this.cssPosition === "absolute" && this.scrollParent[0] !== this.document[0] && $.contains(this.scrollParent[0], this.offsetParent[0])) {
			po.left += this.scrollParent.scrollLeft();
			po.top += this.scrollParent.scrollTop();
		}

		// This needs to be actually done for all browsers, since pageX/pageY includes this information
		// with an ugly IE fix
		if( this.offsetParent[0] === this.document[0].body || (this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() === "html" && $.ui.ie)) {
			po = { top: 0, left: 0 };
		}

		return {
			top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"),10) || 0),
			left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"),10) || 0)
		};

	},

	_getRelativeOffset: function() {

		if(this.cssPosition === "relative") {
			var p = this.currentItem.position();
			return {
				top: p.top - (parseInt(this.helper.css("top"),10) || 0) + this.scrollParent.scrollTop(),
				left: p.left - (parseInt(this.helper.css("left"),10) || 0) + this.scrollParent.scrollLeft()
			};
		} else {
			return { top: 0, left: 0 };
		}

	},

	_cacheMargins: function() {
		this.margins = {
			left: (parseInt(this.currentItem.css("marginLeft"),10) || 0),
			top: (parseInt(this.currentItem.css("marginTop"),10) || 0)
		};
	},

	_cacheHelperProportions: function() {
		this.helperProportions = {
			width: this.helper.outerWidth(),
			height: this.helper.outerHeight()
		};
	},

	_setContainment: function() {

		var ce, co, over,
			o = this.options;
		if(o.containment === "parent") {
			o.containment = this.helper[0].parentNode;
		}
		if(o.containment === "document" || o.containment === "window") {
			this.containment = [
				0 - this.offset.relative.left - this.offset.parent.left,
				0 - this.offset.relative.top - this.offset.parent.top,
				o.containment === "document" ? this.document.width() : this.window.width() - this.helperProportions.width - this.margins.left,
				(o.containment === "document" ? this.document.width() : this.window.height() || this.document[0].body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top
			];
		}

		if(!(/^(document|window|parent)$/).test(o.containment)) {
			ce = $(o.containment)[0];
			co = $(o.containment).offset();
			over = ($(ce).css("overflow") !== "hidden");

			this.containment = [
				co.left + (parseInt($(ce).css("borderLeftWidth"),10) || 0) + (parseInt($(ce).css("paddingLeft"),10) || 0) - this.margins.left,
				co.top + (parseInt($(ce).css("borderTopWidth"),10) || 0) + (parseInt($(ce).css("paddingTop"),10) || 0) - this.margins.top,
				co.left+(over ? Math.max(ce.scrollWidth,ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css("borderLeftWidth"),10) || 0) - (parseInt($(ce).css("paddingRight"),10) || 0) - this.helperProportions.width - this.margins.left,
				co.top+(over ? Math.max(ce.scrollHeight,ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css("borderTopWidth"),10) || 0) - (parseInt($(ce).css("paddingBottom"),10) || 0) - this.helperProportions.height - this.margins.top
			];
		}

	},

	_convertPositionTo: function(d, pos) {

		if(!pos) {
			pos = this.position;
		}
		var mod = d === "absolute" ? 1 : -1,
			scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== this.document[0] && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent,
			scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

		return {
			top: (
				pos.top	+																// The absolute mouse position
				this.offset.relative.top * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.top * mod -											// The offsetParent's offset without borders (offset + border)
				( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) * mod)
			),
			left: (
				pos.left +																// The absolute mouse position
				this.offset.relative.left * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.left * mod	-										// The offsetParent's offset without borders (offset + border)
				( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ) * mod)
			)
		};

	},

	_generatePosition: function(event) {

		var top, left,
			o = this.options,
			pageX = event.pageX,
			pageY = event.pageY,
			scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== this.document[0] && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

		// This is another very weird special case that only happens for relative elements:
		// 1. If the css position is relative
		// 2. and the scroll parent is the document or similar to the offset parent
		// we have to refresh the relative offset during the scroll so there are no jumps
		if(this.cssPosition === "relative" && !(this.scrollParent[0] !== this.document[0] && this.scrollParent[0] !== this.offsetParent[0])) {
			this.offset.relative = this._getRelativeOffset();
		}

		/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */

		if(this.originalPosition) { //If we are not dragging yet, we won't check for options

			if(this.containment) {
				if(event.pageX - this.offset.click.left < this.containment[0]) {
					pageX = this.containment[0] + this.offset.click.left;
				}
				if(event.pageY - this.offset.click.top < this.containment[1]) {
					pageY = this.containment[1] + this.offset.click.top;
				}
				if(event.pageX - this.offset.click.left > this.containment[2]) {
					pageX = this.containment[2] + this.offset.click.left;
				}
				if(event.pageY - this.offset.click.top > this.containment[3]) {
					pageY = this.containment[3] + this.offset.click.top;
				}
			}

			if(o.grid) {
				top = this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1];
				pageY = this.containment ? ( (top - this.offset.click.top >= this.containment[1] && top - this.offset.click.top <= this.containment[3]) ? top : ((top - this.offset.click.top >= this.containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;

				left = this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0];
				pageX = this.containment ? ( (left - this.offset.click.left >= this.containment[0] && left - this.offset.click.left <= this.containment[2]) ? left : ((left - this.offset.click.left >= this.containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
			}

		}

		return {
			top: (
				pageY -																// The absolute mouse position
				this.offset.click.top -													// Click offset (relative to the element)
				this.offset.relative.top	-											// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.top +												// The offsetParent's offset without borders (offset + border)
				( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ))
			),
			left: (
				pageX -																// The absolute mouse position
				this.offset.click.left -												// Click offset (relative to the element)
				this.offset.relative.left	-											// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.parent.left +												// The offsetParent's offset without borders (offset + border)
				( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ))
			)
		};

	},

	_rearrange: function(event, i, a, hardRefresh) {

		a ? a[0].appendChild(this.placeholder[0]) : i.item[0].parentNode.insertBefore(this.placeholder[0], (this.direction === "down" ? i.item[0] : i.item[0].nextSibling));

		//Various things done here to improve the performance:
		// 1. we create a setTimeout, that calls refreshPositions
		// 2. on the instance, we have a counter variable, that get's higher after every append
		// 3. on the local scope, we copy the counter variable, and check in the timeout, if it's still the same
		// 4. this lets only the last addition to the timeout stack through
		this.counter = this.counter ? ++this.counter : 1;
		var counter = this.counter;

		this._delay(function() {
			if(counter === this.counter) {
				this.refreshPositions(!hardRefresh); //Precompute after each DOM insertion, NOT on mousemove
			}
		});

	},

	_clear: function(event, noPropagation) {

		this.reverting = false;
		// We delay all events that have to be triggered to after the point where the placeholder has been removed and
		// everything else normalized again
		var i,
			delayedTriggers = [];

		// We first have to update the dom position of the actual currentItem
		// Note: don't do it if the current item is already removed (by a user), or it gets reappended (see #4088)
		if(!this._noFinalSort && this.currentItem.parent().length) {
			this.placeholder.before(this.currentItem);
		}
		this._noFinalSort = null;

		if(this.helper[0] === this.currentItem[0]) {
			for(i in this._storedCSS) {
				if(this._storedCSS[i] === "auto" || this._storedCSS[i] === "static") {
					this._storedCSS[i] = "";
				}
			}
			this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper");
		} else {
			this.currentItem.show();
		}

		if(this.fromOutside && !noPropagation) {
			delayedTriggers.push(function(event) { this._trigger("receive", event, this._uiHash(this.fromOutside)); });
		}
		if((this.fromOutside || this.domPosition.prev !== this.currentItem.prev().not(".ui-sortable-helper")[0] || this.domPosition.parent !== this.currentItem.parent()[0]) && !noPropagation) {
			delayedTriggers.push(function(event) { this._trigger("update", event, this._uiHash()); }); //Trigger update callback if the DOM position has changed
		}

		// Check if the items Container has Changed and trigger appropriate
		// events.
		if (this !== this.currentContainer) {
			if(!noPropagation) {
				delayedTriggers.push(function(event) { this._trigger("remove", event, this._uiHash()); });
				delayedTriggers.push((function(c) { return function(event) { c._trigger("receive", event, this._uiHash(this)); };  }).call(this, this.currentContainer));
				delayedTriggers.push((function(c) { return function(event) { c._trigger("update", event, this._uiHash(this));  }; }).call(this, this.currentContainer));
			}
		}


		//Post events to containers
		function delayEvent( type, instance, container ) {
			return function( event ) {
				container._trigger( type, event, instance._uiHash( instance ) );
			};
		}
		for (i = this.containers.length - 1; i >= 0; i--){
			if (!noPropagation) {
				delayedTriggers.push( delayEvent( "deactivate", this, this.containers[ i ] ) );
			}
			if(this.containers[i].containerCache.over) {
				delayedTriggers.push( delayEvent( "out", this, this.containers[ i ] ) );
				this.containers[i].containerCache.over = 0;
			}
		}

		//Do what was originally in plugins
		if ( this.storedCursor ) {
			this.document.find( "body" ).css( "cursor", this.storedCursor );
			this.storedStylesheet.remove();
		}
		if(this._storedOpacity) {
			this.helper.css("opacity", this._storedOpacity);
		}
		if(this._storedZIndex) {
			this.helper.css("zIndex", this._storedZIndex === "auto" ? "" : this._storedZIndex);
		}

		this.dragging = false;

		if(!noPropagation) {
			this._trigger("beforeStop", event, this._uiHash());
		}

		//$(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately, it unbinds ALL events from the original node!
		this.placeholder[0].parentNode.removeChild(this.placeholder[0]);

		if ( !this.cancelHelperRemoval ) {
			if ( this.helper[ 0 ] !== this.currentItem[ 0 ] ) {
				this.helper.remove();
			}
			this.helper = null;
		}

		if(!noPropagation) {
			for (i=0; i < delayedTriggers.length; i++) {
				delayedTriggers[i].call(this, event);
			} //Trigger all delayed events
			this._trigger("stop", event, this._uiHash());
		}

		this.fromOutside = false;
		return !this.cancelHelperRemoval;

	},

	_trigger: function() {
		if ($.Widget.prototype._trigger.apply(this, arguments) === false) {
			this.cancel();
		}
	},

	_uiHash: function(_inst) {
		var inst = _inst || this;
		return {
			helper: inst.helper,
			placeholder: inst.placeholder || $([]),
			position: inst.position,
			originalPosition: inst.originalPosition,
			offset: inst.positionAbs,
			item: inst.currentItem,
			sender: _inst ? _inst.element : null
		};
	}

});


/*!
 * jQuery UI Spinner 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/spinner/
 */


function spinner_modifier( fn ) {
	return function() {
		var previous = this.element.val();
		fn.apply( this, arguments );
		this._refresh();
		if ( previous !== this.element.val() ) {
			this._trigger( "change" );
		}
	};
}

var spinner = $.widget( "ui.spinner", {
	version: "1.11.4",
	defaultElement: "<input>",
	widgetEventPrefix: "spin",
	options: {
		culture: null,
		icons: {
			down: "ui-icon-triangle-1-s",
			up: "ui-icon-triangle-1-n"
		},
		incremental: true,
		max: null,
		min: null,
		numberFormat: null,
		page: 10,
		step: 1,

		change: null,
		spin: null,
		start: null,
		stop: null
	},

	_create: function() {
		// handle string values that need to be parsed
		this._setOption( "max", this.options.max );
		this._setOption( "min", this.options.min );
		this._setOption( "step", this.options.step );

		// Only format if there is a value, prevents the field from being marked
		// as invalid in Firefox, see #9573.
		if ( this.value() !== "" ) {
			// Format the value, but don't constrain.
			this._value( this.element.val(), true );
		}

		this._draw();
		this._on( this._events );
		this._refresh();

		// turning off autocomplete prevents the browser from remembering the
		// value when navigating through history, so we re-enable autocomplete
		// if the page is unloaded before the widget is destroyed. #7790
		this._on( this.window, {
			beforeunload: function() {
				this.element.removeAttr( "autocomplete" );
			}
		});
	},

	_getCreateOptions: function() {
		var options = {},
			element = this.element;

		$.each( [ "min", "max", "step" ], function( i, option ) {
			var value = element.attr( option );
			if ( value !== undefined && value.length ) {
				options[ option ] = value;
			}
		});

		return options;
	},

	_events: {
		keydown: function( event ) {
			if ( this._start( event ) && this._keydown( event ) ) {
				event.preventDefault();
			}
		},
		keyup: "_stop",
		focus: function() {
			this.previous = this.element.val();
		},
		blur: function( event ) {
			if ( this.cancelBlur ) {
				delete this.cancelBlur;
				return;
			}

			this._stop();
			this._refresh();
			if ( this.previous !== this.element.val() ) {
				this._trigger( "change", event );
			}
		},
		mousewheel: function( event, delta ) {
			if ( !delta ) {
				return;
			}
			if ( !this.spinning && !this._start( event ) ) {
				return false;
			}

			this._spin( (delta > 0 ? 1 : -1) * this.options.step, event );
			clearTimeout( this.mousewheelTimer );
			this.mousewheelTimer = this._delay(function() {
				if ( this.spinning ) {
					this._stop( event );
				}
			}, 100 );
			event.preventDefault();
		},
		"mousedown .ui-spinner-button": function( event ) {
			var previous;

			// We never want the buttons to have focus; whenever the user is
			// interacting with the spinner, the focus should be on the input.
			// If the input is focused then this.previous is properly set from
			// when the input first received focus. If the input is not focused
			// then we need to set this.previous based on the value before spinning.
			previous = this.element[0] === this.document[0].activeElement ?
				this.previous : this.element.val();
			function checkFocus() {
				var isActive = this.element[0] === this.document[0].activeElement;
				if ( !isActive ) {
					this.element.focus();
					this.previous = previous;
					// support: IE
					// IE sets focus asynchronously, so we need to check if focus
					// moved off of the input because the user clicked on the button.
					this._delay(function() {
						this.previous = previous;
					});
				}
			}

			// ensure focus is on (or stays on) the text field
			event.preventDefault();
			checkFocus.call( this );

			// support: IE
			// IE doesn't prevent moving focus even with event.preventDefault()
			// so we set a flag to know when we should ignore the blur event
			// and check (again) if focus moved off of the input.
			this.cancelBlur = true;
			this._delay(function() {
				delete this.cancelBlur;
				checkFocus.call( this );
			});

			if ( this._start( event ) === false ) {
				return;
			}

			this._repeat( null, $( event.currentTarget ).hasClass( "ui-spinner-up" ) ? 1 : -1, event );
		},
		"mouseup .ui-spinner-button": "_stop",
		"mouseenter .ui-spinner-button": function( event ) {
			// button will add ui-state-active if mouse was down while mouseleave and kept down
			if ( !$( event.currentTarget ).hasClass( "ui-state-active" ) ) {
				return;
			}

			if ( this._start( event ) === false ) {
				return false;
			}
			this._repeat( null, $( event.currentTarget ).hasClass( "ui-spinner-up" ) ? 1 : -1, event );
		},
		// TODO: do we really want to consider this a stop?
		// shouldn't we just stop the repeater and wait until mouseup before
		// we trigger the stop event?
		"mouseleave .ui-spinner-button": "_stop"
	},

	_draw: function() {
		var uiSpinner = this.uiSpinner = this.element
			.addClass( "ui-spinner-input" )
			.attr( "autocomplete", "off" )
			.wrap( this._uiSpinnerHtml() )
			.parent()
				// add buttons
				.append( this._buttonHtml() );

		this.element.attr( "role", "spinbutton" );

		// button bindings
		this.buttons = uiSpinner.find( ".ui-spinner-button" )
			.attr( "tabIndex", -1 )
			.button()
			.removeClass( "ui-corner-all" );

		// IE 6 doesn't understand height: 50% for the buttons
		// unless the wrapper has an explicit height
		if ( this.buttons.height() > Math.ceil( uiSpinner.height() * 0.5 ) &&
				uiSpinner.height() > 0 ) {
			uiSpinner.height( uiSpinner.height() );
		}

		// disable spinner if element was already disabled
		if ( this.options.disabled ) {
			this.disable();
		}
	},

	_keydown: function( event ) {
		var options = this.options,
			keyCode = $.ui.keyCode;

		switch ( event.keyCode ) {
		case keyCode.UP:
			this._repeat( null, 1, event );
			return true;
		case keyCode.DOWN:
			this._repeat( null, -1, event );
			return true;
		case keyCode.PAGE_UP:
			this._repeat( null, options.page, event );
			return true;
		case keyCode.PAGE_DOWN:
			this._repeat( null, -options.page, event );
			return true;
		}

		return false;
	},

	_uiSpinnerHtml: function() {
		return "<span class='ui-spinner ui-widget ui-widget-content ui-corner-all'></span>";
	},

	_buttonHtml: function() {
		return "" +
			"<a class='ui-spinner-button ui-spinner-up ui-corner-tr'>" +
				"<span class='ui-icon " + this.options.icons.up + "'>&#9650;</span>" +
			"</a>" +
			"<a class='ui-spinner-button ui-spinner-down ui-corner-br'>" +
				"<span class='ui-icon " + this.options.icons.down + "'>&#9660;</span>" +
			"</a>";
	},

	_start: function( event ) {
		if ( !this.spinning && this._trigger( "start", event ) === false ) {
			return false;
		}

		if ( !this.counter ) {
			this.counter = 1;
		}
		this.spinning = true;
		return true;
	},

	_repeat: function( i, steps, event ) {
		i = i || 500;

		clearTimeout( this.timer );
		this.timer = this._delay(function() {
			this._repeat( 40, steps, event );
		}, i );

		this._spin( steps * this.options.step, event );
	},

	_spin: function( step, event ) {
		var value = this.value() || 0;

		if ( !this.counter ) {
			this.counter = 1;
		}

		value = this._adjustValue( value + step * this._increment( this.counter ) );

		if ( !this.spinning || this._trigger( "spin", event, { value: value } ) !== false) {
			this._value( value );
			this.counter++;
		}
	},

	_increment: function( i ) {
		var incremental = this.options.incremental;

		if ( incremental ) {
			return $.isFunction( incremental ) ?
				incremental( i ) :
				Math.floor( i * i * i / 50000 - i * i / 500 + 17 * i / 200 + 1 );
		}

		return 1;
	},

	_precision: function() {
		var precision = this._precisionOf( this.options.step );
		if ( this.options.min !== null ) {
			precision = Math.max( precision, this._precisionOf( this.options.min ) );
		}
		return precision;
	},

	_precisionOf: function( num ) {
		var str = num.toString(),
			decimal = str.indexOf( "." );
		return decimal === -1 ? 0 : str.length - decimal - 1;
	},

	_adjustValue: function( value ) {
		var base, aboveMin,
			options = this.options;

		// make sure we're at a valid step
		// - find out where we are relative to the base (min or 0)
		base = options.min !== null ? options.min : 0;
		aboveMin = value - base;
		// - round to the nearest step
		aboveMin = Math.round(aboveMin / options.step) * options.step;
		// - rounding is based on 0, so adjust back to our base
		value = base + aboveMin;

		// fix precision from bad JS floating point math
		value = parseFloat( value.toFixed( this._precision() ) );

		// clamp the value
		if ( options.max !== null && value > options.max) {
			return options.max;
		}
		if ( options.min !== null && value < options.min ) {
			return options.min;
		}

		return value;
	},

	_stop: function( event ) {
		if ( !this.spinning ) {
			return;
		}

		clearTimeout( this.timer );
		clearTimeout( this.mousewheelTimer );
		this.counter = 0;
		this.spinning = false;
		this._trigger( "stop", event );
	},

	_setOption: function( key, value ) {
		if ( key === "culture" || key === "numberFormat" ) {
			var prevValue = this._parse( this.element.val() );
			this.options[ key ] = value;
			this.element.val( this._format( prevValue ) );
			return;
		}

		if ( key === "max" || key === "min" || key === "step" ) {
			if ( typeof value === "string" ) {
				value = this._parse( value );
			}
		}
		if ( key === "icons" ) {
			this.buttons.first().find( ".ui-icon" )
				.removeClass( this.options.icons.up )
				.addClass( value.up );
			this.buttons.last().find( ".ui-icon" )
				.removeClass( this.options.icons.down )
				.addClass( value.down );
		}

		this._super( key, value );

		if ( key === "disabled" ) {
			this.widget().toggleClass( "ui-state-disabled", !!value );
			this.element.prop( "disabled", !!value );
			this.buttons.button( value ? "disable" : "enable" );
		}
	},

	_setOptions: spinner_modifier(function( options ) {
		this._super( options );
	}),

	_parse: function( val ) {
		if ( typeof val === "string" && val !== "" ) {
			val = window.Globalize && this.options.numberFormat ?
				Globalize.parseFloat( val, 10, this.options.culture ) : +val;
		}
		return val === "" || isNaN( val ) ? null : val;
	},

	_format: function( value ) {
		if ( value === "" ) {
			return "";
		}
		return window.Globalize && this.options.numberFormat ?
			Globalize.format( value, this.options.numberFormat, this.options.culture ) :
			value;
	},

	_refresh: function() {
		this.element.attr({
			"aria-valuemin": this.options.min,
			"aria-valuemax": this.options.max,
			// TODO: what should we do with values that can't be parsed?
			"aria-valuenow": this._parse( this.element.val() )
		});
	},

	isValid: function() {
		var value = this.value();

		// null is invalid
		if ( value === null ) {
			return false;
		}

		// if value gets adjusted, it's invalid
		return value === this._adjustValue( value );
	},

	// update the value without triggering change
	_value: function( value, allowAny ) {
		var parsed;
		if ( value !== "" ) {
			parsed = this._parse( value );
			if ( parsed !== null ) {
				if ( !allowAny ) {
					parsed = this._adjustValue( parsed );
				}
				value = this._format( parsed );
			}
		}
		this.element.val( value );
		this._refresh();
	},

	_destroy: function() {
		this.element
			.removeClass( "ui-spinner-input" )
			.prop( "disabled", false )
			.removeAttr( "autocomplete" )
			.removeAttr( "role" )
			.removeAttr( "aria-valuemin" )
			.removeAttr( "aria-valuemax" )
			.removeAttr( "aria-valuenow" );
		this.uiSpinner.replaceWith( this.element );
	},

	stepUp: spinner_modifier(function( steps ) {
		this._stepUp( steps );
	}),
	_stepUp: function( steps ) {
		if ( this._start() ) {
			this._spin( (steps || 1) * this.options.step );
			this._stop();
		}
	},

	stepDown: spinner_modifier(function( steps ) {
		this._stepDown( steps );
	}),
	_stepDown: function( steps ) {
		if ( this._start() ) {
			this._spin( (steps || 1) * -this.options.step );
			this._stop();
		}
	},

	pageUp: spinner_modifier(function( pages ) {
		this._stepUp( (pages || 1) * this.options.page );
	}),

	pageDown: spinner_modifier(function( pages ) {
		this._stepDown( (pages || 1) * this.options.page );
	}),

	value: function( newVal ) {
		if ( !arguments.length ) {
			return this._parse( this.element.val() );
		}
		spinner_modifier( this._value ).call( this, newVal );
	},

	widget: function() {
		return this.uiSpinner;
	}
});


/*!
 * jQuery UI Tabs 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/tabs/
 */


var tabs = $.widget( "ui.tabs", {
	version: "1.11.4",
	delay: 300,
	options: {
		active: null,
		collapsible: false,
		event: "click",
		heightStyle: "content",
		hide: null,
		show: null,

		// callbacks
		activate: null,
		beforeActivate: null,
		beforeLoad: null,
		load: null
	},

	_isLocal: (function() {
		var rhash = /#.*$/;

		return function( anchor ) {
			var anchorUrl, locationUrl;

			// support: IE7
			// IE7 doesn't normalize the href property when set via script (#9317)
			anchor = anchor.cloneNode( false );

			anchorUrl = anchor.href.replace( rhash, "" );
			locationUrl = location.href.replace( rhash, "" );

			// decoding may throw an error if the URL isn't UTF-8 (#9518)
			try {
				anchorUrl = decodeURIComponent( anchorUrl );
			} catch ( error ) {}
			try {
				locationUrl = decodeURIComponent( locationUrl );
			} catch ( error ) {}

			return anchor.hash.length > 1 && anchorUrl === locationUrl;
		};
	})(),

	_create: function() {
		var that = this,
			options = this.options;

		this.running = false;

		this.element
			.addClass( "ui-tabs ui-widget ui-widget-content ui-corner-all" )
			.toggleClass( "ui-tabs-collapsible", options.collapsible );

		this._processTabs();
		options.active = this._initialActive();

		// Take disabling tabs via class attribute from HTML
		// into account and update option properly.
		if ( $.isArray( options.disabled ) ) {
			options.disabled = $.unique( options.disabled.concat(
				$.map( this.tabs.filter( ".ui-state-disabled" ), function( li ) {
					return that.tabs.index( li );
				})
			) ).sort();
		}

		// check for length avoids error when initializing empty list
		if ( this.options.active !== false && this.anchors.length ) {
			this.active = this._findActive( options.active );
		} else {
			this.active = $();
		}

		this._refresh();

		if ( this.active.length ) {
			this.load( options.active );
		}
	},

	_initialActive: function() {
		var active = this.options.active,
			collapsible = this.options.collapsible,
			locationHash = location.hash.substring( 1 );

		if ( active === null ) {
			// check the fragment identifier in the URL
			if ( locationHash ) {
				this.tabs.each(function( i, tab ) {
					if ( $( tab ).attr( "aria-controls" ) === locationHash ) {
						active = i;
						return false;
					}
				});
			}

			// check for a tab marked active via a class
			if ( active === null ) {
				active = this.tabs.index( this.tabs.filter( ".ui-tabs-active" ) );
			}

			// no active tab, set to false
			if ( active === null || active === -1 ) {
				active = this.tabs.length ? 0 : false;
			}
		}

		// handle numbers: negative, out of range
		if ( active !== false ) {
			active = this.tabs.index( this.tabs.eq( active ) );
			if ( active === -1 ) {
				active = collapsible ? false : 0;
			}
		}

		// don't allow collapsible: false and active: false
		if ( !collapsible && active === false && this.anchors.length ) {
			active = 0;
		}

		return active;
	},

	_getCreateEventData: function() {
		return {
			tab: this.active,
			panel: !this.active.length ? $() : this._getPanelForTab( this.active )
		};
	},

	_tabKeydown: function( event ) {
		var focusedTab = $( this.document[0].activeElement ).closest( "li" ),
			selectedIndex = this.tabs.index( focusedTab ),
			goingForward = true;

		if ( this._handlePageNav( event ) ) {
			return;
		}

		switch ( event.keyCode ) {
			case $.ui.keyCode.RIGHT:
			case $.ui.keyCode.DOWN:
				selectedIndex++;
				break;
			case $.ui.keyCode.UP:
			case $.ui.keyCode.LEFT:
				goingForward = false;
				selectedIndex--;
				break;
			case $.ui.keyCode.END:
				selectedIndex = this.anchors.length - 1;
				break;
			case $.ui.keyCode.HOME:
				selectedIndex = 0;
				break;
			case $.ui.keyCode.SPACE:
				// Activate only, no collapsing
				event.preventDefault();
				clearTimeout( this.activating );
				this._activate( selectedIndex );
				return;
			case $.ui.keyCode.ENTER:
				// Toggle (cancel delayed activation, allow collapsing)
				event.preventDefault();
				clearTimeout( this.activating );
				// Determine if we should collapse or activate
				this._activate( selectedIndex === this.options.active ? false : selectedIndex );
				return;
			default:
				return;
		}

		// Focus the appropriate tab, based on which key was pressed
		event.preventDefault();
		clearTimeout( this.activating );
		selectedIndex = this._focusNextTab( selectedIndex, goingForward );

		// Navigating with control/command key will prevent automatic activation
		if ( !event.ctrlKey && !event.metaKey ) {

			// Update aria-selected immediately so that AT think the tab is already selected.
			// Otherwise AT may confuse the user by stating that they need to activate the tab,
			// but the tab will already be activated by the time the announcement finishes.
			focusedTab.attr( "aria-selected", "false" );
			this.tabs.eq( selectedIndex ).attr( "aria-selected", "true" );

			this.activating = this._delay(function() {
				this.option( "active", selectedIndex );
			}, this.delay );
		}
	},

	_panelKeydown: function( event ) {
		if ( this._handlePageNav( event ) ) {
			return;
		}

		// Ctrl+up moves focus to the current tab
		if ( event.ctrlKey && event.keyCode === $.ui.keyCode.UP ) {
			event.preventDefault();
			this.active.focus();
		}
	},

	// Alt+page up/down moves focus to the previous/next tab (and activates)
	_handlePageNav: function( event ) {
		if ( event.altKey && event.keyCode === $.ui.keyCode.PAGE_UP ) {
			this._activate( this._focusNextTab( this.options.active - 1, false ) );
			return true;
		}
		if ( event.altKey && event.keyCode === $.ui.keyCode.PAGE_DOWN ) {
			this._activate( this._focusNextTab( this.options.active + 1, true ) );
			return true;
		}
	},

	_findNextTab: function( index, goingForward ) {
		var lastTabIndex = this.tabs.length - 1;

		function constrain() {
			if ( index > lastTabIndex ) {
				index = 0;
			}
			if ( index < 0 ) {
				index = lastTabIndex;
			}
			return index;
		}

		while ( $.inArray( constrain(), this.options.disabled ) !== -1 ) {
			index = goingForward ? index + 1 : index - 1;
		}

		return index;
	},

	_focusNextTab: function( index, goingForward ) {
		index = this._findNextTab( index, goingForward );
		this.tabs.eq( index ).focus();
		return index;
	},

	_setOption: function( key, value ) {
		if ( key === "active" ) {
			// _activate() will handle invalid values and update this.options
			this._activate( value );
			return;
		}

		if ( key === "disabled" ) {
			// don't use the widget factory's disabled handling
			this._setupDisabled( value );
			return;
		}

		this._super( key, value);

		if ( key === "collapsible" ) {
			this.element.toggleClass( "ui-tabs-collapsible", value );
			// Setting collapsible: false while collapsed; open first panel
			if ( !value && this.options.active === false ) {
				this._activate( 0 );
			}
		}

		if ( key === "event" ) {
			this._setupEvents( value );
		}

		if ( key === "heightStyle" ) {
			this._setupHeightStyle( value );
		}
	},

	_sanitizeSelector: function( hash ) {
		return hash ? hash.replace( /[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g, "\\$&" ) : "";
	},

	refresh: function() {
		var options = this.options,
			lis = this.tablist.children( ":has(a[href])" );

		// get disabled tabs from class attribute from HTML
		// this will get converted to a boolean if needed in _refresh()
		options.disabled = $.map( lis.filter( ".ui-state-disabled" ), function( tab ) {
			return lis.index( tab );
		});

		this._processTabs();

		// was collapsed or no tabs
		if ( options.active === false || !this.anchors.length ) {
			options.active = false;
			this.active = $();
		// was active, but active tab is gone
		} else if ( this.active.length && !$.contains( this.tablist[ 0 ], this.active[ 0 ] ) ) {
			// all remaining tabs are disabled
			if ( this.tabs.length === options.disabled.length ) {
				options.active = false;
				this.active = $();
			// activate previous tab
			} else {
				this._activate( this._findNextTab( Math.max( 0, options.active - 1 ), false ) );
			}
		// was active, active tab still exists
		} else {
			// make sure active index is correct
			options.active = this.tabs.index( this.active );
		}

		this._refresh();
	},

	_refresh: function() {
		this._setupDisabled( this.options.disabled );
		this._setupEvents( this.options.event );
		this._setupHeightStyle( this.options.heightStyle );

		this.tabs.not( this.active ).attr({
			"aria-selected": "false",
			"aria-expanded": "false",
			tabIndex: -1
		});
		this.panels.not( this._getPanelForTab( this.active ) )
			.hide()
			.attr({
				"aria-hidden": "true"
			});

		// Make sure one tab is in the tab order
		if ( !this.active.length ) {
			this.tabs.eq( 0 ).attr( "tabIndex", 0 );
		} else {
			this.active
				.addClass( "ui-tabs-active ui-state-active" )
				.attr({
					"aria-selected": "true",
					"aria-expanded": "true",
					tabIndex: 0
				});
			this._getPanelForTab( this.active )
				.show()
				.attr({
					"aria-hidden": "false"
				});
		}
	},

	_processTabs: function() {
		var that = this,
			prevTabs = this.tabs,
			prevAnchors = this.anchors,
			prevPanels = this.panels;

		this.tablist = this._getList()
			.addClass( "ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" )
			.attr( "role", "tablist" )

			// Prevent users from focusing disabled tabs via click
			.delegate( "> li", "mousedown" + this.eventNamespace, function( event ) {
				if ( $( this ).is( ".ui-state-disabled" ) ) {
					event.preventDefault();
				}
			})

			// support: IE <9
			// Preventing the default action in mousedown doesn't prevent IE
			// from focusing the element, so if the anchor gets focused, blur.
			// We don't have to worry about focusing the previously focused
			// element since clicking on a non-focusable element should focus
			// the body anyway.
			.delegate( ".ui-tabs-anchor", "focus" + this.eventNamespace, function() {
				if ( $( this ).closest( "li" ).is( ".ui-state-disabled" ) ) {
					this.blur();
				}
			});

		this.tabs = this.tablist.find( "> li:has(a[href])" )
			.addClass( "ui-state-default ui-corner-top" )
			.attr({
				role: "tab",
				tabIndex: -1
			});

		this.anchors = this.tabs.map(function() {
				return $( "a", this )[ 0 ];
			})
			.addClass( "ui-tabs-anchor" )
			.attr({
				role: "presentation",
				tabIndex: -1
			});

		this.panels = $();

		this.anchors.each(function( i, anchor ) {
			var selector, panel, panelId,
				anchorId = $( anchor ).uniqueId().attr( "id" ),
				tab = $( anchor ).closest( "li" ),
				originalAriaControls = tab.attr( "aria-controls" );

			// inline tab
			if ( that._isLocal( anchor ) ) {
				selector = anchor.hash;
				panelId = selector.substring( 1 );
				panel = that.element.find( that._sanitizeSelector( selector ) );
			// remote tab
			} else {
				// If the tab doesn't already have aria-controls,
				// generate an id by using a throw-away element
				panelId = tab.attr( "aria-controls" ) || $( {} ).uniqueId()[ 0 ].id;
				selector = "#" + panelId;
				panel = that.element.find( selector );
				if ( !panel.length ) {
					panel = that._createPanel( panelId );
					panel.insertAfter( that.panels[ i - 1 ] || that.tablist );
				}
				panel.attr( "aria-live", "polite" );
			}

			if ( panel.length) {
				that.panels = that.panels.add( panel );
			}
			if ( originalAriaControls ) {
				tab.data( "ui-tabs-aria-controls", originalAriaControls );
			}
			tab.attr({
				"aria-controls": panelId,
				"aria-labelledby": anchorId
			});
			panel.attr( "aria-labelledby", anchorId );
		});

		this.panels
			.addClass( "ui-tabs-panel ui-widget-content ui-corner-bottom" )
			.attr( "role", "tabpanel" );

		// Avoid memory leaks (#10056)
		if ( prevTabs ) {
			this._off( prevTabs.not( this.tabs ) );
			this._off( prevAnchors.not( this.anchors ) );
			this._off( prevPanels.not( this.panels ) );
		}
	},

	// allow overriding how to find the list for rare usage scenarios (#7715)
	_getList: function() {
		return this.tablist || this.element.find( "ol,ul" ).eq( 0 );
	},

	_createPanel: function( id ) {
		return $( "<div>" )
			.attr( "id", id )
			.addClass( "ui-tabs-panel ui-widget-content ui-corner-bottom" )
			.data( "ui-tabs-destroy", true );
	},

	_setupDisabled: function( disabled ) {
		if ( $.isArray( disabled ) ) {
			if ( !disabled.length ) {
				disabled = false;
			} else if ( disabled.length === this.anchors.length ) {
				disabled = true;
			}
		}

		// disable tabs
		for ( var i = 0, li; ( li = this.tabs[ i ] ); i++ ) {
			if ( disabled === true || $.inArray( i, disabled ) !== -1 ) {
				$( li )
					.addClass( "ui-state-disabled" )
					.attr( "aria-disabled", "true" );
			} else {
				$( li )
					.removeClass( "ui-state-disabled" )
					.removeAttr( "aria-disabled" );
			}
		}

		this.options.disabled = disabled;
	},

	_setupEvents: function( event ) {
		var events = {};
		if ( event ) {
			$.each( event.split(" "), function( index, eventName ) {
				events[ eventName ] = "_eventHandler";
			});
		}

		this._off( this.anchors.add( this.tabs ).add( this.panels ) );
		// Always prevent the default action, even when disabled
		this._on( true, this.anchors, {
			click: function( event ) {
				event.preventDefault();
			}
		});
		this._on( this.anchors, events );
		this._on( this.tabs, { keydown: "_tabKeydown" } );
		this._on( this.panels, { keydown: "_panelKeydown" } );

		this._focusable( this.tabs );
		this._hoverable( this.tabs );
	},

	_setupHeightStyle: function( heightStyle ) {
		var maxHeight,
			parent = this.element.parent();

		if ( heightStyle === "fill" ) {
			maxHeight = parent.height();
			maxHeight -= this.element.outerHeight() - this.element.height();

			this.element.siblings( ":visible" ).each(function() {
				var elem = $( this ),
					position = elem.css( "position" );

				if ( position === "absolute" || position === "fixed" ) {
					return;
				}
				maxHeight -= elem.outerHeight( true );
			});

			this.element.children().not( this.panels ).each(function() {
				maxHeight -= $( this ).outerHeight( true );
			});

			this.panels.each(function() {
				$( this ).height( Math.max( 0, maxHeight -
					$( this ).innerHeight() + $( this ).height() ) );
			})
			.css( "overflow", "auto" );
		} else if ( heightStyle === "auto" ) {
			maxHeight = 0;
			this.panels.each(function() {
				maxHeight = Math.max( maxHeight, $( this ).height( "" ).height() );
			}).height( maxHeight );
		}
	},

	_eventHandler: function( event ) {
		var options = this.options,
			active = this.active,
			anchor = $( event.currentTarget ),
			tab = anchor.closest( "li" ),
			clickedIsActive = tab[ 0 ] === active[ 0 ],
			collapsing = clickedIsActive && options.collapsible,
			toShow = collapsing ? $() : this._getPanelForTab( tab ),
			toHide = !active.length ? $() : this._getPanelForTab( active ),
			eventData = {
				oldTab: active,
				oldPanel: toHide,
				newTab: collapsing ? $() : tab,
				newPanel: toShow
			};

		event.preventDefault();

		if ( tab.hasClass( "ui-state-disabled" ) ||
				// tab is already loading
				tab.hasClass( "ui-tabs-loading" ) ||
				// can't switch durning an animation
				this.running ||
				// click on active header, but not collapsible
				( clickedIsActive && !options.collapsible ) ||
				// allow canceling activation
				( this._trigger( "beforeActivate", event, eventData ) === false ) ) {
			return;
		}

		options.active = collapsing ? false : this.tabs.index( tab );

		this.active = clickedIsActive ? $() : tab;
		if ( this.xhr ) {
			this.xhr.abort();
		}

		if ( !toHide.length && !toShow.length ) {
			$.error( "jQuery UI Tabs: Mismatching fragment identifier." );
		}

		if ( toShow.length ) {
			this.load( this.tabs.index( tab ), event );
		}
		this._toggle( event, eventData );
	},

	// handles show/hide for selecting tabs
	_toggle: function( event, eventData ) {
		var that = this,
			toShow = eventData.newPanel,
			toHide = eventData.oldPanel;

		this.running = true;

		function complete() {
			that.running = false;
			that._trigger( "activate", event, eventData );
		}

		function show() {
			eventData.newTab.closest( "li" ).addClass( "ui-tabs-active ui-state-active" );

			if ( toShow.length && that.options.show ) {
				that._show( toShow, that.options.show, complete );
			} else {
				toShow.show();
				complete();
			}
		}

		// start out by hiding, then showing, then completing
		if ( toHide.length && this.options.hide ) {
			this._hide( toHide, this.options.hide, function() {
				eventData.oldTab.closest( "li" ).removeClass( "ui-tabs-active ui-state-active" );
				show();
			});
		} else {
			eventData.oldTab.closest( "li" ).removeClass( "ui-tabs-active ui-state-active" );
			toHide.hide();
			show();
		}

		toHide.attr( "aria-hidden", "true" );
		eventData.oldTab.attr({
			"aria-selected": "false",
			"aria-expanded": "false"
		});
		// If we're switching tabs, remove the old tab from the tab order.
		// If we're opening from collapsed state, remove the previous tab from the tab order.
		// If we're collapsing, then keep the collapsing tab in the tab order.
		if ( toShow.length && toHide.length ) {
			eventData.oldTab.attr( "tabIndex", -1 );
		} else if ( toShow.length ) {
			this.tabs.filter(function() {
				return $( this ).attr( "tabIndex" ) === 0;
			})
			.attr( "tabIndex", -1 );
		}

		toShow.attr( "aria-hidden", "false" );
		eventData.newTab.attr({
			"aria-selected": "true",
			"aria-expanded": "true",
			tabIndex: 0
		});
	},

	_activate: function( index ) {
		var anchor,
			active = this._findActive( index );

		// trying to activate the already active panel
		if ( active[ 0 ] === this.active[ 0 ] ) {
			return;
		}

		// trying to collapse, simulate a click on the current active header
		if ( !active.length ) {
			active = this.active;
		}

		anchor = active.find( ".ui-tabs-anchor" )[ 0 ];
		this._eventHandler({
			target: anchor,
			currentTarget: anchor,
			preventDefault: $.noop
		});
	},

	_findActive: function( index ) {
		return index === false ? $() : this.tabs.eq( index );
	},

	_getIndex: function( index ) {
		// meta-function to give users option to provide a href string instead of a numerical index.
		if ( typeof index === "string" ) {
			index = this.anchors.index( this.anchors.filter( "[href$='" + index + "']" ) );
		}

		return index;
	},

	_destroy: function() {
		if ( this.xhr ) {
			this.xhr.abort();
		}

		this.element.removeClass( "ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-collapsible" );

		this.tablist
			.removeClass( "ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" )
			.removeAttr( "role" );

		this.anchors
			.removeClass( "ui-tabs-anchor" )
			.removeAttr( "role" )
			.removeAttr( "tabIndex" )
			.removeUniqueId();

		this.tablist.unbind( this.eventNamespace );

		this.tabs.add( this.panels ).each(function() {
			if ( $.data( this, "ui-tabs-destroy" ) ) {
				$( this ).remove();
			} else {
				$( this )
					.removeClass( "ui-state-default ui-state-active ui-state-disabled " +
						"ui-corner-top ui-corner-bottom ui-widget-content ui-tabs-active ui-tabs-panel" )
					.removeAttr( "tabIndex" )
					.removeAttr( "aria-live" )
					.removeAttr( "aria-busy" )
					.removeAttr( "aria-selected" )
					.removeAttr( "aria-labelledby" )
					.removeAttr( "aria-hidden" )
					.removeAttr( "aria-expanded" )
					.removeAttr( "role" );
			}
		});

		this.tabs.each(function() {
			var li = $( this ),
				prev = li.data( "ui-tabs-aria-controls" );
			if ( prev ) {
				li
					.attr( "aria-controls", prev )
					.removeData( "ui-tabs-aria-controls" );
			} else {
				li.removeAttr( "aria-controls" );
			}
		});

		this.panels.show();

		if ( this.options.heightStyle !== "content" ) {
			this.panels.css( "height", "" );
		}
	},

	enable: function( index ) {
		var disabled = this.options.disabled;
		if ( disabled === false ) {
			return;
		}

		if ( index === undefined ) {
			disabled = false;
		} else {
			index = this._getIndex( index );
			if ( $.isArray( disabled ) ) {
				disabled = $.map( disabled, function( num ) {
					return num !== index ? num : null;
				});
			} else {
				disabled = $.map( this.tabs, function( li, num ) {
					return num !== index ? num : null;
				});
			}
		}
		this._setupDisabled( disabled );
	},

	disable: function( index ) {
		var disabled = this.options.disabled;
		if ( disabled === true ) {
			return;
		}

		if ( index === undefined ) {
			disabled = true;
		} else {
			index = this._getIndex( index );
			if ( $.inArray( index, disabled ) !== -1 ) {
				return;
			}
			if ( $.isArray( disabled ) ) {
				disabled = $.merge( [ index ], disabled ).sort();
			} else {
				disabled = [ index ];
			}
		}
		this._setupDisabled( disabled );
	},

	load: function( index, event ) {
		index = this._getIndex( index );
		var that = this,
			tab = this.tabs.eq( index ),
			anchor = tab.find( ".ui-tabs-anchor" ),
			panel = this._getPanelForTab( tab ),
			eventData = {
				tab: tab,
				panel: panel
			},
			complete = function( jqXHR, status ) {
				if ( status === "abort" ) {
					that.panels.stop( false, true );
				}

				tab.removeClass( "ui-tabs-loading" );
				panel.removeAttr( "aria-busy" );

				if ( jqXHR === that.xhr ) {
					delete that.xhr;
				}
			};

		// not remote
		if ( this._isLocal( anchor[ 0 ] ) ) {
			return;
		}

		this.xhr = $.ajax( this._ajaxSettings( anchor, event, eventData ) );

		// support: jQuery <1.8
		// jQuery <1.8 returns false if the request is canceled in beforeSend,
		// but as of 1.8, $.ajax() always returns a jqXHR object.
		if ( this.xhr && this.xhr.statusText !== "canceled" ) {
			tab.addClass( "ui-tabs-loading" );
			panel.attr( "aria-busy", "true" );

			this.xhr
				.done(function( response, status, jqXHR ) {
					// support: jQuery <1.8
					// http://bugs.jquery.com/ticket/11778
					setTimeout(function() {
						panel.html( response );
						that._trigger( "load", event, eventData );

						complete( jqXHR, status );
					}, 1 );
				})
				.fail(function( jqXHR, status ) {
					// support: jQuery <1.8
					// http://bugs.jquery.com/ticket/11778
					setTimeout(function() {
						complete( jqXHR, status );
					}, 1 );
				});
		}
	},

	_ajaxSettings: function( anchor, event, eventData ) {
		var that = this;
		return {
			url: anchor.attr( "href" ),
			beforeSend: function( jqXHR, settings ) {
				return that._trigger( "beforeLoad", event,
					$.extend( { jqXHR: jqXHR, ajaxSettings: settings }, eventData ) );
			}
		};
	},

	_getPanelForTab: function( tab ) {
		var id = $( tab ).attr( "aria-controls" );
		return this.element.find( this._sanitizeSelector( "#" + id ) );
	}
});


/*!
 * jQuery UI Tooltip 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/tooltip/
 */


var tooltip = $.widget( "ui.tooltip", {
	version: "1.11.4",
	options: {
		content: function() {
			// support: IE<9, Opera in jQuery <1.7
			// .text() can't accept undefined, so coerce to a string
			var title = $( this ).attr( "title" ) || "";
			// Escape title, since we're going from an attribute to raw HTML
			return $( "<a>" ).text( title ).html();
		},
		hide: true,
		// Disabled elements have inconsistent behavior across browsers (#8661)
		items: "[title]:not([disabled])",
		position: {
			my: "left top+15",
			at: "left bottom",
			collision: "flipfit flip"
		},
		show: true,
		tooltipClass: null,
		track: false,

		// callbacks
		close: null,
		open: null
	},

	_addDescribedBy: function( elem, id ) {
		var describedby = (elem.attr( "aria-describedby" ) || "").split( /\s+/ );
		describedby.push( id );
		elem
			.data( "ui-tooltip-id", id )
			.attr( "aria-describedby", $.trim( describedby.join( " " ) ) );
	},

	_removeDescribedBy: function( elem ) {
		var id = elem.data( "ui-tooltip-id" ),
			describedby = (elem.attr( "aria-describedby" ) || "").split( /\s+/ ),
			index = $.inArray( id, describedby );

		if ( index !== -1 ) {
			describedby.splice( index, 1 );
		}

		elem.removeData( "ui-tooltip-id" );
		describedby = $.trim( describedby.join( " " ) );
		if ( describedby ) {
			elem.attr( "aria-describedby", describedby );
		} else {
			elem.removeAttr( "aria-describedby" );
		}
	},

	_create: function() {
		this._on({
			mouseover: "open",
			focusin: "open"
		});

		// IDs of generated tooltips, needed for destroy
		this.tooltips = {};

		// IDs of parent tooltips where we removed the title attribute
		this.parents = {};

		if ( this.options.disabled ) {
			this._disable();
		}

		// Append the aria-live region so tooltips announce correctly
		this.liveRegion = $( "<div>" )
			.attr({
				role: "log",
				"aria-live": "assertive",
				"aria-relevant": "additions"
			})
			.addClass( "ui-helper-hidden-accessible" )
			.appendTo( this.document[ 0 ].body );
	},

	_setOption: function( key, value ) {
		var that = this;

		if ( key === "disabled" ) {
			this[ value ? "_disable" : "_enable" ]();
			this.options[ key ] = value;
			// disable element style changes
			return;
		}

		this._super( key, value );

		if ( key === "content" ) {
			$.each( this.tooltips, function( id, tooltipData ) {
				that._updateContent( tooltipData.element );
			});
		}
	},

	_disable: function() {
		var that = this;

		// close open tooltips
		$.each( this.tooltips, function( id, tooltipData ) {
			var event = $.Event( "blur" );
			event.target = event.currentTarget = tooltipData.element[ 0 ];
			that.close( event, true );
		});

		// remove title attributes to prevent native tooltips
		this.element.find( this.options.items ).addBack().each(function() {
			var element = $( this );
			if ( element.is( "[title]" ) ) {
				element
					.data( "ui-tooltip-title", element.attr( "title" ) )
					.removeAttr( "title" );
			}
		});
	},

	_enable: function() {
		// restore title attributes
		this.element.find( this.options.items ).addBack().each(function() {
			var element = $( this );
			if ( element.data( "ui-tooltip-title" ) ) {
				element.attr( "title", element.data( "ui-tooltip-title" ) );
			}
		});
	},

	open: function( event ) {
		var that = this,
			target = $( event ? event.target : this.element )
				// we need closest here due to mouseover bubbling,
				// but always pointing at the same event target
				.closest( this.options.items );

		// No element to show a tooltip for or the tooltip is already open
		if ( !target.length || target.data( "ui-tooltip-id" ) ) {
			return;
		}

		if ( target.attr( "title" ) ) {
			target.data( "ui-tooltip-title", target.attr( "title" ) );
		}

		target.data( "ui-tooltip-open", true );

		// kill parent tooltips, custom or native, for hover
		if ( event && event.type === "mouseover" ) {
			target.parents().each(function() {
				var parent = $( this ),
					blurEvent;
				if ( parent.data( "ui-tooltip-open" ) ) {
					blurEvent = $.Event( "blur" );
					blurEvent.target = blurEvent.currentTarget = this;
					that.close( blurEvent, true );
				}
				if ( parent.attr( "title" ) ) {
					parent.uniqueId();
					that.parents[ this.id ] = {
						element: this,
						title: parent.attr( "title" )
					};
					parent.attr( "title", "" );
				}
			});
		}

		this._registerCloseHandlers( event, target );
		this._updateContent( target, event );
	},

	_updateContent: function( target, event ) {
		var content,
			contentOption = this.options.content,
			that = this,
			eventType = event ? event.type : null;

		if ( typeof contentOption === "string" ) {
			return this._open( event, target, contentOption );
		}

		content = contentOption.call( target[0], function( response ) {

			// IE may instantly serve a cached response for ajax requests
			// delay this call to _open so the other call to _open runs first
			that._delay(function() {

				// Ignore async response if tooltip was closed already
				if ( !target.data( "ui-tooltip-open" ) ) {
					return;
				}

				// jQuery creates a special event for focusin when it doesn't
				// exist natively. To improve performance, the native event
				// object is reused and the type is changed. Therefore, we can't
				// rely on the type being correct after the event finished
				// bubbling, so we set it back to the previous value. (#8740)
				if ( event ) {
					event.type = eventType;
				}
				this._open( event, target, response );
			});
		});
		if ( content ) {
			this._open( event, target, content );
		}
	},

	_open: function( event, target, content ) {
		var tooltipData, tooltip, delayedShow, a11yContent,
			positionOption = $.extend( {}, this.options.position );

		if ( !content ) {
			return;
		}

		// Content can be updated multiple times. If the tooltip already
		// exists, then just update the content and bail.
		tooltipData = this._find( target );
		if ( tooltipData ) {
			tooltipData.tooltip.find( ".ui-tooltip-content" ).html( content );
			return;
		}

		// if we have a title, clear it to prevent the native tooltip
		// we have to check first to avoid defining a title if none exists
		// (we don't want to cause an element to start matching [title])
		//
		// We use removeAttr only for key events, to allow IE to export the correct
		// accessible attributes. For mouse events, set to empty string to avoid
		// native tooltip showing up (happens only when removing inside mouseover).
		if ( target.is( "[title]" ) ) {
			if ( event && event.type === "mouseover" ) {
				target.attr( "title", "" );
			} else {
				target.removeAttr( "title" );
			}
		}

		tooltipData = this._tooltip( target );
		tooltip = tooltipData.tooltip;
		this._addDescribedBy( target, tooltip.attr( "id" ) );
		tooltip.find( ".ui-tooltip-content" ).html( content );

		// Support: Voiceover on OS X, JAWS on IE <= 9
		// JAWS announces deletions even when aria-relevant="additions"
		// Voiceover will sometimes re-read the entire log region's contents from the beginning
		this.liveRegion.children().hide();
		if ( content.clone ) {
			a11yContent = content.clone();
			a11yContent.removeAttr( "id" ).find( "[id]" ).removeAttr( "id" );
		} else {
			a11yContent = content;
		}
		$( "<div>" ).html( a11yContent ).appendTo( this.liveRegion );

		function position( event ) {
			positionOption.of = event;
			if ( tooltip.is( ":hidden" ) ) {
				return;
			}
			tooltip.position( positionOption );
		}
		if ( this.options.track && event && /^mouse/.test( event.type ) ) {
			this._on( this.document, {
				mousemove: position
			});
			// trigger once to override element-relative positioning
			position( event );
		} else {
			tooltip.position( $.extend({
				of: target
			}, this.options.position ) );
		}

		tooltip.hide();

		this._show( tooltip, this.options.show );
		// Handle tracking tooltips that are shown with a delay (#8644). As soon
		// as the tooltip is visible, position the tooltip using the most recent
		// event.
		if ( this.options.show && this.options.show.delay ) {
			delayedShow = this.delayedShow = setInterval(function() {
				if ( tooltip.is( ":visible" ) ) {
					position( positionOption.of );
					clearInterval( delayedShow );
				}
			}, $.fx.interval );
		}

		this._trigger( "open", event, { tooltip: tooltip } );
	},

	_registerCloseHandlers: function( event, target ) {
		var events = {
			keyup: function( event ) {
				if ( event.keyCode === $.ui.keyCode.ESCAPE ) {
					var fakeEvent = $.Event(event);
					fakeEvent.currentTarget = target[0];
					this.close( fakeEvent, true );
				}
			}
		};

		// Only bind remove handler for delegated targets. Non-delegated
		// tooltips will handle this in destroy.
		if ( target[ 0 ] !== this.element[ 0 ] ) {
			events.remove = function() {
				this._removeTooltip( this._find( target ).tooltip );
			};
		}

		if ( !event || event.type === "mouseover" ) {
			events.mouseleave = "close";
		}
		if ( !event || event.type === "focusin" ) {
			events.focusout = "close";
		}
		this._on( true, target, events );
	},

	close: function( event ) {
		var tooltip,
			that = this,
			target = $( event ? event.currentTarget : this.element ),
			tooltipData = this._find( target );

		// The tooltip may already be closed
		if ( !tooltipData ) {

			// We set ui-tooltip-open immediately upon open (in open()), but only set the
			// additional data once there's actually content to show (in _open()). So even if the
			// tooltip doesn't have full data, we always remove ui-tooltip-open in case we're in
			// the period between open() and _open().
			target.removeData( "ui-tooltip-open" );
			return;
		}

		tooltip = tooltipData.tooltip;

		// disabling closes the tooltip, so we need to track when we're closing
		// to avoid an infinite loop in case the tooltip becomes disabled on close
		if ( tooltipData.closing ) {
			return;
		}

		// Clear the interval for delayed tracking tooltips
		clearInterval( this.delayedShow );

		// only set title if we had one before (see comment in _open())
		// If the title attribute has changed since open(), don't restore
		if ( target.data( "ui-tooltip-title" ) && !target.attr( "title" ) ) {
			target.attr( "title", target.data( "ui-tooltip-title" ) );
		}

		this._removeDescribedBy( target );

		tooltipData.hiding = true;
		tooltip.stop( true );
		this._hide( tooltip, this.options.hide, function() {
			that._removeTooltip( $( this ) );
		});

		target.removeData( "ui-tooltip-open" );
		this._off( target, "mouseleave focusout keyup" );

		// Remove 'remove' binding only on delegated targets
		if ( target[ 0 ] !== this.element[ 0 ] ) {
			this._off( target, "remove" );
		}
		this._off( this.document, "mousemove" );

		if ( event && event.type === "mouseleave" ) {
			$.each( this.parents, function( id, parent ) {
				$( parent.element ).attr( "title", parent.title );
				delete that.parents[ id ];
			});
		}

		tooltipData.closing = true;
		this._trigger( "close", event, { tooltip: tooltip } );
		if ( !tooltipData.hiding ) {
			tooltipData.closing = false;
		}
	},

	_tooltip: function( element ) {
		var tooltip = $( "<div>" )
				.attr( "role", "tooltip" )
				.addClass( "ui-tooltip ui-widget ui-corner-all ui-widget-content " +
					( this.options.tooltipClass || "" ) ),
			id = tooltip.uniqueId().attr( "id" );

		$( "<div>" )
			.addClass( "ui-tooltip-content" )
			.appendTo( tooltip );

		tooltip.appendTo( this.document[0].body );

		return this.tooltips[ id ] = {
			element: element,
			tooltip: tooltip
		};
	},

	_find: function( target ) {
		var id = target.data( "ui-tooltip-id" );
		return id ? this.tooltips[ id ] : null;
	},

	_removeTooltip: function( tooltip ) {
		tooltip.remove();
		delete this.tooltips[ tooltip.attr( "id" ) ];
	},

	_destroy: function() {
		var that = this;

		// close open tooltips
		$.each( this.tooltips, function( id, tooltipData ) {
			// Delegate to close method to handle common cleanup
			var event = $.Event( "blur" ),
				element = tooltipData.element;
			event.target = event.currentTarget = element[ 0 ];
			that.close( event, true );

			// Remove immediately; destroying an open tooltip doesn't use the
			// hide animation
			$( "#" + id ).remove();

			// Restore the title
			if ( element.data( "ui-tooltip-title" ) ) {
				// If the title attribute has changed since open(), don't restore
				if ( !element.attr( "title" ) ) {
					element.attr( "title", element.data( "ui-tooltip-title" ) );
				}
				element.removeData( "ui-tooltip-title" );
			}
		});
		this.liveRegion.remove();
	}
});



}));

});

define('fi.cloubi.lib.js@4.9.0.SNAPSHOT/jquery', [], function() {
	
	// Liferay 7 has global jQuery object, just use it.
	
	return jQuery;

});



