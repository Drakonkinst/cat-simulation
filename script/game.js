/*
 * All this code is copyright Drakonkinst & ctZN4, 2018.
 * - visual design based on A Dark Room by Doublespeak Games (https://adarkroom.doublespeakgames.com)
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
  * Game engine, central object that runs
  * the world and gives the program wings
  * */
var Game = {
    /* ====== Variables and Presets ====== */
    version: {
        alpha: true,  //alpha phase, mutually exclusive with beta
        beta: false,  //beta phase, mutually exclusive with alpha
        major:    0,  //increments for every major update
        minor:    0,  //increments for every minor update, resets on every major update
        release:  4,  //increments for every stable build pushed (successful bugfixes, etc.), resets on every minor update
        build:    3,  //increments for every unstable build tested, resets on every release
    },

    //cheaty options! no non-cheaty options yet.
    options: {
        debug: true,            //print debug messages
        instantButtons: false,  //ignore button cooldowns completely
        fastButtons: false,     //speed up button cooldowns greatly
        fastEvents: false,       //scheduled tasks happen much more quickly
    },
    
    //game states
    pressed: false,         //key is being pressed
    keyLock: false,         //keys do not function
    //buttonLock: false,      //buttons do not do anything when clicked
    tabNavigation: true,    //tab navigation does not function

    //parses Game.version into a legible string
    getVersionString: function() {
        var prefix = Game.version.alpha ? "alpha" : Game.version.beta ? "beta" : "";
        Logger.warnIf(Game.version.alpha && Game.version.beta, "This build is marked as both alpha and beta!");
        return prefix + " v" + Game.version.major + "." + Game.version.minor + "." + Game.version.release + "." + Game.version.build;
    },

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
    activeModule: null,     //module object of the current location

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

        //TODO - manage equipment
        var equipment = $("#equipment-container");

        //update to new module
        Game.activeModule = module;
        module.onArrival();
        //module.onArrival(diff);
        Notifications.printQueue(module);
    },

    //adds a location tied to a module to the header
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
    //keymap of all values in player's inventory
    equipment: {},

    //updates equipment element from Game.equipment
    updateEquipment: function() {
        if(isEmpty(Game.equipment)) {
            //clears element if player has no equipment
            $("#equipment-container").html("");
            return;
        }
        
        var equipment = $("#equipment");

        //creates equipment element if one does not exist
        if(!equipment.length) {
            equipment = $("<div>").attr({
                "id": "equipment",
                "data-legend": "you have"
            }).css("opacity", 0);
            equipment.prependTo("#equipment-container");
            equipment.animate({opacity: 1}, 300, "linear");
        }

        //appends and/or updates each item in Game.equipment
        for(var key in Game.equipment) {
            var rowName = "row_" + key.replace(/\s+/g, "-");
            var el = $("#" + rowName);

            //creates row for item if one does not exist
            if(!el.length || el === undefined) {
                el = $("<div>").attr("id", rowName).addClass("row");
                el.append($("<div>").addClass("row_key"))
                  .append($("<div>").addClass("row_val"))
                  .append($("<div>").addClass("clear"))
                  .appendTo("#equipment");
            }

            if(Game.equipment[key] === 0) {
                //at some point, might want to keep 0 for other inventories
                el.remove();
                delete Game.equipment[key];
            } else {
                $("#" + rowName).find(".row_key").text(key);

                //display number if more than one
                if(Game.equipment[key] > 1) {
                    $("#" + rowName).find(".row_val").text(Game.equipment[key]);
                }
            }
        }
    },

    /* TODO
    moveStoresView: function() {

    },
    */

    /* ====== Browser Checks ====== */
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
            if(typeof Game.activeModule.keyDown === "function") {
                //also calls module's keyDown function
                Game.activeModule.keyDown(e);
            }
        }
        
    },

    //when a key is released
    keyUp: function(e) {
        Game.pressed = false;

        if(typeof Game.activeModule.keyUp === "function") {
            //calls module's keyUp function
            Game.activeModule.keyUp(e);
            return;
        }

        /* Default keyUp Handler */
        function arrowUp() {
            //Logger.log("up!");
        }

        function arrowDown() {
            //Logger.log("down!");
        }
        
        function arrowLeft() {
            if(Game.tabNavigation) {
                //TODO - is there a better way to do this?
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

    /* ====== Document Modifiers? ====== */
    disableSelection: function() {
        function eventNullifier(e) {
            return $(e.target).hasClass("menu-btn");
        }
        
        document.onselectstart = eventNullifier; //IE support
		document.onmousedown = eventNullifier;   //everything else
    },

    enableSelection: function() {
        function eventPassThrough() {
            return true;
        }
        
        document.onselectstart = eventPassThrough;
        document.onmousedown = eventPassThrough;
    },

    /* ====== Game Initialization ====== */
    Init: function() {
        /* Check Browser */
        if(!Game.browserValid()) {
            //window.location = //set to browser warning window
        }

        if(Game.isMobile()) {
            //window.location = //set to mobile warning window
        }

        //Game.loadGame();

        /* Layout */
        $("#main").html("");

        //$("<div>").attr("id", "save-notify").text("saved.").appendTo("#wrapper");
        //this.save();

        //$("<div>").attr("id", "day-notify").text("day 1.").appendTo("#wrapper");
        //$("#day-notify").css("opacity", 1).animate({opacity: 0}, 1500, "linear");

        $("<div>").attr("id", "header").appendTo("#main");
        $("<div>").attr("id", "location-slider").appendTo("#main");

        $("<div>")
            .attr("id", "footer")
            .append($("<span>").addClass("version").addClass("menu-btn").text(Game.getVersionString()).click(function() { window.open("https://github.com/Drakonkinst/cat-simulation"); }))
            .appendTo("body");

       
        //$("<div>").attr("id", "panel_room").appendTo("#main");

        //$("<div>").attr("id", "equipment-container").appendTo("#main")

        Game.disableSelection();

        //register listeners
        $("body").off("keydown").keydown(Game.keyDown);
        $("body").off("keyup").keyup(Game.keyUp);
        
        Notifications.Init();
        World.Init();

        //modules
        Events.Init();
        House.Init();
        Outside.Init();
    },

    /* ====== Prepare For Launch! ===== */
    Launch: function() {
        Logger.log("Game initialized!");
        console.log("> hacked cats simply just aren't the same");

        Game.Init();
        Game.travelTo(House);
        Game.updateEquipment();

        //test button!
        new Button({
            id: "test",
            text: "open door",
            cooldown: 8000,
            tooltip: new Tooltip().append($("<div>").text("someone's knocking.")),
            onClick: function() {
                if(World.events[0].isAvailable()) {
                    Events.startEvent(World.events[0]);
                } else {
                    Notifications.notify("probably shouldn't open the door right now");
                    return false;
                }
            }
        }).appendTo("#house-panel");

        /*for(var i = 0; i < 10; i++) {
            var c = new Cat();  
            c.meow();
        }*/
        $("<div>").text("Coming soon!").appendTo("#outside-panel");

        Logger.log("Version is " + Game.getVersionString());
    }
}

$(document).ready(function() {
    //Let's do this!
    Game.Launch();
});
