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
        release:  3,  //increments for every stable build pushed (successful bugfixes, etc.), resets on every minor update
        build:    4,  //increments for every unstable build tested, resets on every release
    },

    //cheaty options! no non-cheaty options yet.
    options: {
        debug: true,            //print debug messages
        instantButtons: false,  //ignore button cooldowns completely
        fastButtons: false,     //speed up button cooldowns greatly
        fastEvents: false,       //scheduled tasks happen much more quickly
    },

    //parses Game.version into a legible string
    getVersionString: function() {
        var prefix = Game.version.alpha ? "alpha" : Game.version.beta ? "beta" : "";
        Logger.warnIf(Game.version.alpha && Game.version.beta, "This build is marked as both alpha and beta!");
        return prefix + " v" + Game.version.major + "." + Game.version.minor + "." + Game.version.release + "." + Game.version.build;
    },

    /*
    //returns current time - not used yet
    now: function() {
        return new Date().getTime();
    },
    */

    //setTimeout: function(callback, timeout, skipDouble)

    /* ====== Modules ====== */
    activeModule: null,

    travelTo: function(module) {
        if(Game.activeModule == module) {
            return;
        }

        $(".headerButton").removeClass("selected");
        module.tab.addClass("selected");

        Game.activeModule = module;
        module.onArrival();
        //module.onArrival(diff);
        Notifications.printQueue(module);
    },

    updateSlider: function() {
        var slider = $("#location-slider");
        slider.width((slider.children().length * 700) + "px");
    },

    /* ====== Header ====== */
    canTravel: function() {
        return $("#header").find(".header-button").length > 1;
    },

    addLocation: function(id, text, module) {
        return $("<div>").attr("id", "location_" + id)
            .addClass("header-button")
            .text(text).click(function() {
                if(Game.canTravel()) {
                    Game.travelTo(module);
                }  
            }).appendTo($("#header"));
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
            var rowName = "row_" + key.replace(/\s+/g, "-")
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

    /* ====== Browser Checks ===== */
    //thanks, doublespeakgames!
    browserValid: function() {
        return (location.search.indexOf("ignorebrowser=true") >= 0 || (isUndefined(Storage) && !oldIE));
    },

    isMobile: function() {
        return (location.search.indexOf("ignorebrowser=true") < 0 && /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent));
    },

    /* ====== Document Modifiers? ====== */
    disableSelection: function() {
        document.onselectstart = Game.eventNullifier; // this is for IE
		document.onmousedown = Game.eventNullifier; // this is for the rest
    },

    enableSelection: function() {
        document.onselectstart = function() {
            return true;
        };
        document.onmousedown = function() {
            return true;
        };
    },

    eventNullifier: function(e) {
        $(e.target).hasClass("menu-btn");
    },

    /* ====== Game Initialization ====== */
    Init: function() {
        if(!Game.browserValid()) {
            //window.location = //set to browser warning window
        }

        if(Game.isMobile()) {
            //window.location = //set to mobile warning window
        }

        Game.disableSelection();

        //Game.loadGame()

        /* LAYOUT */
        $("#main").html("");

        $("<div>").attr("id", "header").appendTo("#main");
        $("<div>").attr("id", "location-slider").appendTo("#main");

        $("<div>")
            .attr("id", "footer")
            .append($("<span>").addClass("version").addClass("menu-btn").text(Game.getVersionString()).click(function() { window.open("https://github.com/Drakonkinst/cat-simulation"); }))
            .appendTo("body");

       
        //$("<div>").attr("id", "panel_room").appendTo("#main");

        $("<div>").attr("id", "equipment-container").appendTo("#main")
        
        Notifications.Init();
        World.Init();

        //modules
        Events.Init();
        House.Init();
    },

    /* ====== Prepare For Launch! ===== */
    Launch: function() {
        Logger.log("Game initialized!");

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

        Logger.log("Version is " + Game.getVersionString());
    }
}

$(document).ready(function() {
    //Let's do this!
    Game.Launch();
});
