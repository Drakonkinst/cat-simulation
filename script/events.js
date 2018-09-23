/*
 * Events engine that manages and runs events.
 * 
 * TODO:
 * - Scene type that allows for user input (names, etc.)
 * */
var Events = {

    RANDOM_EVENT_INTERVAL: [3, 6],
    PANEL_FADE: 200,

    activeScene: null,          //name of current event
    activeEventContext: null,   //current event's context
    eventStack: [],             //event queue, useful for encounters with multiple events

    //returns the current event object
    activeEvent: function() {
        if(Events.eventStack && Events.eventStack.length > 0) {
            return Events.eventStack[0];
        }
        return null;
    },

    //returns the current event element
    eventPanel: function() {
        return Events.activeEvent().eventPanel;
    },

    //triggers a random event, possibilities based on current state
    randomEvent: function() {
        if(isUndefined(Events.activeEvent())) {

            //find all possible events
            var possibleEvents = [];
            for(var i in Events.EventPool) {
                var event = Events.EventPool[i];
                if(event.isAvailable()) {
                    possibleEvents.push(event);
                }
            }

            if(possibleEvents.length > 0) {
                //choose random event from possibilities
                Events.startEvent(chooseRandom(possibleEvents));
            } else {
                //no possible event found, try again sooner
                Events.Task.scheduleNext(0.5);
                return;
            }
        }

        //sets timeout for next random event to trigger
        Events.Task.scheduleNext();
    },

    /*
     * Triggers an event and opens a new event
     * panel.
     * 
     * properties:
     * - width: custom width of event panel
     * */
    startEvent: function(event, properties) {
        if(isUndefined(event)) {
            return;
        }

        /*
        Engine.event('game event', 'event');
		Engine.keyLock = true;
		Engine.tabNavigation = false;
        Button.saveCooldown = false;
        */

        //adds to beginning of event stack
        Events.eventStack.unshift(event);

        //create event panel
        event.eventPanel = $("<div>").attr("id", "event").addClass("eventPanel").css("opacity", 0)
            .append($("<div>").addClass("eventTitle").text(Events.activeEvent().title))
            .append($("<div>").attr("id", "description"))
            .append($("<div>").attr("id", "buttons"));
        if(!isUndefined(properties) && !isUndefined(properties.width)) {
            //sets custom width
            Events.eventPanel().css("width", properties.width);
        }

        //load context
        if(isType(event.getContext, "function")) {
            Events.activeEventContext = event.getContext();
        } else {
            Events.activeEventContext = {};
        }

        //begins with the start scene
        Events.loadScene("start");

        //draw event panel
        $("#wrapper").append(Events.eventPanel());
        Events.eventPanel().animate({opacity: 1}, Events.PANEL_FADE, 'linear');
        
        /*
		var currentSceneInformation = Events.activeEvent().scenes[Events.activeScene];
		if (currentSceneInformation.blink) {
			Events.blinkTitle();
        }
        */

    },

    //ends event and clears the event panel
    endEvent: function() {
        Events.eventPanel().animate({opacity: 0}, Events.PANEL_FADE, 'linear', function() {
			Events.eventPanel().remove();
            Events.activeEvent().eventPanel = null;
            Events.activeEventContext = null;
            Events.eventStack.shift();
            Logger.log(Events.eventStack.length + " events remaining");

			/*
			Engine.keyLock = false;
			Engine.tabNavigation = true;
			Button.saveCooldown = true;
			if (Events.BLINK_INTERVAL) {
				Events.stopTitleBlink();
			}
            */

            //forces refocus on the body for IE
            $("body").focus();
		});
    },

    //starts a scene in an event
    loadScene: function(name) {
        //sets active scene and grabs scene object from the event
        Logger.log("Loading scene: " + name);
        Events.activeScene = name;
        var scene = Events.getScene(name);
        
        //Logger.log(scene);
        //run on load actions
        if(!isUndefined(scene.onLoad)) {
            scene.onLoad();
        }

        //notify scene change
        if(!isUndefined(scene.notification)) {
            Notifications.notify(scene.notification);
        }

        if(!isUndefined(scene.eventTitle)) {
            $(".eventTitle", Events.eventPanel()).text(scene.eventTitle);
        }

        //clear event panel for new scene
        $('#description', Events.eventPanel()).empty();
        $('#buttons', Events.eventPanel()).empty();
        
        //if there are multiple types of scenes, decide which one to use here
        //if(!isUndefined(scene.prompt)) {
            //Events.startPrompt(scene);
        //} else {
            Events.startStory(scene);
        //}
        
    },

    //starts a story scene
    startStory: function(scene) {
        var desc = $("#description", Events.eventPanel());
        for(var line in scene.text) {
            desc.append($("<div>").text(scene.text[line]));
        }

        if(!isUndefined(scene.input)) {
            var input = $("<input>").attr({
                "type": "text",
                "name": "input",
                "spellcheck": false,
                "placeholder": scene.input
            }).appendTo(desc);

            if(!isUndefined(scene.maxinput)) {
                input.attr("maxlength", scene.maxinput);
            }

            $("<div>").attr("id", "input-result").css("opacity", 0).appendTo(desc);
            $("#description input").focus().select();
        }

        //by exit, we just mean that it switches to another scene - should this divide be made?
        var exitBtns = $("<div>").attr("id", "exitButtons").appendTo($("#buttons", Events.eventPanel()));
        Events.drawButtons(scene);
        exitBtns.append($("<div>").addClass("clear"));
    },

    //draws buttons to event panel
    drawButtons: function(scene) {
        var btns = $("#exitButtons", Events.eventPanel());
        var btnList = [];
        for(var id in scene.buttons) {
            var info = scene.buttons[id];
            var button = new Button({
                id: id,
                text: info.text,
                tooltip: info.tooltip || null,
                onClick: function() {
                    Events.buttonClick(this);
                },
                cooldown: info.cooldown     //NOTE: cooldown means that the button starts already cooling down, not actual length
            }).appendTo(btns);

            if(!isUndefined(info.available) && !info.available()) {
                button.setDisabled(true);
            }

            if(!isUndefined(info.cooldown)) {
                button.startCooldown();
            }
            btnList.push(button);
        }

        //Events.updateButtons();
    },

    /* //no use currently
    updateButtons: function() {
        var btns = Events.activeEvent().scenes[Events.activeScene].buttons;
        for(var id in btns) {
            var button = btns[id];
            var element = $("#" + id, Events.eventPanel());
            //check cost and availability, disable if needed
        }
    },
    */

    //handles when the player clicks a button, changes scene or ends event
    buttonClick: function(button) {
        //extract button object
        var scene = Events.getScene(Events.activeScene);
        if(isType(scene, "function")) {
            scene = scene(Events.activeEvent().getContext());
        }

        var info = scene.buttons[button.id];

        if(info.checkValid && isType(scene.valid, "function") && !isUndefined(scene.input)) {
            var text = Events.eventPanel().find("input").val();
            var result = scene.valid(text);

            if(!isType(result, "boolean") || !result) {
                if(isType(result, "string") && Events.eventPanel().find("#input-result").css("opacity") == 0) {
                    if(result.length > 0 && ".!? ".indexOf(result.slice(-1)) == -1) {
                        result += ".";
                    }
                    Events.eventPanel().find("#input-result").text(result).css("opacity", 1).animate({opacity: 0}, 1500, "linear");
                }
                return;
            }
        }
        if(!isUndefined(info.notification)) {
            Notifications.notify(info.notification);
        }

        if(!(isUndefined(info.click))) {
            info.click();
        }

        if(!isUndefined(info.nextScene)) {
            if(info.nextScene == "end") {
                button.setDisabled(true);
                Events.endEvent();
            } else {
                var nextScene = chooseWeighted(info.nextScene);
                if(!isUndefined(nextScene)) {
                    Events.loadScene(nextScene);
                    return;
                }
                Logger.warn("No suitable scene found after \"" + Events.activeScene + "\"");
                Events.endEvent();
            }
        }
    },

    getScene: function(name) {
        /*
         * My favorite piece of code in this whole damn thing.
         * If scene is a function, that means it's a context-based scene and has
         * a function(context) argument, so it calls the scene fuction with getContext()
         * as an argument.
         * 
         * This redefines scene as an object - which it otherwise should be if
         * it wasn't a function. So all the code below
         * will work perfectly either way.
         * */
        var scene = Events.activeEvent().scenes[name];
        if(isType(scene, "function")) {
            scene = scene(Events.activeEventContext);
        }
        return scene;
    },

    Init: function() {
        //build the event pool
        Events.EventPool = [];
        for(var module in Game.modules) {
            Events.EventPool = Events.EventPool.concat(Game.modules[module].events);
        }

        Events.Task = new Task("random event", Events.randomEvent, Events.RANDOM_EVENT_INTERVAL[0], Events.RANDOM_EVENT_INTERVAL[1]);
        Events.Task.scheduleNext();
    }
}