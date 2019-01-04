/*
 * All this code is copyright Drakonkinst & ctZN4, 2018.
 * - design heavily based on A Dark Room by Doublespeak Games (https://adarkroom.doublespeakgames.com)
 * - a bunch of snippets, help, and influence from:
 *   - Cookie Clicker by Orteil (https://orteil.dashnet.org/cookieclicker)
 *   - Candy Box 2 by aniwey (https://candybox2.github.io)
 *   - Drowning in Problems by Notch (http://game.notch.net/drowning/)
 * - inspired by Drakonkinst's old Comp Sci A project
 * 
 * Spoilers ahead.
 * https://drakonkinst.github.io/cat-simulation/
 */

 /*
  * Game engine and state manager, central
  * object that runs the world and gives
  * the program wings
  * */
var Game = {
    /* ====== Variables and Presets ====== */
    SAVE_INTERVAL: 30 * 1000,   //interval before the "saved." text should display again

    version: {
        alpha: false, //alpha phase, mutually exclusive with beta
        beta: true,   //beta phase, mutually exclusive with alpha
        major:    1,  //increments for every major update
        minor:    0,  //increments for every minor update, resets on every major update
        release:  1,  //increments for every stable build pushed (successful bugfixes, etc.), resets on every minor update
        build:    2,  //increments for every unstable build tested, resets on every release
    },

    //developer options
    options: {
        debug: true,            //print debug messages
        instantButtons: false,  //ignore button cooldowns completely
        fastButtons: true,     //speed up button cooldowns greatly
        fastEvents: false,      //scheduled tasks happen much more quickly
        warn: false              //warn if user tries to close browser
    },

    //game states
    pressed: false,         //key is being pressed
    keyLock: false,         //keys do not function
    tabNavigation: true,    //tab navigation does not function
    gameOver: false,

    eventTopics: {},

    //State Object
    State: null,

    //parses Game.version into a legible string
    getVersionString: function() {
        var v = Game.version;
        var prefix = v.alpha ? "alpha " : v.beta ? "beta " : "";
        Logger.warnIf(v.alpha && v.beta, "This build is marked as both alpha and beta!");
        return prefix + "v" + v.major + "." + v.minor + v.release + v.build;
    },

    /* ======= Utils ======= */
    //returns current time
    now: function() {
        return new Date().getTime();
    },

    //wrapper around setInterval(), just in case we want to mess with it later
    setInterval: function(callback, interval) {
        return setInterval(callback, interval);
    },

    //wrapper around setTimeout(), just in case we want to mess with it later
    setTimeout: function(callback, timeout) {
        return setTimeout(callback, timeout);
    },

    /* ====== Modules ====== */
    //module object of the current location
    activeModule: null,

    //returns whether there are enough locations to travel
    canTravel: function() {
        return $("#header").find(".header-button").length > 1;
    },

    //transitions from one module to another
    travelTo: function(module) {
        if(Game.activeModule == module) {
            return;
        }

        //sets which header button should be underlined
        $(".header-button").removeClass("selected");
        module.tab.addClass("selected");

        //moves the slider based on current location
        var slider = $("#location-slider");
        var panelIndex = $(".location").index(module.panel);
        var currentIndex = Game.activeModule ? $(".location").index(Game.activeModule.panel) : 1;
        var diff = Math.abs(panelIndex - currentIndex);
        slider.animate({left: -(panelIndex * 700) + "px"}, 300 * diff);

        //update to new module
        Game.activeModule = module;
        module.onArrival(diff);
        Notifications.printQueue(module);
    },

    //adds a location to the header, associated with a module
    addLocation: function(id, text, module) {
        return $("<div>").attr("id", "location_" + id)
            .addClass("header-button")
            .text(text).click(function() {
                if(Game.canTravel()) {
                    Game.travelTo(module);
                }  
            }).appendTo($("#header"));
    },

    //changes width of slider to match number of locations
    updateSlider: function() {
        var slider = $("#location-slider");
        slider.width((slider.children().length * 700) + "px");
    },

    /* ====== Equipment ====== */
    //info table of all game items
    Items: {
        "cat": {
            type: "special"
        }
    }, 

    //character perks
    Perks: {
        "heartless": {
            desc: "incurred the wrath of your subjects",
            notify: "learned to turn that beating heart to stone"
        }
    },

    //updates general equipment inventory
    updateEquipment: function() {
        //creates Containers
        var equipment = new Container("#equipment", "you have");
        var inventory = new Container("#inventory");
        var special = new Container("#special");

        //switch lookup
        var locations = {
            //"resource": null,
            //"building": null,
            "special": special,
            "inventory": inventory,
            "default": inventory
        };

        //update all items in equipment
        for(var item in $SM.get("character.equipment")) {
            //get location for item
            if(House.Buildings.hasOwnProperty(item)) {
                continue;
            }

            var type = Game.Items.hasOwnProperty(item) ? Game.Items[item].type : "default";
            var location = locations[type];
            
            Game.updateRow(item, $SM.get("character.equipment[" + item + "]"), location.get());
        }

        //initialize containers
        if(inventory.needsAppend && inventory.exists()) {
            inventory.create().appendTo(equipment.get());
        }

        if(special.needsAppend && special.exists()) {
            special.create().prependTo(equipment.get());
        }

        if(equipment.needsAppend && equipment.get().find(".row").length > 0) {
            equipment.create().prependTo("#equipment-container");
        }

        //sphaghet.
        if(equipment.get().find(".row").length == 0) {
            equipment.get().animate({opacity: 0}, 300, "linear");
        }
    },

    //updates perk inventory
    updatePerks: function() {
        //create perk container
        var perks = new Container("#perks", "perks");

        //update all perks
        for(var perk in Game.Perks) {
            if($SM.hasPerk(perk)) {
                Game.updateRow(perk, 1, perks.get(), true, new Tooltip().addText(Game.Perks[perk].desc));
            }
        }

        //initialize container
        if(perks.needsAppend && perks.get().children().length > 0) {
            perks.create().appendTo("#equipment-container");
        }
    },

    //updates a single row in a given location
    updateRow: function(name, value, location, hideQuantity, tooltip) {
        //find row
        var id = "row_" + name.replace(/\s+/g, "-");
        var row = $("#" + id, location);

        if(!row.length) {
            //create row
            row = $("<div>").attr("id", id).addClass("row")
                .append($("<div>").addClass("row_key"))
                .append($("<div>").addClass("row_val"))
                .append($("<div>").addClass("clear"));
            var prevItem = null;
            location.children().each(function() {
                var child = $(this);
                //alphabetize within container
                if(child.children(".row_key").text() < name) {
                    prevItem = child.attr("id");
                }
            });
            if(isUndefined(prevItem)) {
                //adds to beginning if no previous item found
                row.prependTo(location);
            } else {
                //append after previous alphabetical item
                row.insertAfter(location.find("#" + prevItem));
            }
        }

        if(value === 0) {
            //might want to keep 0 for other inventories in the future
            row.remove();
        } else {
            //set row name
            $("#" + row.attr("id"), location).find(".row_key").text(name);
            if(value > 1 || !hideQuantity) {
                //set row value
                $("#" + row.attr("id"), location).find(".row_val").text(value);
            }
        }

        //adds tooltip
        if(exists(tooltip)) {
            tooltip.appendTo(row);
        }
    },

    //moves main equipment element to accomodate for other containers
    moveEquipmentView: function(topContainer, transitionDiff) {
        Game.updateEquipment();
        var equipment = $("#equipment-container");
        transitionDiff = transitionDiff || 1;

        if(isUndefined(equipment)) {
            return;
        }

        if(isUndefined(topContainer) || !topContainer.length) {
            equipment.animate({top: "40px"}, {queue: false, duration: 300 * transitionDiff});
        } else {
            equipment.animate({top: (topContainer.height() + 66) + "px"}, {queue: false, duration: 300 * transitionDiff});
        }
    },

    /* ====== Browser Checks ====== 
    //thanks, doublespeak games!

    //checks if the browser supports CSS3 and HTML5
    browserValid: function() {
        return (location.search.indexOf("ignorebrowser=true") >= 0 || (isUndefined(Storage) && !oldIE));
    },

    //returns if the player is on a mobile device
    isMobile: function() {
        return (location.search.indexOf("ignorebrowser=true") < 0 && /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent));
    },

    /* ====== Keypress Handlers ====== */
    //when a key is pressed
    keyDown: function(e) {
        e = e || window.event;

        if(!Game.pressed && !Game.keyLock) {
            Game.pressed = true;
        }
    },

    //when a key is released
    keyUp: function(e) {
        Game.pressed = false;

        /* Default keyUp Handler */
        function arrowUp() {
            if(Game.tabNavigation && Game.activeModule == House) {
                if(exists(typeof House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) - 1])) {
                    var prevRoom = House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) - 1];
                    House.travelTo(prevRoom);
                }
            }
        }

        function arrowDown() {
            if(Game.tabNavigation && Game.activeModule == House) {
                if(exists(typeof House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) + 1])) {
                    var nextRoom = House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) + 1];
                    House.travelTo(nextRoom);
                }
            }
        }
        
        function arrowLeft() {
            if(Game.tabNavigation) {
                if(Game.activeModule == Outside && House.tab) {
                    Game.travelTo(House);
                }
            }
        }

        function arrowRight() {
            if(Game.tabNavigation) {
                if(Game.activeModule == House && Outside.tab) {
                    Game.travelTo(Outside);
                }
            }
        }

        var keys = {
            38: arrowUp, 87: arrowUp,       //W or UP
            40: arrowDown, 83: arrowDown,   //S or DOWN
            37: arrowLeft, 65: arrowLeft,   //A or LEFT
            39: arrowRight, 68: arrowRight, //D or RIGHT
            "default": function() {}        //everything else
        };
        (keys[e.which] || keys["default"])();
    },

    /*
    swipeLeft: function(e) {
        Game.keyUp()
    },

    swipeRight: function(e) {

    },

    swipeUp: function(e) {

    },

    swipeDown: function(e) {

    },*/

    /* ====== Document Modifiers ====== */
    //cancels all mouse clicks except for menu buttons
    disableSelection: function() {
        function eventNullifier(e) {
            return $(e.target).hasClass("menu-btn");
        }
        
        document.onselectstart = eventNullifier; //IE support
		document.onmousedown = eventNullifier;   //everything else
    },

    //re-enables all mouse clicks
    enableSelection: function() {
        function eventPassThrough() {
            return true;
        }
        
        document.onselectstart = eventPassThrough;
        document.onmousedown = eventPassThrough;
    },

    /* ====== Saving / Loading ===== */
    //saves current game state to local storage
    saveGame: function() {
        if(exists(Storage) && exists(localStorage)) {
            //"saved." notification does not play on a set interval, every time saveGame()
            //is called it attempts to show the message
            if(isUndefined(Game.lastSave) || Game.now() - Game.lastSave > Game.SAVE_INTERVAL) {
                $("#save-notify").css("opacity", 1).animate({opacity: 0}, 1000, "linear");
                Game.lastSave = Game.now();
            }

            localStorage.gameState = JSON.stringify(Game.State);
        }
    },
    
    //loads game state from local storage
    loadGame: function() {
        try {
            var savedState = JSON.parse(localStorage.gameState);
            if(exists(savedState)) {
                Game.State = savedState;
                Logger.log("Loaded save!");
            }
        } catch(e) {
            //error found, revert to blank game state
            Game.State = {};
            $SM.setM("version", Game.version);
        }
    },

    //event that asks if the player wants to delete their save
    confirmDelete: function() {
        if(exists(Events.activeEvent())) {
            return;
        }
        Events.startEvent({
            title: "Restart?",
            scenes: {
                "start": {
                    text: ["restart simulation?"],
                    buttons: {
                        "yes": {
                            text: "yes",
                            nextScene: "end",
                            click: Game.deleteSave
                        },
                        "no": {
                            text: "no",
                            nextScene: "end"
                        }
                    }
                }
            }
        });
    },

    //clears local storage and starts a new game
    deleteSave: function(noReload) {
        Game.options.warn = false;
        if(exists(Storage) && exists(localStorage)) {
            Game.State = {};
            localStorage.clear();
        }
        if(!noReload) {
            location.reload();
        }
    },

    /* ====== Import / Export ====== */
    //import/export event
    exportImport: function() {
        //to prevent spam, will not do anything if there is already an event going on
        if(exists(Events.activeEvent())) {
            return;
        }

        Events.startEvent({
            title: "Export / Import",
            scenes: {
                "start": {
                    text: [
                        "export or import save data, for backing up",
                        "or migrating computers"
                    ],
                    buttons: {
                        "export": {
                            text: "export",
                            nextScene: {"export": 1}
                        },
                        "import": {
                            text: "import",
                            nextScene: {"confirmImport": 1}
                        },
                        "cancel": {
                            text: "cancel",
                            nextScene: "end"
                        }
                    }
                },
                "export": {
                    text: ["save this."],
                    textarea: Game.export64(),
                    readonly: true,
                    buttons: {
                        "done": {
                            text: "got it",
                            nextScene: "end",
                            click: function() {
                                Game.disableSelection();
                            }
                        }
                    }
                },
                "confirmImport": {
                    text: [
                        "are you sure?",
                        "if the code is invalid, all data will be lost.",
                        "this is irreversible."
                    ],
                    buttons: {
                        "yes": {
                            text: "yes",
                            nextScene: {"import": 1},
                            click: function() {
                                Game.enableSelection();
                            }
                        },
                        "no": {
                            text: "no",
                            nextScene: {"start": 1}
                        }
                    }
                },
                "import": {
                    text: ["paste the save code here."],
                    textarea: "",
                    buttons: {
                        "import": {
                            text: "import",
                            nextScene: "end",
                            click: function() {
                                var saveStr = Events.eventPanel().find("textarea").val();
                                Game.import64(saveStr);
                            }
                        },
                        "cancel": {
                            text: "cancel",
                            nextScene: "end"
                        }
                    }
                }
            }
        });
    },

    //imports game from encoded string
    import64: function(str64) {
        Game.disableSelection();
        str64 = str64.replace(/[\s\.\n]/g, "");
        var decodedSave = Base64.decode(str64);
        localStorage.gameState = decodedSave;
        location.reload();
    },

    //returns encoded string of game state
    export64: function() {
        Game.saveGame();
        Game.enableSelection();
        var str64 = Base64.encode(localStorage.gameState);
        str64 = str64.replace(/[\s\.\n]/g, "");
        return str64;
    },

    /* ====== Game End ====== */
    //ends the game
    End: function() {
        $("<div>").attr("id", "end-overlay").css("opacity", 0)
            .append($("<div>").attr("id", "center-text")
                .append($("<div>").attr("id", "end-title").text("game over").css("opacity", 0))
                .append($("<div>").attr("id", "end-subtitle").text("you are left miserable and alone, left in the company of humans and other unfortunate creatures that are not cats.").css("opacity", 0))
                .append($("<div>").attr("id", "end-buttons").text("restart.").css("opacity", 0).click(function() {
                    Game.options.warn = false;
                    location.reload();
                })))
            .animate({opacity: 1}, 3000, "linear", function() {
                $("#end-title").animate({opacity: 1}, 1500, "linear");
                $("#end-subtitle").animate({opacity: 1}, 1500, "linear");
                $("#end-buttons").delay(1500).animate({opacity: 1}, 1500, "linear");
            })
            .appendTo("body");

        $("#wrapper").animate({opacity: 0}, 3000, "linear");
    },

    handleStateUpdates: function(e) {
        Logger.log("Update fired! category: " + e.category + " state: " + e.stateName);
    },
    
    /* ====== Game Initialization ====== */
    Init: function() {
        var start = Game.now();
        Logger.log("Game initializing...");
        Game.loadGame();
        
        Logger.log("Version is " + Game.getVersionString());

        /*
        //check for HTML5(+?) support
        if(!Game.browserValid()) {
            //window.location = //set to browser warning window
        }

        //check for mobile
        if(Game.isMobile()) {
            //window.location = //set to mobile warning window
        }//*/

        Game.disableSelection();

        /* Layout */
        $("#main").empty();

        $("<div>").attr("id", "day-notify").appendTo("#wrapper");
        $("<div>").attr("id", "save-notify").text("saved.").appendTo("#wrapper");

        $("<div>").attr("id", "equipment-container").appendTo("#main");
        $("<div>").attr("id", "header").appendTo("#main");
        $("<div>").attr("id", "location-slider").appendTo("#main");
        
        $("<div>").attr("id", "footer")
            .append($("<span>")
                .addClass("version menu-btn")
                .text(Game.getVersionString()))
            .append($("<span>")
                .addClass("github menu-btn")
                .text("github.")
                .click(function() {
                    window.open("https://github.com/Drakonkinst/cat-simulation");
                }))
            .append($("<span>")
                .addClass("menu-btn")
                .text("discord.")
                .click(function() {
                    window.open("https://discord.gg/Wrp7Fre");
                }))
            //.append($("<span>").addClass("menu-btn").text("stats."))
            .append($("<span>")
                .addClass("menu-btn")
                .text("restart.")
                .click(Game.confirmDelete))
            .append($("<span>")
                .addClass("menu-btn")
                .text("save."))
                .click(Game.exportImport)
            //.append($("<span>").addClass("menu-btn").text("share."))
        .appendTo("body");

        //register keypress handlers
        $("body").off("keydown").keydown(Game.keyDown);
        $("body").off("keyup").keyup(Game.keyUp);

        /*//register swipe handlers
        var swipeElement = $("#outer-slider");
        swipeElement.on("swipeleft", Game.swipeLeft);
        swipeElement.on("swiperight", Game.swipeRight);
        swipeElement.on("swipeup", Game.swipeUp);
        swipeElement.on("swipedown", Game.swipeDown);
        */

        $(window).on("beforeunload", function() {
            if(Game.options.warn) {
                return true;
            }
        });

        $.Dispatch("stateUpdate").subscribe(Game.handleStateUpdates);
        
        Notifications.Init();

        if($SM.get("features.location.house")) {
            House.Init();
            Game.travelTo(House);
        }

        //World.Init();
        //Outside.Init();
        Problems.Init();

        Game.updateEquipment();

        var end = Game.now();
        Logger.log("Game initialized! (took " + (end - start) + "ms)");
    }
};

//create jQuery Callbacks() to handle object events
$.Dispatch = function(id) {
    var callbacks;
    var topic = id && Game.eventTopics[id];

    if(!topic) {
        callbacks = jQuery.Callbacks();
        topic = {
            publish: callbacks.fire,
            subscribe: callbacks.add,
            unsubscribe: callbacks.remove
        };
        if(id) {
            Game.eventTopics[id] = topic;
        }
    }

    return topic;
}

//Let's do this!
$(document).ready(function() {
    console.log("> " + chooseRandom(["remember: hacked cats are bad luck", "oh, hello there!", "cheating in some kibble or just checking for bugs?", "whazzup?", "thanks for stopping by!", "we've been expecting you, mr. anderson"]));
    try {
        Game.Init();
    } catch(err) {
        console.error("ERROR: " + err.message);
    }
});