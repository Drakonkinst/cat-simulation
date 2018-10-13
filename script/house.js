/*
 * House module that represent's the player's house.
 * */
var House = {
    name: "house",

    newCats: null,  //cats that have not been introduced to the house
    cats: null,     //all cats in the house
    currentRoom: null,
    unlockedRooms: [],

    rooms: {},

    events: [
        {   //Noises Outside - gain stuff
            title: "Noises",
            isAvailable: function() {
                return Game.activeModule == House;
            },
            scenes: {
                "start": {
                    text: [
                        "scratching noises can be heard through the door.",
                        "something's out there."
                    ],
                    notification: "something's scratching outside",
                    blink: true,
                    buttons: {
                        "investigate": {
                            text: "investigate",
                            nextScene: {"bread": 1, "treats": 1}
                        },
                        "ignore": {
                            text: "do nothing",
                            nextScene: "end"
                        }
                    }
                },
                "bread": {
                    text: [
                        "a basket full of warm bread sits on the doorstep.",
                        "the streets are silent."
                    ],
                    buttons: {
                        "leave": {
                            text: "close the door",
                            nextScene: "end"
                        }
                    }

                },
                "treats": {
                    text: [
                        "a handful of cat treats sits on the doorstep, wrapped in colorful ribbons.",
                        "the streets are silent."
                    ],
                    onLoad: function() {
                        Game.addItem("cat treat", 3);
                    },
                    buttons: {
                        "leave": {
                            text: "close the door",
                            nextScene: "end"
                        }
                    }
                }
            }
        }
    ],

    onArrival: function(transitionDiff) {
        House.updateTitle();

        for(var i = 0; i < House.newCats.length; i++) {
            //self-invoking function so the timeout will use consecutive values
            (function() {
                var cat = House.newCats[i];
                Game.setTimeout(function() {
                    if(Game.activeModule == House) {
                        Notifications.notify(cat.name + " sniffs around, seems to like this place");
                        House.newCats.splice(House.newCats.indexOf(cat), 1);
                    }
                }, randNum(500, 1000));
            })();
        }

        Game.moveEquipmentView($("#house"), transitionDiff);
    },

    addCat: function(cat) {
        cat = cat || new Cat();
        
        if(Game.activeModule == House) {
            Notifications.notify(cat.name + " sniffs around, seems to like this place");
        } else {
            House.newCats.push(cat);
        }
        
        House.cats.push(cat);
        House.updateTitle();
        Game.addItem("cat", 1);

        if(!$("#outside-panel").length && isUndefined(House._initOutside)) {
            House._initOutside = Game.setTimeout(function() {
                Notifications.notify("should head into town, see if there's anything useful");
                Outside.Init();
            }, randNum(5, 7) * 1000);
        }
    },

    updateTitle: function() {
        var title;
        if(this.cats.length === 0) {
            title = "A Quiet Room";
        } else if(this.cats.length === 1) {
            title = "A Lonely House";
        } else if(this.cats.length < 5) {
            title = "A Humble Abode";
        } else if(this.cats.length < 10) {
            title = "A Modest Home";
        } else if(this.cats.length < 15) {
            title = "A Raucous Mansion";
        }
        $("#location_house").text(title);
    },

    /* Room Navigation */
    //returns whether there are enough locations to travel
    canTravel: function() {
        return $("#house-header").find(".room-button").length > 1;
    },

    //transitions from one module to another
    travelTo: function(room) {
        var tab = $("#room-location_" + room);
        var panel = $("#room_" + room);
        if(room == House.currentRoom || tab.length === 0) {
            return;
        }


        $(".room-button").removeClass("selected");
        tab.addClass("selected");

        var slider = $("#room-slider");
        var panelIndex = $(".room").index(panel);
        var currentIndex = House.currentRoom ? $(".room").index($("#room_" + House.currentRoom)) : 1;
        var diff = Math.abs(panelIndex - currentIndex);
        slider.animate({top: -(panelIndex * 624) + "px"}, 300 * diff);

        House.currentRoom = room;
    },

    unlockRoom: function(id) {
        var room = House.rooms[id];

        if(isUndefined(room)) {
            Logger.warn("Tried to unlock room \"" + id + "\" that does not exist!");
            return;
        }

        room.init();
        House.unlockedRooms.push(id);
    },

    updateSlider: function() {
        var slider = $("#room-slider");
        slider.width((slider.children().length * 700) + "px");
    },

    Init: function() {
        this.tab = Game.addLocation("house", "A Lonely House", House);
        this.panel = $("<div>").attr("id", "house-panel").addClass("location").appendTo("#location-slider");

        //creates a mini-content tab inside of the house panel, including its own subheader bar
        $("<div>").attr("id", "house-header").appendTo(this.panel);
        $("<div>").attr("id", "house-content").appendTo(this.panel);
        $("<div>").attr("id", "room-slider").appendTo("#house-content");
        
        this.rooms = {
            "bedroom": new Room({
                id: "bedroom",
                title: "Bedroom",
                onLoad: function() {
                    new Button({
                        id: "sleep",
                        text: "go to sleep",
                        cooldown: 90000,
                        onClick: World.sleep
                    }).appendTo(this.panel);
                }
            }),
            "hallway": new Room({
                id: "hallway",
                title: "Hallway",
                onLoad: function() {
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
                    }).appendTo(this.panel);
                }
            }),
            "living-room": new Room({
                id: "living-room",
                title: "Living Room",
                onLoad: function() {}
            }),
            "kitchen": new Room({
                id: "kitchen",
                title: "Kitchen",
                onLoad: function() {}
            }),
            "dining-room": new Room({
                id: "dining-room",
                title: "Dining Room",
                onLoad: function() {}
            })
        };
        
        House.unlockRoom("bedroom", "Bedroom");
        House.unlockRoom("hallway", "Hallway");
        //House.unlockRoom("living-room", "Living Room");
        //House.unlockRoom("kitchen", "Kitchen");
        //House.unlockRoom("dining-room", "Dining Room");
        Game.updateSlider();
        House.travelTo("hallway");

        House.newCats = [];
        House.cats = []; //House.newCats.slice();

        //$("<div>").text("Coming soon!").prependTo(".room");
    }
}