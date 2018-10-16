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
    this.id = properties.id || "unknown";
    var title = properties.title || "Room";

    this.isUnlocked = false;        //player has discovered this room
    this.allowed = {
        "food bowl": properties.hasFoodStorage || "false",
    };
    this.buildings = {};

    //this.cats = [];                 //section of House.cats that are currently in this room

    //stores
    //this.food = null;

    this.onLoad = properties.onLoad || function() {};

    
    var id = this.id;
    this.tab = $("<div>").attr("id", "room-location_" + this.id)
            .addClass("room-button")
            .text(title).click(function() {
                if(House.canTravel()) {
                    House.travelTo(id);
                }
            });
    this.panel = $("<div>").attr("id", "room_" + this.id).addClass("room");
    $("<div>").addClass("room-status").appendTo(this.panel);
    $("<div>").addClass("room-buttons").appendTo(this.panel);
}
Room.prototype = {
    init: function() {
        if(this.isUnlocked) {
            Logger.warn("Room \"" + this.id + "\" is already unlocked!");
            return;
        }
        this.tab.appendTo("#house-header");
        this.panel.appendTo("#room-slider");
        this.isUnlocked = true;

        this.onLoad();
        this.updateBuildButtons();
        this.updateFood();
    },
    build: function(id) {
        var building = House.Buildings[id];
        var num = this.buildings[id] || 0;

        if(isUndefined(building)) {
            Logger.warn("Tried to build \"" + id + "\" but that doesn't exist!");
            return;
        }

        if(building.maximum <= num) {
            return;
        }

        if(!Game.hasItem(id)) {
            Notifications.notify("not enough " + id);
            return;
        }

        Game.addItem(id, -1);

        if(!House.stores.hasOwnProperty(id)) {
            House.stores[id] = 0;
        }

        if(!this.buildings.hasOwnProperty(id)) {
            this.buildings[id] = 0;
        }
        
        House.stores[id]++;
        this.buildings[id]++;
        Notifications.notify(building.buildMsg);
        building.onBuild(this);
        this.updateBuildButtons();
        House.updateHouse();
    },
    updateBuildButtons: function() {
        var roomButtons = this.panel.find(".room-buttons");
        var buildContainer = new Container(".build-buttons", "build:", roomButtons);
        
        for(var building in House.Buildings) {
            var buildItem = House.Buildings[building];
            var max = this.buildings.hasOwnProperty(building) && this.buildings[building] >= buildItem.maximum;

            if(isUndefined(buildItem.button)) {
                var location = buildContainer.get();
                buildItem.button = new Button({
                    id: this.id + "_build_" + building,
                    text: building,
                    width: "80px",
                    onClick: function() {
                        House.getCurrentRoom().build(building);
                    }
                });

                buildItem.button.get().css("opacity", 0).animate({opacity: 1}, 300, "linear").appendTo(location);
            } else {
                if(max && !buildItem.button.get().hasClass("disabled")) {
                    Notifications.notify(buildItem.maxMsg);
                }
            }

            if(!isUndefined(buildItem.button)) {
                buildItem.button.setDisabled(max);
            }
        }

        if(buildContainer.needsAppend && buildContainer.exists()) {
            buildContainer.create().appendTo(roomButtons);
        }

        this.updateManageButtons();
    },

    updateManageButtons: function() {
        var roomButtons = this.panel.find(".room-buttons");
        var manageContainer = new Container(".manage-buttons", "manage:", roomButtons);

        if(!isUndefined(this.food) && !this.panel.find(".manage_refill-food").length) {
            var location = manageContainer.get();
            var room = this;
            var refillFood = new Button({
                id: this.id + "_manage_refill-food",
                text: "refill food",
                onClick: function() {
                    room.refillFood();
                }
            });
            refillFood.get().addClass("manage_refill-food").css("opacity", 0).animate({opacity: 1}, 300, "linear").appendTo(location);
        }

        if(manageContainer.needsAppend && manageContainer.exists()) {
            manageContainer.create().appendTo(roomButtons);
        }
    },

    updateFood: function() {
        if(isUndefined(this.food)) {
            return;
        }

        var status = this.panel.find(".room-status");
        var foodEl = status.find(".food");
        if(!foodEl.length) {
            foodEl = $("<div>").addClass("food");
            foodEl.appendTo(status);
        }
        foodEl.text("food: " + this.food.level + "/" + this.food.maximum);
    },

    refillFood: function() {
        var foodDifference = this.food.maximum - this.food.level;
        var foodStores = Game.equipment["cat food"] || 0;

        if(foodDifference === 0) {
            Notifications.notify("food bowl already full");
        } else if(foodStores <= 0) {
            Notifications.notify("not enough cat food");
        } else if(foodStores - foodDifference >= 0) {
            Notifications.notify("food bowl refilled");
            Game.equipment["cat food"] -= foodDifference;
            this.food.level = this.food.maximum;
        } else /*if(foodStores - foodDifference) < 0)*/{
            Notifications.notify("not enough food to refill to maximum");
            Game.equipment["cat food"] = 0;
            this.food.level += foodStores;
        }

        this.updateFood();
        Game.updateEquipment();
    },
    update: function() {

    }
    //update status, ability to add/remove properties (has: {food bowl, water bowl, etc.})
    //update build tab
    //update manage tab
};

//not sure if we need this yet
//var Rooms = {};