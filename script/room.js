function Room(properties) {
    this.id = properties.id || "unknown";
    var title = properties.title || "Room";

    this.isUnlocked = false;
    this.hasFoodStorage = false;
    this.hasWaterStorage = false;
    //this.cats = [];

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
    },
    updateFood: function() {

    },
    update: function() {

    }
    //update status, ability to add/remove properties (has: {food bowl, water bowl, etc.})
    //update build tab
    //update manage tab
};

//not sure if we need this yet
//var Rooms = {};