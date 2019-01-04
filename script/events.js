/*
 * Events engine that manages and runs events.
 * */
var Events = {

    RANDOM_EVENT_INTERVAL: [3, 6],  //interval until a random event should occur, in minutes
    PANEL_FADE: 200,                //milliseconds it takes to fade in or out an event

    activeScene: null,          //name of current event
    activeEventContext: null,   //current event's context
    eventStack: [],             //event queue, useful for encounters with multiple events
    blinkInterval: null,        //ID of the current blink interval timer

    //returns the current event object
    activeEvent: function() {
        if(Events.eventStack.length > 0) {
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
        //can only trigger new event if one is not currently active
        if(isUndefined(Events.activeEvent())) {

            //get a list of all possible events
            var possibleEvents = [];
            for(var i = 0; i < Events.EventPool.length; i++) {
                var event = Events.EventPool[i];
                if(event.isAvailable()) {
                    possibleEvents.push(event);
                }
            }

            if(possibleEvents.length > 0) {
                //choose random event from possibilities
                Events.startEvent(chooseRandom(possibleEvents));
            } else {
                //no possible event found, sets shorter timeout for next check
                Tasks.scheduleNext(Events.Task, 0.5);
                return;
            }
        }

        //sets default timeout for next random event to trigger
        Tasks.scheduleNext(Events.Task);
    },

    /*
     * Called upon event trigger, adds event to
     * eventStack and initializes it if it is the next one
     * */
    startEvent: function(event) {
        if(isUndefined(event)) {
            return;
        }

        //prevents user from using keyboard navigation during event overlay
        Game.keyLock = true;
        Game.tabNavigation = false;

        //adds to event stack
        Events.eventStack.push(event);

        //create event panel
        event.eventPanel = $("<div>").attr("id", "event").addClass("event-panel").css("opacity", 0)
            .append($("<div>").addClass("event-title").text(event.title))
            .append($("<div>").attr("id", "description"))
            .append($("<div>").attr("id", "buttons"));

        //create context object based on the instant this function is called
        if(typeof event.getContext === "function") {
            event.context = event.getContext();
        }

        //play notification in start scene when the event is added, rather than when it starts
        var startScene = Events.getScene("start", event);
        if(exists(startScene.notification)) {
            Notifications.notify(startScene.notification);
        }

        if(Events.eventStack.length <= 1) {
            //event is the only one in the stack, start it!
            Events.initEvent();
        }
    },

    initEvent: function() {
        //begins with the start scene
        Events.loadScene("start", true);

        //draw event panel
        $("#wrapper").append(Events.eventPanel());
        Events.eventPanel().animate({opacity: 1}, Events.PANEL_FADE, "linear");
        
        var currentSceneInfo = Events.getScene(Events.activeScene);
		if(currentSceneInfo.blink) {
            //blinks title to notify AFK players for duration of event
			Events.blinkTitle();
        }
    },

    //ends event and clears the event panel
    endEvent: function() {
        Events.eventPanel().animate({opacity: 0}, Events.PANEL_FADE, "linear", function() {
            //clear all variables
			Events.eventPanel().remove();
            Events.activeEvent().eventPanel = null;
            Events.activeEvent().context = null;
            Events.eventStack.shift();

            if(Events.eventStack.length > 0) {
                Events.initEvent();
                Logger.log(Events.eventStack.length + " events remaining");
            } else {
                //clears event overlay state
                if(exists(Events.blinkInterval)) {
                    Events.stopTitleBlink();
                }
    
                //re-enables keyboard input
                Game.keyLock = false;
                Game.tabNavigation = true;

                //forces refocus on the body for IE
                $("body").focus();
            }
		});
    },

    //starts a scene in an event
    loadScene: function(name, skipNotification) {
        //sets active scene and grabs scene object from the event
        Logger.log("Loading scene: " + name);
        Events.activeScene = name;
        var scene = Events.getScene(name);
        
        if(typeof scene.onLoad === "function") {
            //run on load actions
            scene.onLoad();
        }

        if(exists(scene.notification) && !skipNotification) {
            //notify scene change
            Notifications.notify(scene.notification);
        }

        if(exists(scene.eventTitle)) {
            //set title
            $(".event-title", Events.eventPanel()).text(scene.eventTitle);
        }

        //clear event panel for new scene
        $("#description", Events.eventPanel()).empty();
        $("#buttons", Events.eventPanel()).empty();
        
        //if there are multiple types of scenes, decide which one to use here
        Events.startStory(scene);
    },

    //starts a story scene
    startStory: function(scene) {
        //sets description
        var desc = $("#description", Events.eventPanel());
        for(var line = 0; line < scene.text.length; line++) {
            desc.append($("<div>").text(scene.text[line]));
        }

        if(exists(scene.input)) {
            //scene has an input, so enable selection of input box
            Game.enableSelection();

            //draw input element using scene.input as a placeholder prompt
            var input = $("<input>").attr({
                "type": "text",
                "name": "input",
                "spellcheck": false,
                "placeholder": scene.input
            }).appendTo(desc);

            if(exists(scene.maxinput)) {
                //sets max character input
                input.attr("maxlength", scene.maxinput);
            }

            //create result element for validity messages
            $("<div>").attr("id", "input-result").css("opacity", 0).appendTo(desc);

            autoSelect("#description input");
        } else if (exists(scene.textarea)) {
            //draw textarea element using scene.textarea as the initial value
            var ta = $("<textarea>").val(scene.textarea).appendTo(desc);
            if(scene.readonly) {
                ta.attr("readonly", true);
            }
            autoSelect("#description textarea");
        }

        //exit buttons let the player respond to the scene
        var exitBtns = $("<div>").attr("id", "exit-buttons").appendTo($("#buttons", Events.eventPanel()));

        if(scene.buttons) {
            //draw the buttons to exitBtn
            Events.drawButtons(scene);
        }

        exitBtns.append($("<div>").addClass("clear"));
    },

    //draws buttons to event panel
    drawButtons: function(scene) {
        var btns = $("#exit-buttons", Events.eventPanel());
        //var btnList = [];

        //adds buttons
        for(var id in scene.buttons) {
            var info = scene.buttons[id];

            //create Button object based on button info
            var button = new Button({
                id: id,
                text: info.text,
                tooltip: info.tooltip || null,
                onClick: function() {
                    //runs buttonClick as a wrapper around info.click
                    Events.buttonClick(this);
                },
                cooldown: info.cooldown     //sets initial cooldown, since cooldown after click is irrelevant
            }).appendTo(btns);

            if(exists(info.cooldown)) {
                //button starts cooling down so player can not press it immediately
                button.startCooldown();
            }
            //btnList.push(button);
        }

        Events.updateButtons();
    },

    //disables buttons if they are no longer available
    updateButtons: function() {
        var btns = Events.getScene(Events.activeScene).buttons;
        
        for(var id in btns) {
            var button = Buttons.getButton(id);
            var info = btns[id];
            if(exists(info.available) && !info.available()) {
                button.setDisabled(true);
            }
        }
    },

    //handles when the player clicks a button, changes scene or ends event
    buttonClick: function(button) {
        //grab button info and scene
        var scene = Events.getScene(Events.activeScene);
        var info = scene.buttons[button.id];

        if(!(isUndefined(info.click))) {
            var result = info.click();

            if(exists(result) && (typeof result !== "boolean" || !result)) {
                //result is not valid
                if(typeof result === "string") {
                    if(isUndefined(scene.input)) {
                        Notifications.notify(result);
                    } else {
                        if(Events.eventPanel().find("#input-result").css("opacity") == 0) {
                            //prints string as error message
                            if(result.length > 0 && ".!? ".indexOf(result.slice(-1)) == -1) {
                                result += ".";
                            }
                            Events.eventPanel().find("#input-result").text(result).css("opacity", 1).animate({opacity: 0}, 1500, "linear");
                        }
                    }
                }
                return;
            }

            //TODO what if there are two input scenes in an event?
            if(exists(scene.input) && info.nextScene == "end") {
                Game.disableSelection();
            }   
        }

        Events.updateButtons();
        
        if(exists(info.notification)) {
            //notify button click
            Notifications.notify(info.notification);
        }

        if(exists(info.nextScene)) {
            //change scene
            if(info.nextScene == "end") {
                //special "end" case, end event
                button.setDisabled(true);
                Events.endEvent();
            } else {
                //usual case, choose next scene based on basic weighted probability
                var nextScene = chooseWeighted(info.nextScene);

                if(exists(nextScene)) {
                    //change scene
                    Events.loadScene(nextScene);
                    return;
                }
                
                //something's gone wrong, exit event
                Logger.warn("No suitable scene found after \"" + Events.activeScene + "\"");
                Events.endEvent();
            }
        }
    },

    //every 3 seconds change title to *** EVENT ***, then change back to the original title 1.5 seconds later
    blinkTitle: function() {
        var title = document.title;

        if(exists(Events.blinkInterval)) {
            return;
        }

        //set blinkInterval
        Events.blinkInterval = Game.setInterval(function() {
            document.title = "*** EVENT ***";
            Game.setTimeout(function() {
                document.title = title;
            }, 1500);
        }, 3000);
    },

    //clears blinkInterval and stops blinking the title
    stopTitleBlink: function() {
        clearInterval(Events.blinkInterval);
        Events.blinkInterval = null;
    },

    /*
     * If the scene info is a function, return the result of
     * calling that function with the context object. Either
     * way, an object should be returned.
     * */
    getScene: function(name, event) {
        event = event || Events.activeEvent();
        var scene = event.scenes[name];
        if(typeof scene === "function") {
            return scene(event.context);
        }
        return scene;
    },

    Init: function() {
        //build the event pool
        Events.EventPool = [].concat(
            World.events,
            House.events,
            Outside.events
        );

        //start random event task
        Events.Task = new Task("random", Events.randomEvent, Events.RANDOM_EVENT_INTERVAL[0], Events.RANDOM_EVENT_INTERVAL[1]);
        Tasks.scheduleNext(Events.Task);
    }
};