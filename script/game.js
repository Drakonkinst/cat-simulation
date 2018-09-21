/*
 * All this code is copyright Drakonkinst & (add name here), 2018.
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
        release:  1,  //increments for every stable build pushed (successful bugfixes, etc.), resets on every minor update
        build:    1,  //increments for every unstable build tested, resets on every release
    },

    //cheaty options! no non-cheaty options yet.
    options: {
        debug: true,            //print debug messages
        instantButtons: false,  //ignore button cooldowns completely
        fastButtons: false,     //speed up button cooldowns greatly
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
    //keymap of a module's name and its associated module object
    modules: {},

    activeModule: null,

    travelTo: function(moduleName) {
        var module = Game.getModule(moduleName);
        if(Game.activeModule == module) {
            return;
        }

        Game.activeModule = module;
        //module.onArrival(diff);
        Notifications.printQueue(moduleName);
    },

    registerModule: function(module) {
        var name = module.name;
        if(name && !(name in this.modules)) {
            this.modules[name] = module;
        } else {
            Logger.warn("Tried to register a module but it failed!");
        }
    },

    getModule: function(name) {
        return this.modules[name];
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

    /* ====== Header ====== */
    canTravel: function() {
        return $("#header").find(".headerButton").length > 1;
    },

    addLocation: function(id, text, module) {
        return $("<div>").attr("id", "location_" + id)
            .addClass("headerButton")
            .text(text).click(function() {
                if(Game.canTravel()) {
                    Game.travelTo(module);
                }  
            }).appendTo($("#header"));
    },


    /* ====== Game Initialization ====== */
    Init: function() {
        /* LAYOUT */
        $("#main").html("");

        $("<div>").attr("id", "header").appendTo("#main");
        $("<div>").attr("id", "panel_room").appendTo("#main");

        Notifications.Init();
        $("<div>").attr("id", "equipment-container").prependTo("#panel_room")

        $("<div>")
            .attr("id", "footer")
            .append($("<span>").addClass("version").text(Game.getVersionString()).click(function() { window.open("https://github.com/Drakonkinst/cat-simulation"); }))
            .appendTo("body");

        this.registerModule(Room);

        Events.Init();
        World.Init();
    },

    /* ====== Prepare For Launch! ===== */
    Launch: function() {
        Logger.log("Game initialized!");

        Game.activeModule = Room;
        Game.Init();
        Game.updateEquipment();

        //test button!
        new Button({
            id: "test",
            text: "open door",
            cooldown: 2000,
            tooltip: new Tooltip().append($("<div>").text("someone's knocking.")),
            onClick: function() {
                Notifications.notify(null, "an event's about to happen, get ready!")
            },
            onFinish: function() {
                Events.startEvent(Room.events[0]);
            }
        }).appendTo("#panel_room");

        Logger.log("Version is " + Game.getVersionString());
    }
}

$(document).ready(function() {
    //Let's do this!
    Game.Launch();
});