function Room(properties) {
    this.id = properties.id || "unknown";
    var title = properties.title || "Room";

    this.isUnlocked = false;        //player has discovered this room
    //this.hasFoodStorage = true;    //room can store food (bowl, feeder)
    //this.hasWaterStorage = false;   //room can store water (bowl, fountain)
    //this.buildings = {};
    //this.cats = [];                 //section of House.cats that are currently in this room

    //stores
    //this.food = null;
    this.food = {
        level: 5,
        maximum: 10
    };

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

        if(isUndefined(building)) {
            Logger.warn("Tried to build \"" + id + "\" but that doesn't exist!");
            return;
        }

        building.onBuild(this);
        this.updateBuildButtons();
    },
    updateBuildButtons: function() {
        var buildSection = new Section(".build-buttons", "build:");
        
        for(var building in House.Buildings) {
            var buildItem = House.Buildings[building];
            var max = Game.hasItem(building, buildItem.maximum);

            if(isUndefined(buildItem.button)) {
                var location = buildSection.get();
                //LEFT OFF HERE
            }
        }
        /*var buySection = new Section("buy-buttons", "buy:");

        for(var item in Outside.BuyItems) {
            var buyItem = Outside.BuyItems[item];
            var max = Game.hasItem(item, buyItem.maximum);

            if(isUndefined(buyItem.button)) {
                if(Outside.unlocked(item)) {
                    var location = buySection.get();
                    var cost = buyItem.cost()
                    var tooltip = new Tooltip(location.children().length > 10 ? "top left" : "bottom left");

                    for(var id in cost) {
                        tooltip.append($("<div>").addClass("row_key").text(id)).append($("<div>").addClass("row_val").text(cost[id]));
                    }

                    buyItem.button = new Button({
                        id: "buy_" + item,
                        text: item,
                        width: "80px",
                        tooltip: tooltip,
                        onClick: function() {
                            Outside.buy(item);
                        }
                    });

                    buyItem.button.get().css("opacity", 0).animate({opacity: 1}, 300, "linear").appendTo(location);

                    Notifications.notify(buyItem.availableMsg);
                }
            } else {
                //TODO - refresh the tooltip - for items that change cost based on context
                if(max && !buyItem.button.get().hasClass("disabled")) {
                    Notifications.notify(buyItem.maxMsg);
                }
            }
            if(!isUndefined(buyItem.button)) {
                buyItem.button.setDisabled(max);
            }
        }

        if(buySection.needsAppend && buySection.exists()) {
            buySection.create().appendTo("#outside-panel");
        }*/
    },
    updateFood: function() {
        if(isUndefined(this.food)) {
            return;
        }

        var status = this.panel.find(".room-status");
        var foodEl = status.find(".food");
        if(!foodEl.length) {
            foodEl = $("<div>").addClass(".food");
            foodEl.appendTo(status);
        }
        foodEl.text("food: " + this.food.level + "/" + this.food.maximum);
    },
    update: function() {

    }
    //update status, ability to add/remove properties (has: {food bowl, water bowl, etc.})
    //update build tab
    //update manage tab
};

//not sure if we need this yet
//var Rooms = {};