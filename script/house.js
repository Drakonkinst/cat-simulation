/*
 * House module that represent's the player's house.
 * */
var House = {
    name: "house",

    newCats: null,  //cats that have not been introduced to the house
    cats: null,     //all cats in the house

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
                            nextScene: {"stuff": 1}
                        },
                        "ignore": {
                            text: "do nothing",
                            nextScene: "end"
                        }
                    }
                },
                "stuff": {
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

                }
            }
        }
    ],

    addCat: function(cat) {
        cat = cat || new Cat();
        if(Game.activeModule == House) {
            Notifications.notify(cat.name + " sniffs around, seems to like this place");
        } else {
            House.newCats.push(cat);
        }
        
        House.cats.push(cat);
        House.updateTitle();
        Logger.log(House.cats);
    },

    onArrival: function(diff) {
        House.updateTitle();

        for(var i = 0; i < House.newCats.length; i++) {
            var catName = House.newCats[i].name;
            var currentPos = i;
            Game.setTimeout(function() {
                if(Game.activeModule == House) {
                    Notifications.notify(catName + " sniffs around, seems to like this place");
                    House.newCats.splice(currentPos, 1);
                }
            }, randNum(500, 1000));
        }

        //Game.moveStoresView(null, diff);
    },

    /*hasCatName: function(name) {
        for(var cat in House.cats) {
            if(cat.name == name) {
                return true;
            }
        }
        return false;
    },*/

    updateTitle: function() {
        var title;
        if(this.cats.length === 0) {
            title = "A Lonely House";
        } else if(this.cats.length > 0) {
            title = "A Humble Home";
        }
        $("#location_house").text(title);
    },

    Init: function() {
        this.tab = Game.addLocation("house", "A Lonely House", House);
        this.panel = $("<div>").attr("id", "house-panel").addClass("location").appendTo("#location-slider");
        Game.updateSlider();

        House.newCats = [new Cat()];
        House.cats = House.newCats.slice();

        $("<div>").attr("id", "equipment-container").prependTo("#house-panel");
    }
}