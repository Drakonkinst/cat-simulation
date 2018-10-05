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
    version: {
        alpha: true,  //alpha phase, mutually exclusive with beta
        beta: false,  //beta phase, mutually exclusive with alpha
        major:    0,  //increments for every major update
        minor:    0,  //increments for every minor update, resets on every major update
        release:  5,  //increments for every stable build pushed (successful bugfixes, etc.), resets on every minor update
        build:    8,  //increments for every unstable build tested, resets on every release
    },

    //cheaty options! no non-cheaty options yet.
    options: {
        debug: false,            //print debug messages
        instantButtons: false,  //ignore button cooldowns completely
        fastButtons: false,     //speed up button cooldowns greatly
        fastEvents: false,      //scheduled tasks happen much more quickly
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
        return prefix + " v" + Game.version.major + "." + Game.version.minor + Game.version.release + Game.version.build;
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

        //update to new module
        Game.activeModule = module;
        module.onArrival(diff);
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
    //move this to world and create an ItemPool like Events (array to loop through. returns item info)
    Items: {
        "cat": {
            type: "special"
        },
        //"money": {
            //type: "resource"
        //}
    }, 

    perks: {
        "heartless": {
            desc: "cat morale decreases much faster",
            notify: "learned to turn that beating heart to stone"
        }
    },

    //keymap of all values in player's inventory
    //this is really bad design...something to work on.
    //character/player object? probably unnecessary
    equipment: null,

    addItem: function(name, value) {
        if(!(name in Game.equipment)) {
            Game.equipment[name] = 0;
        }
        Game.equipment[name] += value;
        Game.updateEquipment();
    },

    hasItem: function(name, value) {
        value = value || 1;
        return Game.equipment.hasOwnProperty(name) && Game.equipment[name] >= value;
    },

    addPerk: function(name) {
        if(isUndefined(Game.perks[name])) {
            Logger.warn("Tried to add perk \"" + name + "\" that doesn't exist!");
            return;
        }

        if(Game.hasPerk(name)) {
            return;
        }

        Game.perks[name].owned = true;
        Notifications.notify(Game.perks[name].notify);
        Game.updatePerks();
    },

    hasPerk: function(name) {
        return Game.perks[name].owned;
    },

    //updates equipment element from Game.equipment
    updateEquipment: function() {
        var equipment = new Section("equipment", "you have");
        var inventory = new Section("inventory");
        var special = new Section("special");
        var house = new Section("house", "house");
        var stores = new Section("stores");
        var buildings = new Section("buildings");

        var locations = {
            "resource": stores,
            "building": buildings,
            "special": special,
            "inventory": inventory,
            "default": inventory
        };

        for(var item in Game.equipment) {
            var type = Game.Items[item] ? Game.Items[item].type : "default";
            var location = locations[type].get();
            Game.updateRow(item, Game.equipment[item], location);
        }

        if(inventory.needsAppend && inventory.exists()) {
            inventory.create().appendTo(equipment.get());
        }

        if(special.needsAppend && special.exists()) {
            special.create().prependTo(equipment.get());
        }

        if(equipment.needsAppend && equipment.get().find(".row").length > 0) {
            equipment.create().prependTo("#equipment-container");
        }

        if(stores.needsAppend && stores.exists()) {
            stores.create().appendTo(house.get());
        }

        if(buildings.needsAppend && buildings) {
            buildings.create().prependTo(house.get());
        }

        if(house.needsAppend && $("#house-panel").length > 0 && house.get().find(".row").length > 0) {
            house.create().prependTo("#house-panel");
        }
    },

    updatePerks: function() {
        var perks = new Section("perks", "perks");

        for(var perk in Game.perks) {
            if(Game.hasPerk(perk)) {
                Game.updateRow(perk, 1, perks.get(), true, new Tooltip().append($("<div>").text(Game.perks[perk].desc)));
            }
        }

        if(perks.needsAppend && perks.get().children().length > 0) {
            perks.create().appendTo("#equipment-container");
        }
    },

    updateRow: function(name, value, location, hideQuantity, tooltip) {
        var id = "row_" + name.replace(/\s+/g, "-");
        var row = $("#" + id, location);

        if(!row.length) {
            row = $("<div>").attr("id", id).addClass("row")
                .append($("<div>").addClass("row_key"))
                .append($("<div>").addClass("row_val"))
                .append($("<div>").addClass("clear"));
            var prevItem = null;
            location.children().each(function() {
                var child = $(this);
                //alphabetize
                if(child.children(".row_key").text() < name) {
                    prevItem = child.attr("id");
                }
            });
            if(isUndefined(prevItem)) {
                row.prependTo(location);
            } else {
                row.insertAfter(location.find("#" + prevItem));
            }
        }

        if(value === 0) {
            //at some point, might want to keep 0 for other inventories
            row.remove();
        } else {
            $("#" + row.attr("id"), location).find(".row_key").text(name);
            if(value > 1 || !hideQuantity) {
                $("#" + row.attr("id"), location).find(".row_val").text(value);
            }
        }

        if(!isUndefined(tooltip)) {
            tooltip.appendTo(row);
        }
    },

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
        }
    },

    //when a key is released
    keyUp: function(e) {
        Game.pressed = false;

        /* Default keyUp Handler */
        function arrowUp() {
            if(Game.tabNavigation && Game.activeModule == House) {
                if(!isUndefined(typeof House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) - 1])) {
                    var prevRoom = House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) - 1];
                    House.travelTo(prevRoom);
                }
            }
        }

        function arrowDown() {
            if(Game.tabNavigation && Game.activeModule == House) {
                if(!isUndefined(typeof House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) + 1])) {
                    var nextRoom = House.unlockedRooms[House.unlockedRooms.indexOf(House.currentRoom) + 1];
                    House.travelTo(nextRoom);
                }
            }
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
        $("#main").empty();

        $("<div>").attr("id", "day-notify").appendTo("#wrapper");

        $("<div>").attr("id", "equipment-container").appendTo("#main");
        $("<div>").attr("id", "header").appendTo("#main");
        $("<div>").attr("id", "location-slider").appendTo("#main");
        

        $("<div>")
            .attr("id", "footer")
            .append($("<span>").addClass("version menu-btn").text(Game.getVersionString()).click(function() { window.open("https://github.com/Drakonkinst/cat-simulation"); }))
            //.append($("<span>").addClass("version menu-btn").text("github.").click(function() { window.open("https://github.com/Drakonkinst/cat-simulation"); }))//
            //.append($("<span>").addClass("menu-btn").text("discord."))
            //.append($("<span>").addClass("menu-btn").text("save."))
            .appendTo("body");

       
        //$("<div>").attr("id", "panel_room").appendTo("#main");

        //$("<div>").attr("id", "equipment-container").appendTo("#main")

        Game.disableSelection();

        //register listeners
        $("body").off("keydown").keydown(Game.keyDown);
        $("body").off("keyup").keyup(Game.keyUp);

        Game.equipment = {};

        for(var perk in Game.perks) {
            Game.perks[perk].owned = false;
        }
        
        Notifications.Init();
        World.Init();

        //modules
        Events.Init();
        House.Init();
        //Outside.Init();
    },

    /* ====== Prepare For Launch! ===== */
    Launch: function() {
        Logger.log("Game initialized!");

        Game.Init();
        Game.travelTo(House);
        
        //Game.addItem("lettuce", 16);
        //Game.addItem("money", 9001);
        //House.addCat();
        //Game.addPerk("heartless");
    
        Logger.log("Version is " + Game.getVersionString());
    }
}

$(document).ready(function() {
    //Let's do this!

    console.log("> " + chooseRandom(["remember: hacked cats are bad luck", "oh, hello there!", "cheating in some kibble or just checking for bugs?", "whazzup?"]));
    
    try {
        Game.Launch();
    } catch(err) {
        console.error("ERROR: " + err.message);
    }
});
