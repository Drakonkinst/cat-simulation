/*
 * House module that represents the player's house.
 * */
var House = {
    name: "house",      //module id

    cats: null,         //all cats in the house

    currentRoom: null,  //name of current room
    unlockedRooms: [],  //ordered list of room names
    rooms: {},          //keymap of Room ids and objects

    stores: {},         //house inventory
    electric: null,

    //info table of all buildings
    Buildings: {
        "food bowl": {
            //should space be based on single buildings or overall? maybe
            //assign weight to each structure and have each room cap..
            //for later.
            buildMsg: "shiny bowls, needs food though",
            maxMsg: "no more space for more bowls",
            maximum: 5,
            onBuild: function(room) {
                if(isUndefined(room.food)) {
                    room.food = {
                        level: 0,
                        maximum: 0
                    };
                }
                room.food.maximum += 10;
                room.updateFood();
            }
        },
        "water bowl": {
            buildMsg: "new water bowl, but it looks dry",
            maxMsg: "that's enough water bowls for now",
            maximum: 5,
            onBuild: function(room) {
                if(isUndefined(room.water)) {
                    room.water = {
                        level: 0,
                        maximum: 0
                    };
                }
                room.water.maximum += 10;
                room.updateWater();
            }
        },
        "litter box": {
            buildMsg: "litter box installed",
            maximum: 1,
            onBuild: function(room) {
                if(isUndefined(room.litterBox)) {
                    room.litterBox = 0;
                    //should this have level/max?
                }
                room.updateLitterBox();
            }
        }
    },

    //house-related events
    events: [
        {   //Noises Outside - gain stuff
            title: "Noises",
            isAvailable: function() {
                return Game.activeModule == House && !["rain", "storm", "lightning", "hail"].includes(World.currentWeather);
            },
            scenes: {
                "start": {
                    text: [
                        "knocking sounds can be heard through the door.",
                        "someone's out there."
                    ],
                    notification: "someone's knocking outside",
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
                    onLoad: function() {
                        $SM.addItem("bread", 5);
                    },
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
                        $SM.addItem("cat treat", 3);
                    },
                    buttons: {
                        "leave": {
                            text: "go back inside",
                            nextScene: "end"
                        }
                    }
                }
            }
        },
        {
            //A Disturbance - Lost Stuff
            title: "A Disturbance",
            isAvailable: function() {
                return House.cats.length > 0 && $SM.hasItem("cat food") && Game.activeModule == House;  //later should require pantry
            },
            scenes: {
                "start": {
                    text: [
                        "scratching noises can be heard in the pantry.",
                        "something's in there."
                    ],
                    notification: "something's in the pantry",
                    blink: true,
                    buttons: {
                        "investigate": {
                            text: "investigate",
                            nextScene: {"rats": 1, "cat": 2}
                        },
                        "ignore": {
                            text: "do nothing",
                            nextScene: "end"
                        }
                    }
                },
                "cat": function() {
                    var cat = chooseRandom(House.cats);
                    return {
                        text: [
                            cat.name + " pokes out " + cat.genderPronoun("his", "her") + " head from behind a tub of food.",
                            "nothing to see here."
                        ],
                        buttons: {
                            "leave": {
                                text: "leave",
                                nextScene: "end"
                            }
                        }
                    };
                },
                "rats": {
                    text: [
                        //"spilled kibble is strewn across the floor.",
                        "a corner of one of the food bags is covered in tiny nibbles.",
                        "some of the food is missing."
                    ],
                    onLoad: function() {
                        $SM.addItem("cat food", -10);
                    },
                    buttons: {
                        "leave": {
                            text: "leave",
                            nextScene: "end"
                        }
                    }
                }
            }
        }
    ],

    //returns Room object of player's current location
    getCurrentRoom: function() {
        return House.rooms[House.currentRoom];
    },

    //called when player travels to this location
    onArrival: function(transitionDiff, newDay) {
        House.updateTitle();

        for(var i = 0; i < House.cats.length; i++) {
            var cat = House.cats[i];

            if(cat.morale == 0 && chance(0.9) && !newDay) {
                cat.runAway(false);
            } else {
                if(cat.hunger > 15) {
                    cat.action("is starving", true);
                }
    
                if(cat.thirst > 15) {
                    cat.action("is dehydrated", true);
                }
            }
        }
        //moves main inventory to accomodate for house inventory display
        Game.moveEquipmentView($("#house"), transitionDiff);
    },

    //updates house inventory
    updateHouse: function() {
        //build containers
        var house = new Container("#house", "house");
        var stores = new Container("#stores");
        var buildings = new Container("#buildings");
        var equipment = $("#equipment-container");

        //TODO - needs to include items that exist in equipment but are not built in room yet
        //update all items in house.stores
        for(var item in $SM.get("house.stores")) {
            var location = stores;
            if(!isUndefined(House.Buildings[item])) {
                location = buildings;
            }
            
            //section could use some reworking
            var text = $SM.get("house.stores[" + item + "]");
            var maxValue = text + $SM.get("character.equipment[" + item + "]");
            if(!isUndefined(maxValue)) {
                text += "/" + maxValue;
            }

            Game.updateRow(item, text, location.get());
        }

        //initialize containers
        if(stores.needsAppend && stores.exists()) {
            stores.create().appendTo(house.get());
        }

        if(buildings.needsAppend && buildings.exists()) {
            buildings.create().prependTo(house.get());
        }

        if(house.needsAppend && $("#house-panel").length > 0 && house.get().find(".row").length > 0) {
            house.create().prependTo("#house-panel");
        }

        //update main inventory
        if($("#house").length && Game.activeModule == this) {
            equipment.css("top", (house.get().height() + 66) + "px");
        }
    },

    //adds a cat to the House
    addCat: function(cat) {
        //creates a random cat if none is specified
        cat = cat || new Cat();
        
        cat.greeting();
        
        //adds cat and updates everything
        House.cats.push(cat);
        House.updateTitle();
        House.rooms["hallway"].addCat(cat);
        $SM.addItem("cat", 1);

        //triggers Outside panel after a delay - this will be changed eventually
        if(!$("#outside-panel").length && isUndefined(House._initOutside)) {
            House._initOutside = Game.setTimeout(function() {
                Notifications.notify("should head into town, see if there's anything useful");
                Outside.Init();
            }, randNum(5, 7) * 1000);
        }
    },

    usePower: function(value) {
        if(this.electric - value <= 0 & this.electric > 0) {
            this.electric = 0;
            this.powerOutage();
        } else {
            this.electric -= value;
        }
    },

    powerOutage: function() {
        for(var k in House.rooms) {
            var room = House.rooms[k];
            var lightButton = Buttons.getButton(room.id + "_light-toggle");
            var buttonExists = !isUndefined(lightButton);

            if(room.lightsOn) {
                room.lightsOn = false;
                if(buttonExists) {
                    lightButton.setText("lights on");
                }
            }
            if(buttonExists) {
                lightButton.setDisabled(true);
            }
        }

        Events.startEvent({
            title: "Power Outage",
            scenes: {
                "start": {
                    text: [
                        "with a loud buzz, the lights flicker out",
                        "the darkness is absolute"
                    ],
                    notification: "the power has gone out",
                    blink: true,
                    buttons: {
                        "continue": {
                            text: "continue",
                            nextScene: "end",
                        }
                    }
                }
            }
        });
    },

    powerReturn: function() {
        Notifications.notify("the power is back on");
        for(var k in House.rooms) {
            var room = House.rooms[k];
            var lightButton = Buttons.getButton(room.id + "_light-toggle"); 

            if(!isUndefined(lightButton)) {
                lightButton.setDisabled(false);
            }
        }
    },

    //updates title based on number of cats in house
    updateTitle: function() {
        var title = $("#location_house").text();
        if(this.cats.length === 0) {
            title = "A Dreary Room";
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

    //adds room to house header
    unlockRoom: function(id) {
        var room = House.rooms[id];

        //room must be defined
        if(isUndefined(room)) {
            Logger.warn("Tried to unlock room \"" + id + "\" that does not exist!");
            return;
        }

        room.init();
        House.unlockedRooms.push(id);
    },

    //changes height of slider to match number of room locations
    updateSlider: function() {
        var slider = $("#room-slider");
        slider.width((slider.children().length * 700) + "px");
    },

    tick: function() {
        //var start = Game.now();

        for(var k in House.rooms) {
            House.rooms[k].tick();
        }

        //update rooms so the lights on/off button shows
        //this checks for the same thing like 6 times - not best practice, should fix
        if(House.electric < 70 && isUndefined(Buttons.getButton("bedroom_light-toggle"))) {
            Notifications.notify("probably should start conserving power", House);
            for(var k in House.rooms) {
                House.rooms[k].updateManageButtons();
            }
        }

        //var end = Game.now();
        //Logger.log("Update took " + (end - start) + "ms");
    },

    nextDay: function() {
        if(this.electric == 0) {
            this.powerReturn();
        }
        this.electric = 100;

        for(var k in House.cats) {
            House.cats[k].nextDay();
        }
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
                    var sleepButton = new Button({
                        id: "sleep",
                        text: "go to sleep",
                        cooldown: 120000,
                        onClick: World.sleep
                    }).appendTo(this.panel.find(".room-buttons"));
                    sleepButton.startCooldown();
                }
            }),
            "hallway": new Room({
                id: "hallway",
                title: "Hallway",
                onLoad: function() {
                    new Button({
                        id: "door",
                        text: "open door",
                        cooldown: 300000,
                        tooltip: new Tooltip().addText("someone's here."),
                        onClick: function() {
                            if(World.events[0].isAvailable()) {
                                Events.startEvent(World.events[0]);
                            } else {
                                Notifications.notify("probably shouldn't open the door right now");
                                return false;
                            }
                        },
                        onFinish: function() {
                            Notifications.notify("something's scratching at the door", House)
                        }
                    }).appendTo(this.panel.find(".room-buttons"));
                }
            }),
            "living-room": new Room({
                id: "living-room",
                title: "Living Room",
                onLoad: function() {
                    new Button({
                        id: "tv",
                        text: "watch tv",
                        cooldown: 10000,
                        onClick: function() {
                            Notifications.notify("watched tv");
                        }
                    }).appendTo(this.panel.find(".room-buttons"));
                }
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
        House.unlockRoom("living-room", "Living Room");
        //House.unlockRoom("kitchen", "Kitchen");
        //House.unlockRoom("dining-room", "Dining Room");
        Game.updateSlider();
        House.travelTo("hallway");

        House.cats = [];
    }
};