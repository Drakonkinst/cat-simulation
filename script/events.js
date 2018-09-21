/*
 * Events engine that manages and runs events.
 * 
 * TODO:
 * - Scene type that allows for user input (names, etc.)
 * */
var Events = {

    activeScene: null,      //name of current event
    eventStack: [],         //event queue, useful for encounters with multiple events

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

        //begins with the start scene
        Events.loadScene("start");

        //draw event panel
        $("#wrapper").append(Events.eventPanel());
        Events.eventPanel().animate({opacity: 1}, 200, 'linear');
        
        /*
		var currentSceneInformation = Events.activeEvent().scenes[Events.activeScene];
		if (currentSceneInformation.blink) {
			Events.blinkTitle();
        }
        */

    },

    //ends event and clears the event panel
    endEvent: function() {
        Events.eventPanel().animate({opacity:0}, 200, 'linear', function() {
			Events.eventPanel().remove();
			Events.activeEvent().eventPanel = null;
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
        var scene = Events.activeEvent().scenes[name];

        //run on load actions
        if(!isUndefined(scene.onLoad)) {
            scene.onLoad();
        }

        //notify scene change
        if(!isUndefined(scene.notification)) {
            Notifications.notify(null, scene.notification);
        }

        //clear event panel for new scene
        $('#description', Events.eventPanel()).empty();
        $('#buttons', Events.eventPanel()).empty();
        
        //if there are multiple types of scenes, decide which one to use here
        Events.startStory(scene);
    },

    //starts a story scene
    startStory: function(scene) {
        var desc = $("#description", Events.eventPanel());
        for(var line in scene.text) {
            desc.append($("<div>").text(scene.text[line]));
        }

        //by exit, we just mean that it switches to another scene - should this divide be made?
        var exitBtns = $("<div>").attr("id", "exitButtons").appendTo($("#buttons", Events.eventPanel()));
        Events.drawButtons(scene);
        exitBtns.append($("<div>").addClass("clear"));
    },

    //startInput

    //draws buttons to event panel
    drawButtons: function(scene) {
        var btns = $("#exitButtons", Events.eventPanel());
        var btnList = [];
        for(var id in scene.buttons) {
            var info = scene.buttons[id];
            var button = new Button({
                id: id,
                text: info.text,
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
        var info = Events.activeEvent().scenes[Events.activeScene].buttons[button.id];

        if(!isUndefined(info.notification)) {
            Notifications.notify(null, info.notification);
        }

        if(!(isUndefined(info.click))) {
            info.click();
        }

        if(!isUndefined(info.nextScene)) {
            if(info.nextScene == "end") {
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

    Init: function() {
        //build the event pool
        Events.EventPool = [];
        for(var i in Game.modules) {
            Events.EventPool = Events.EventPool.concat(Game.modules[i].events);
        }

        Events.Task = new Task("random event", Events.randomEvent, 3, 6);
        Events.Task.scheduleNext();
    }
}