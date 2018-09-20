/*
 *  Visual design heavily based on A Dark Room
 *  by Doublespeak Games. (https://adarkroom.doublespeakgames.com)
 *  - influenced by Cookie Clicker by Orteil
 *    (https://orteil.dashnet.org/cookieclicker)
 *  - and Candy Box 2 by aniwey (https://candybox2.github.io)
 *  - and Drowning in Problems by Notch (http://game.notch.net/drowning/)
 *  - inspired by my old AP Comp Sci EC final semester
 *    project, this time in JavaScript (and better!)
 *  ~ by Drakonkinst 2018
 * TODO: rewrite this
 */

var Game = {
    //holds all version details
    version: {
        alpha: true,  //whether in alpha phase, mutually exclusive with beta
        beta: false,  //whether in beta phase, mutually exclusive with alpha
        major:    0,  //increments for every major update
        minor:    0,  //increments for every minor update, resets on every major update
        release:  1,  //increments for every stable build pushed (successful bugfixes, etc.), resets on every minor update
        build:    1,  //increments for every unstable build tested, resets on every release
    },

    //holds all available options, some cheaty some not
    options: {
        debug: true,           //print debug messages
        instantButtons: false,  //ignore button cooldowns completely
        fastButtons: false,    //speed up button cooldowns greatly
    },

    //parses Game.version into a readable string
    getVersionString: function() {
        var prefix = Game.version.alpha ? "alpha" : Game.version.beta ? "beta" : "";
        Logger.warnIf(Game.version.alpha && Game.version.beta, "This build is marked as both alpha and beta!");
        return prefix + " v" + Game.version.major + "." + Game.version.minor + "." + Game.version.release + "." + Game.version.build;
    },

    //returns current time - is this needed?
    now: function() {
        return new Date().getTime();
    },

    /* ====== FRAME HANDLING ====== */
    modules: {},

    activeModule: null,

    travelTo: function(module) {
        if(Game.activeModule == module) {
            return;
        }

        Game.activeModule = module;
    },

    registerModule: function(name, module) {
        this.modules[name] = module;
    },

    /* ====== EQUIPMENT ====== */
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

    /* ====== HEADER STUFF ===== */
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


    /* ====== GAME INITIALIZATION ===== */
    Init: function() {
        /* LAYOUT */
        $("#main").html("");

        $("<div>").attr("id", "header").appendTo("#main");
        $("<div>").attr("id", "panel_room").appendTo("#main");

        Notifications.Init();
        $("<div>").attr("id", "equipment-container").prependTo("#panel_room")

        $("<div>")
            .attr("id", "footer")
            .append($("<span>").addClass("version").text(Game.getVersionString()).click(function() { Logger.log("Github link coming beta!"); }))
            .appendTo("body");

        this.registerModule("room", Room);
    },

    /* ====== PREPARE FOR LAUNCH! ===== */
    Launch: function() {
        Logger.log("Game initialized!");

        Game.activeModule = Room;
        Game.Init();
        Game.updateEquipment();

        //test button!
        new Button({
            id: "test",
            text: "press me plz",
            cooldown: 4000,
            tooltip: new Tooltip().append($("<div>").text("pretty please!")),
        }).getElement().appendTo("#panel_room");

        Logger.log("Version is " + Game.getVersionString());
    }
}

$(document).ready(function() {
    //Let's do this!
    Game.Launch();
});