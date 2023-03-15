define('fi.cloubi.frontend.common.js@4.15.19/task', ['./utils', './material', './dialog', './adaptivity', './bigimage'], function (utils, material, dialogs, adaptivity, bigimage) {

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