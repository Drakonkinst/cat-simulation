/*
 * Room class that represents a room within House. It is its own
 * self-contained panel that shares inventories with other rooms
 * in the House, but is also has its own independent variables.
 * 
 * properties: 
 * - String id: id of the room, same as key in House.rooms
 * - String title: title of room, shown in the House navigation
 * - Function onLoad: runs when room is unlocked
 * */
function Room(properties) {
    this.id = properties.id || "unknown";   //room id
    var title = properties.title || "Room";

    this.isUnlocked = false;                //player has discovered this room
    
    /*this.allowed = {
        "food bowl": properties.hasFoodStorage || "false",
    };*/
    this.buildings = {};

    this.cats = [];                 //section of House.cats that are currently in this room

    //stores
    this.food = null;
    this.water = null;
    this.lightsOn = true;

    this.onLoad = properties.onLoad || function() {};

    
    //create location in header
    var id = this.id;
    this.tab = $("<div>").attr("id", "room-location_" + this.id)
            .addClass("room-button")
            .text(title).click(function() {
                if(House.canTravel()) {
                    House.travelTo(id);
                }
            });
    
    //create panel element
    this.panel = $("<div>").attr("id", "room_" + this.id).addClass("room");

    var roomStatus = $("<div>").addClass("room-status").appendTo(this.panel);
    var upperStatus = $("<div>").addClass("room-upper-status").appendTo(roomStatus);
    $("<div>").addClass("food-status").appendTo(upperStatus);
    $("<div>").addClass("water-status").appendTo(upperStatus);
    $("<div>").addClass("litter-box-status").appendTo(upperStatus);
    $("<div>").addClass("cat-list-container").append($("<span>").text("cats:")).append($("<span>").addClass("cat-list")).css("opacity", 0).appendTo(roomStatus);

    var roomButtons = $("<div>").addClass("room-buttons").appendTo(this.panel);
    $("<div>").addClass("manage-buttons").attr("data-legend", "manage:").css("opacity", 0)
        .append($("<div>").addClass(this.id + "_refill-food_container"))
        .append($("<div>").addClass(this.id + "_refill-water_container"))
        .append($("<div>").addClass(this.id + "_clean-litter-box_container"))
        .append($("<div>").addClass(this.id + "_toggle-light_container")).appendTo(roomButtons);
    
}
Room.prototype = {
    init: function() {
        //exit early if this room has already been unlocked
        if(this.isUnlocked) {
            Logger.warn("Room \"" + this.id + "\" is already unlocked!");
            return;
        }

        //make elements visible
        this.tab.appendTo("#house-header");
        this.panel.appendTo("#room-slider");
        this.isUnlocked = true;

        //update
        this.onLoad();
        this.updateBuildButtons();
        this.updateFood();
    },

    tick: function() {
        for(var k in this.cats) {
            this.cats[k].tick(this);
        }
    },

    addCat: function(cat) {
        cat.room = this;
        this.cats.push(cat);
        var catList = this.panel.find(".cat-list");
        var catListContainer = this.panel.find(".cat-list-container");

        if(catListContainer.css("opacity") == 0) {
            catListContainer.animate({opacity: 1}, 200, "linear");
        }

        var catIcon = $("<span>").addClass("cat-icon").text("@");
        var nameTooltip = new Tooltip("bottom right").append($("<div>").text(cat.name));
        nameTooltip.appendTo(catIcon);
        catList.append($("<span>").attr("id", "cat-"+cat.name).addClass("cat-icon-container").append(catIcon).css("opacity", 0).animate({opacity: 1}, 200, "linear"));
    },

    removeCat: function(cat) {
        this.cats.splice(this.cats.indexOf(cat), 1);
        var catIconContainer = this.panel.find($("#cat-" + cat.name));
        if(catIconContainer.length) {
            //smooth sliding animation later? only needed for removal
            catIconContainer.animate({opacity: 0}, 200, "linear", function() {
                this.remove();
            })
        }
    },

    //places a building in this room
    build: function(id) {
        var building = House.Buildings[id];
        var num = this.buildings[id] || 0;

        //building must be defined
        if(isUndefined(building)) {
            Logger.warn("Tried to build \"" + id + "\" but that doesn't exist!");
            return;
        }

        //exit early if there are already max buildings
        if(building.maximum <= num) {
            return;
        }

        //exit early if not enough resources
        if(!Game.hasItem(id)) {
            Notifications.notify("not enough " + id);
            return;
        }

        //initialize & increment values
        Game.addItem(id, -1);
        if(!House.stores.hasOwnProperty(id)) {
            House.stores[id] = 0;
        }
        if(!this.buildings.hasOwnProperty(id)) {
            this.buildings[id] = 0;
        }
        House.stores[id]++;
        this.buildings[id]++;

        //update & initialize
        Notifications.notify(building.buildMsg);
        building.onBuild(this);
        this.updateBuildButtons();
        House.updateHouse();
    },

    //updates build section (left side)
    updateBuildButtons: function() {
        var roomButtons = this.panel.find(".room-buttons");
        var buildContainer = new Container(".build-buttons", "build:", roomButtons);
        var location = buildContainer.get();
        
        for(var building in House.Buildings) {
            var buildItem = House.Buildings[building];
            var max = this.buildings.hasOwnProperty(building) && this.buildings[building] >= buildItem.maximum;
            var buildButton = Buttons.getButton(this.id + "_build_" + building);
            

            if(isUndefined(buildButton) && Game.hasItem(building)) {
                //create build button if one doesn't exist
                //oh closure, I hate you
                (function(roomName, building) {
                    buildButton = new Button({
                        id: roomName + "_build_" + building,
                        text: building,
                        width: "80px",
                        onClick: function() {
                            House.getCurrentRoom().build(building);
                        }
                    });
                })(this.id, building);
                //do this in order? prevItem system?
                
                buildButton.get().css("opacity", 0).animate({opacity: 1}, 200, "linear").appendTo(location);
            } else {
                //notify if max buildings is reached
                if(max && !buildButton.get().hasClass("disabled") && !isUndefined(buildItem.maxMsg)) {
                    Notifications.notify(buildItem.maxMsg);
                }
            }

            //update disabled state based on max
            if(!isUndefined(buildButton)) {
                buildButton.setDisabled(max);
            }
        }

        //initialize build container
        if(buildContainer.needsAppend && buildContainer.exists()) {
            buildContainer.create().appendTo(roomButtons);
        }

        //update manage buttons
        this.updateManageButtons();
    },

    //updates manage section (middle)
    updateManageButtons: function() {
        var location = this.panel.find(".manage-buttons");
        var room = this;
        var needsAppend = false;

        //refill food
        if(!isUndefined(this.food) && isUndefined(Buttons.getButton(this.id + "_refill-food"))) {
            needsAppend = true;
            var foodButton = new Button({
                id: this.id + "_refill-food",
                text: "refill food",
                cooldown: 4000,
                onClick: function() {
                    return room.refillFood();
                }
            });
            foodButton.get().css("opacity", 0).animate({opacity: 1}, 200, "linear").appendTo(location.find("." + this.id + "_refill-food_container"));
        }

        //refill water
        if(!isUndefined(this.water) && isUndefined(Buttons.getButton(this.id + "_refill-water"))) {
            needsAppend = true;
            var waterButton = new Button({
                id: this.id + "_refill-water",
                text: "refill water",
                cooldown: 4000,
                onClick: function() {
                    return room.refillWater();
                }
            });
            waterButton.get().css("opacity", 0).animate({opacity: 1}, 200, "linear").appendTo(location.find("." + this.id + "_refill-water_container"));
        }
        
        //clear litter box
        if(!isUndefined(this.litterBox) && isUndefined(Buttons.getButton(this.id + "_clean-litter-box"))) {
            needsAppend = true;
            var litterBoxButton = new Button({
                id: this.id + "_clean-litter-box",
                text: "clean litter box",
                cooldown: 4000,
                onClick: function() {
                    return room.cleanLitterBox();
                }
            });
            litterBoxButton.get().css("opacity", 0).animate({opacity: 1}, 200, "linear").appendTo(location.find("." + this.id + "_clean-litter-box_container"));
        }

        //light switch
        if(World.day > 1 && isUndefined(Buttons.getButton(this.id + "_light-toggle"))) {
            needsAppend = true;
            var lightButton = new Button({
                id: this.id + "_light-toggle",
                text: "lights off",
                //cooldown + setText() appears to be bugged
                onClick: function() {
                    room.toggleLight();
                }
            });
            lightButton.get().css("opacity", 0).animate({opacity: 1}, 200, "linear").appendTo(location.find("." + this.id + "_toggle-light_container"));
        }

        if(needsAppend) {
            location.animate({opacity: 1}, 200, "linear");
        }
    },

    //updates food status
    updateFood: function() {
        //exit early if this room doesn't support food
        if(isUndefined(this.food)) {
            return;
        }

        var foodStatus = this.panel.find(".food-status");

        if(!foodStatus.is(":visible")) {
            foodStatus.css("display", "inline-block").animate({opacity: 1}, 200, "linear");
        }

        //update text
        foodStatus.text("food: " + this.food.level + "/" + this.food.maximum);
    },

    //updates water status
    updateWater: function() {
        //exit early if this room doesn't support water
        if(isUndefined(this.water)) {
            return;
        }

        var waterStatus = this.panel.find(".water-status");
        
        if(!waterStatus.is(":visible")) {
            waterStatus.css("display", "inline-block").animate({opacity: 1}, 200, "linear");
        }

        //update text
        waterStatus.text("water: " + this.water.level + "/" + this.water.maximum);
    },

    //updates litter box
    updateLitterBox: function() {
        //exit early if this room doesn't support litter box
        if(isUndefined(this.litterBox)) {
            return;
        }

        var litterBoxStatus = this.panel.find(".litter-box-status");

        if(!litterBoxStatus.is(":visible")) {
            litterBoxStatus.css("display", "inline-block").animate({opacity: 1}, 200, "linear");
        }

        //update text
        litterBoxStatus.text("litter box: " + this.litterBox);
    },

    //toggles light switch
    toggleLight: function() {
        var lightButton = Buttons.getButton(this.id + "_manage_light-toggle");

        //TODO - setText() appears to kill the animation for buttons with a cooldown,
        //might want to look into it
        if(this.lightsOn) {
            lightButton.setText("lights on");
        } else {
            lightButton.setText("lights off");
        }
        
        //toggle variable
        this.lightsOn = !this.lightsOn;
    },

    //attempts to refill food
    refillFood: function() {
        var foodDifference = this.food.maximum - this.food.level;
        var foodStores = Game.equipment["cat food"] || 0;

        if(foodDifference === 0) {
            //bowl is already full, exit early
            Notifications.notify("bowl's already full of kibble");
            return false;
        } else if(foodStores <= 0) {
            //not enough cat food, exit early
            Notifications.notify("not enough cat food");
            return false;
        } else if(foodStores - foodDifference >= 0) {
            //successfully topped off
            Notifications.notify("food topped off");
            Game.equipment["cat food"] -= foodDifference;
            this.food.level = this.food.maximum;
        } else /*if(foodStores - foodDifference) < 0)*/{
            //not enough to fill bowl completely
            Notifications.notify("filled the bowl with the last of the stock");
            Game.equipment["cat food"] = 0;
            this.food.level += foodStores;
        }

        //updates
        this.updateFood();
        Game.updateEquipment();
        return true;
    },

    //attempt to refill water
    refillWater: function() {
        var waterDifference = this.water.maximum - this.water.level;
        var waterStores = Game.equipment["water"] || 0;

        if(waterDifference === 0) {
            //bowl is already full, exit early
            Notifications.notify("bowl's already near overflowing");
            return false;
        } else if(waterStores <= 0) {
            //not enough water, exit early
            Notifications.notify("not enough water");
            return false;
        } else if(waterStores - waterDifference >= 0) {
            //successfully topped off
            Notifications.notify("water replenished");
            Game.equipment["water"] -= waterDifference;
            this.water.level = this.water.maximum;
        } else /*if(waterStores - waterDifference) < 0)*/{
            //not enough to fill bowl completely
            Notifications.notify("filled the bowl with the last of the stock");
            Game.equipment["water"] = 0;
            this.water.level += waterStores;
        }

        //updates
        this.updateWater();
        Game.updateEquipment();
        return true;
    },

    //attempt to clean litter box
    cleanLitterBox: function() {

    }
};