/* 
 * Cat object that represents a single cat.
 */
function Cat(properties) {
    properties = properties || {};

    this.isFemale = properties.isFemale || chance(0.50);

    //set name
    if(properties.name) {
        this.name = properties.name.toLowerCase();
    } else {
        //construct pool of possible default names based on cat's gender
        var namePool = Cats.DEFAULT_NEUTRAL_NAMES;
        if(this.isFemale) {
            namePool = namePool.concat(Cats.DEFAULT_MALE_NAMES);
        } else {
            namePool = namePool.concat(Cats.DEFAULT_MALE_NAMES);
        }
        this.name = chooseRandom(namePool)
    }

    //ensures cat has unique name if House is active
    if(exists(House.cats)) {
        this.name = Cats.uniqueName(this.name);
    }

    //set breed
    var breedInfo = randomProperty(Cats.BREEDS);

    //set tendencies - 70% to retain each tendency from breed
    if(properties.traits) {
        this.traits = properties.traits;
    } else {
        this.traits = [];
        var tendencies = breedInfo.tendencies;
        for(var i in tendencies) {
            if(chance(0.70)) {
                this.traits.push(tendencies[i]);
            }
        }
    }

    //set weight - WIP

    //set physical properties
    this.color = properties.color || chooseRandom(breedInfo.colors);
    this.coat = properties.coat || chooseRandom(breedInfo.coats);
    this.eyeColor = properties.eyeColor || chooseRandom(breedInfo.eyeColors);

    //sets status
    this.hunger = properties.hunger || randInt(0, 11);
    this.thirst = properties.thirst || randInt(0, 11);
    this.morale = properties.morale || randInt(2, Cats.Morale.MORALES.length)
    this.moralePoints = properties.moralePoints || 50;
    this.energy = properties.energy || randInt(50, Cats.MAX_ENERGY);

    //states
    this.isActive = true;
    this.isSleeping = exists(properties.isSleeping) ? properties.isSleeping : false;
    this.movedRecently = exists(properties.movedRecently) ? properties.movedRecently : false;
    this.consumedRecently = exists(properties.consumedRecently) ? properties.consumedRecently : chance(1 - ((this.hunger + this.thirst) / 2000));
    this.room = properties.room || null;
}

Cat.prototype = {
    //updates cat
    tick: function() {
        var wantsToLeave = false;

        //exit early if cat has just moved rooms
        if(this.movedRecently) {
            this.movedRecently = false;
            return;
        }

        //exit early if cat is busy
        if(!this.isActive) {
            return;
        }

        //chance for cat to leave for no reason
        if(chance(0.005)) {
            wantsToLeave = true;
        }

        //increments energy, hunger, and thirst
        this.energy -= 1;
        this.hunger += 5;
        this.thirst += 6;

        //if cat is out of energy, nap
        if(this.energy <= 0) {
            this.startNap();
            return;
        }

        /* Actions */
        //sounds
        if(chance(0.01)) {
            this.meow();
        } else if(chance(0.01)) {
            this.purr();
        } else if(chance(0.01) && this.morale < 3) {
            this.hiss();
        }

        var roomPath = "house.rooms[" + this.room + "]";
        var food = $SM.get(roomPath + ".food");
        var water = $SM.get(roomPath + ".water");
        var litterBox = $SM.get(roomPath + "[litter box]");

        /* Morale */
        //if cat has eaten recently, increase morale
        if(this.hunger < 300) {
            this.addMorale(300 - Math.floor(this.hunger));
        }

        //if cat has drank recently, increase morale
        if(this.thirst < 300) {
            this.addMorale(300 - Math.floor(this.thirst));
        }

        //lose morale if litter box is smelly
        if(litterBox && litterBox.level >= 6) {
            this.addMorale(5 - this.room.litterBox);
        }

        //food
        if(food && this.hunger >= 300) {
            if(food.level > 0) {
                if(chance(0.35)) {
                    this.eatFood();
                }
            } else {
                if(this.hunger >= 1000 && chance(0.65)) {
                    //wants to look for food in other rooms
                    this.addMorale(500 - this.hunger);
                    wantsToLeave = true;
                } else if(this.hunger >= 600 && chance(0.05)) {
                    this.action("looks at the empty food bowl despondently");
                }
            }
        } else if(this.hunger >= 1000 && chance(0.65)) {
            //wants to look for food in other rooms
            this.addMorale(500 - this.hunger);
            wantsToLeave = true;
        }

        //water
        if(water && this.thirst >= 300) {
            if(water.level > 0) {
                if(chance(0.35)) {
                    this.drinkWater();
                }
            } else {
                if(this.thirst >= 1000 && chance(0.65)) {
                    //wants to look for food in other rooms
                    this.addMorale(500 - this.thirst);
                    wantsToLeave = true;
                } else if(this.thirst >= 600 && chance(0.05)) {
                    this.action("looks at the dry water bowl sadly");
                }
            }
        } else if(this.thirst >= 1000 && chance(0.65)) {
            //wants to look for food in other rooms
            this.addMorale(500 - this.thirst);
            wantsToLeave = true;
        }

        //litter box
        if(this.consumedRecently && chance(0.2)) {
            if(litterBox && chance(0.4)) {
                this.useLitterBox();
            } else {
                if(chance(0.30)) {
                    this.addMorale(-500);
                    wantsToLeave = true;
                }
            }
        }

        //leaves room at end of tick
        if(wantsToLeave) {
            this.movedRecently = true;
            this.leaveRoom();
        }

        this.save();
    },

    /* Event Actions */
    //called when the cat is added to the house
    greeting: function() {
        var message;
        if(this.morale > 3) {
            message = "seems to like this place";
        } else if(this.morale < 3) {
            if(House.cats.length > 1) {
                message = "watches the other cats warily";
            } else {
                message = "doesn't seem impressed";
            }
        } else {
            message = "doesn't seem to mind this place";
        }
        this.action("sniffs around, " + message, true);
    },

    //begins nap
    startNap: function() {
        this.isSleeping = true;
        this.isActive = false;
        var minUntilWakeUp = randInt(1, 5);

        this.action("curls up for a nap");
        var c = this;
        Game.setTimeout(function() {
            c.wakeUp();
        }, minUntilWakeUp * 60 * 1000);
    },

    //ends nap
    wakeUp: function() {
        this.isSleeping = false;
        this.isActive = true;
        this.hunger += randInt(100, 600);
        this.thirst += randInt(100, 600);
        this.action("wakes up");
        this.addMorale(20);
    },

    /* Room Actions */
    //attempts to eat food in current room
    eatFood: function() {
        var foodLevel = this.room.food.level;
        var action;
        
        if(foodLevel - this.hunger <= 0) {
            //not enough food to sate hunger
            this.hunger -= foodLevel;
            this.room.food.level = 0;
            this.addMorale(7);
            action = "scarfs down the last of the kibble";
        } else {
            //sates hunger
            this.room.food.level -= this.hunger;
            this.hunger = 0;
            this.addMorale(10);
            action = "eats some food";
        }

        this.action(action);
        this.room.updateFood();
        this.consumedRecently = true;
    },

    //attempts to drink water in current room
    drinkWater: function() {
        var waterLevel = this.room.water.level;
        var action;

        if(waterLevel - this.thirst <= 0) {
            //not enough water to sate thirst
            this.thirst -= waterLevel;
            this.room.water.level = 0;
            this.addMorale(7);
            c = "drinks the last of the water";
        } else {
            //sates thirst
            this.room.water.level -= this.thirst;
            this.thirst = 0;
            this.addMorale(10);
            action = "drinks some water";
        }

        this.action(action);
        this.room.updateWater();
        this.consumedRecently = true;
    },

    //attempts to use litter box
    useLitterBox: function() {
        this.room.litterBox++;
        this.consumedRecently = false;
        this.room.updateLitterBox();
    },

    //leaves current room and goes into another random room
    leaveRoom: function() {
        var nextRoom;
        var unlockedRooms = $SM.get("house.rooms");

        do {
            nextRoom = randomKey(unlockedRooms);
        }
        while(this.room == nextRoom);

        House.rooms[this.room].removeCat(this);
        House.rooms[nextRoom].addCat(this);
    },

    /* Sounds */
    meow: function() {
        Notifications.notify(this.name + " meows");
    },

    purr: function() {},

    hiss: function() {},

    /* Helper Methods */
    //constructs sound message
    makeSound: function(sound, loudness, softStr, loudStr, target) {
        var intensities = [ " somewhat ", " ", " rather ", " very " ];
        var suffix = loudStr;
        var fullMsg = sound;

        //special case: loudness is out of bounds
        if(loudness < -4 || loudness > 4) {
            this.action("makes a strange sound");
            return;
        }

        //default action
        if(loudness == 0) {
            this.action(sound);
            return;
        }

        if(loudness < 0) {
            suffix = softStr;
        }

        fullMsg = sound + intensities[Math.abs(loudness) - 1] + suffix;

        if(exists(target)) {
            fullMsg += " at " + target;
        }

        this.action(fullMsg);
    },

    //notifies player of cat action if they are in the room
    action: function(action, important, noName) {
        if(!noName) {
            //add name prefix
            action = this.name + " " + action;
        }

        if(isUndefined(this.room) || House.currentRoom == this.room.id || important) {
            //message only shows if player is in the same room unless important == true
            Notifications.notify(action, House, !important);
        }
    },

    //adds morale points and handles changes in morale stage
    addMorale: function(points) {
        this.moralePoints += points;

        if(this.moralePoints >= Cats.Morale.MAX_POINTS) {
            //morale increases
            if(this.morale < Cats.Morale.MORALES.length - 1) {
                //next stage, starts with grace
                this.morale++;
                this.moralePoints = Cats.Morale.GRACE_POINTS;
            } else {
                //max stage
                this.moralePoints = Cats.Morale.MAX_POINTS;
            }
        } else if(this.moralePoints < 0) {
            //morale decreases
            if(this.morale > 0) {
                //previous stage, starts with grace
                this.morale--;
                this.moralePoints = Cats.Morale.MAX_POINTS - Cats.Morale.GRACE_POINTS;
            } else {
                //min stage
                this.moralePoints = 0;
            }
        }
    },

    //returns male/female object based on gender
    genderPronoun: function(maleObj, femaleObj) {
        return this.isFemale ? femaleObj : maleObj;
    },

    //saves entire cat into localStorage
    save: function() {
        $SM.set(Cats.PATH + "[" + this.name + "]", JSON.stringify(this), true);
    },
}

var Cats = {
    PATH: "house.cats",     //path to cats collection

    //default names
    DEFAULT_MALE_NAMES: [ "garfield", "orpheus", "salem", "tom", "azrael", "whiskers", "felix", "oscar", "edgar", "sox", "ollie", "leo", "snickers", "charcoal", "prince", "toby", "mikesch", "buddy", "romeo", "loki", "gavin", "momo", "illia", "theodore", "eliot", "milo", "max", "monty", "zeke" ],
    DEFAULT_FEMALE_NAMES: [ "miso", "lola", "mcgonagall", "tara", "nala", "mistie", "misty", "coco", "tasha", "raven", "valencia", "princess", "cherry", "chloe", "felicia", "olivia", "emma", "belle", "luna", "minerva", "ellie", "athena", "artemis", "poppy", "venus", "calypso", "elise", "kathy", "elizabeth", "hope" ],
    DEFAULT_NEUTRAL_NAMES: [ "lolcat", "sesame", "unagi", "avocado", "mango", "oreo", "swirly", "striped", "alpha", "beta", "gamma", "lucky", "mittens", "angel", "dakota", "ginger", "tippy", "snickers", "fish", "smokey", "muffin", "fuzzy", "nibbles", "chaser" ],
    
    MAX_ENERGY: 200,        //maximum energy a cat can have

    //breed info
    BREEDS: {
        "american shorthair": {
            tendencies: [ "quiet", "friendly", "playful", "calm" ],
            colors: [ "black", "blue", "silver", "brown", "tabby" ],
            coats: [ "short", "dense", "hard", "lustrous" ],
            eyeColors: [ "blue", "copper", "green", "gold", "hazel" ],
            size: "medium",
            weight: {
                m: [11, 15],
                f: [8, 12]
            },
            lifespan: [15, 20]
        },
    },

    Morale: {
        MORALES: [ "depressed", "very unhappy", "unhappy", "indifferent", "content", "happy", "very happy" ],
        MAX_POINTS: 100,
        GRACE_POINTS: 20,
        
        //get morale name from number
        fromInt: function(value) {
            if(value < 0) {
                return this.MORALES[0];
            }
    
            if(value >= this.MORALES.length) {
                return this.MORALES[this.MORALES.length - 1];
            }
    
            return this.MORALES[value];
        }
    },

    /* Helper Methods */
    uniqueName: function(catName) {
        var ordinal = 1;
        var uniqueName = catName;
        var catList = House.cats.map(function(cat) {
            return cat.name;
        });

        while(itemInList(catList, uniqueName, true)) {
            ordinal++;
            uniqueName = catName + " " + romanize(ordinal);
        }

        return uniqueName;
    },
}