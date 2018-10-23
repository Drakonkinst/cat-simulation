/*
 * Cat class that represents a single cat.
 * 
 * properties (all optional, will default to random)
 * - String name: name of cat
 * - String breed: name of cat's breed
 * - boolean isFemale: whether the cat is female (used for gender)
 * - number weight: weight of cat in pounds
 * */
function Cat(properties) {
    properties = properties || {};
    this.isFemale = properties.isFemale || chance(0.5);

    var namePool = (this.isFemale ? Cats.DEFAULT_FEMALE_NAMES : Cats.DEFAULT_MALE_NAMES).concat(Cats.DEFAULT_NEUTRAL_NAMES);
    this.name = properties.name || chooseRandom(namePool);

    if(!isUndefined(House.cats)) {
        //ensures that the cat has a unique name if House is active
        this.name = Cats.uniqueName(this.name);
    }

    this.breed = properties.breed || chooseRandom(keysAsList(Cats.BREEDS));
    
    //gets breed info
    var breed = Cats.BREEDS[this.breed];

    //70% chance to retain each tendency
    this.traits = [];
    for(var i in breed.tendencies) {
        if(chance(0.7)) {
            this.traits.push(breed.tendencies[i]);
        }
    }

    //set weight based on gender and breed
    var weightRange = this.isFemale ? breed.weight.f : breed.weight.m;
    this.weight = properties.weight || randInt(weightRange[0], weightRange[1]);
    
    //set color, coat, and eyeColor based on breed
    this.color = chooseRandom(breed.colors);
    this.coat = chooseRandom(breed.coats);
    this.eyeColor = chooseRandom(breed.eyeColors);

    //sets random hunger upon spawn
    this.hunger = randInt(0, 11);
    this.thirst = randInt(0, 11);
    this.morale = randInt(0, Cats.MoraleEnum.morales.length);
    this.moralePoints = 50;
    //points until cat wants to leave room?
    this.energy = Cats.MAX_ENERGY;

    this.isSleeping = false;
    this.wantsToLeave = false;
    this.consumedRecently = chance(1 - ((this.hunger + this.thirst) / 20));
    this.room = null;

    var cat = this;
    this.wakeUpTask = new Task("[" + cat.name + " - wake up]", function() {
        cat.wakeUp();
    }, 1, 5);
}
Cat.prototype = {
    //updates the cat
    tick: function() {
        if(this.wantsToLeave) {
            Logger.log("Skipped " + this.name)
            this.wantsToLeave = false;
            return;
        }

        if(this.isSleeping) {
            //exit early if the cat is sleeping
            return;
        }

        //chance for cat to leave the room for no reason
        if(chance(0.005)) {
            this.wantsToLeave = true;
        }

        //increments energy and hunger
        this.energy -= 0.1;
        this.hunger += 0.05;

        //if cat has eaten recently, increase morale
        if(this.hunger < 3) {
            this.addMorale(3 - Math.floor(this.hunger));
        }

        if(this.energy <= 0) {
            //starts cat napping
            this.startSleep();
            return;
        }

        //sounds
        if(chance(0.01)) {
            this.meow();
        } else if(chance(0.01)) {
            this.purr();
        } else if(chance(0.01) && this.morale < 3) {
            this.hiss();
        }

        //food
        if(!isUndefined(this.room.food)) {
            if(this.room.food.level > 0 && this.hunger >= 3) {
                if(chance(0.35)) {
                    this.eatFood();
                }
            } else if(this.hunger >= 6 && chance(0.05)) {
                this.action("looks at the empty food bowl despondently");
                this.addMorale(-5);
            }
        } else if(this.hunger >= 10 && chance(0.65)) {
            //wants to look for food in other rooms
            this.addMorale(5 - Math.floor(this.hunger));
            this.wantsToLeave = true;
        }

        //add starving/dehyrated? >= 20 - this SHOULD be announced

        //water
        if(!isUndefined(this.room.water)) {
            if(this.room.water.level > 0 && this.thirst >= 3) {
                if(chance(0.35)) {
                    this.drinkWater();
                }
            } else if(this.thirst >= 6 && chance(0.05)) {
                this.action("looks at the dry water bowl sadly");
                this.addMorale(-5);
            }
        } else if(this.thirst >= 10 && chance(0.65)) {
            //wants to look for water in other rooms
            this.addMorale(5 - Math.floor(this.thirst));
            this.wantsToLeave = true;
        }

        if(this.consumedRecently && chance(0.2)) {
            this.action("needs to use the litterbox");
            this.consumedRecently = false;
        }

        if(this.wantsToLeave) {
            this.leaveRoom();
            var cat = this;
            Game.setTimeout(function() {
                cat.wantsToLeave = false;
            }, 0);
        }
    },

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
        Notifications.notify(this.name + " sniffs around, " + message, House);
    },

    //called upon the start of a new day
    nextDay: function() {
        if(this.morale == 0 && chance(0.9)) {
            this.runAway();
        }
    },

    //removes cat from house
    runAway: function() {
        this.room.removeCat(this);
        House.cats.splice(House.cats.indexOf(this), 1);
        Game.addItem("cat", -1);
        Events.startEvent({
            title: "A Disappearance",
            scenes: {
                "start": {
                    text: [
                        this.name + " disappeared in the night.",
                        //how did the cat get out? OR if other cats, then say they are sad or something lol
                        "doesn't seem likely " + this.genderPronoun("he", "she") + "'ll return."
                    ],
                    notification: this.name + " ran away last night",
                    blink: true,
                    buttons: {
                        "continue": {
                            text: "move on",
                            nextScene: "end"
                        }
                    }
                }
            }
        });
    },
    
    /* Sounds */
    meow: function(volume) {
        var loudness = volume || randInt(-4, 5);
        this.makeSound("meows", loudness, "quietly", "loudly");
        //do repetitive meowing here
    },

    purr: function(volume) {
        var loudness = volume || randInt(-4, 5);
        this.makeSound("purrs", loudness, "softly", "loudly");
    },

    hiss: function(volume) {
        var loudness = volume || randInt(-4, 5);
        this.makeSound("hisses", loudness, "quietly", "loudly");
    },

    //constructs sound message given arguments
    makeSound: function(sound, loudness, softStr, loudStr) {
        //hisses/meows AT "you" or another cat, code later
        const intensities = [" somewhat ", " ", " rather ", " very "];
        var suffix = loudStr;

        if(loudness < -4 || loudness > 4) {
            this.action("makes a strange sound");
            return;
        }

        if(loudness == 0) {
            this.action(sound);
            return;
        }
        
        if(loudness < 0) {
            suffix = softStr;
        }

        this.action(sound + intensities[Math.abs(loudness) - 1] + suffix);
    },

    /* Normal Actions */
    //attempts to eat food in the current room
    eatFood: function() {
        var foodLevel = this.room.food.level;
        var hungerInt = Math.floor(this.hunger);
        
        if(foodLevel - hungerInt <= 0) {
            this.hunger -= foodLevel;
            this.room.food.level = 0;
            this.addMorale(7);
            this.action("scarfs down the last of the kibble");
        } else {
            this.room.food.level -= hungerInt;
            this.hunger -= hungerInt;
            this.addMorale(10);
            this.action("eats some food");
        }

        this.room.updateFood();
        this.addEnergy(3);
        this.consumedRecently = true;
    },

    //attemps to drink water in current room
    drinkWater: function() {
        var waterLevel = this.room.water.level;
        var thirstInt = Math.floor(this.thirst);

        if(waterLevel - thirstInt <= 0) {
            this.thirst -= waterLevel;
            this.room.water.level = 0;
            this.addMorale(7);
            this.action("drinks the last of the water");
        } else {
            this.room.water.level -= thirstInt;
            this.thirst -= thirstInt;
            this.addMorale(10);
            this.action("drinks some water");
        }

        this.room.updateWater();
        this.addEnergy(2);
        this.consumedRecently = true;
    },

    //begins a nap
    startSleep: function() {
        this.isSleeping = true;
        this.action("curls up for a nap");
        this.wakeUpTask.scheduleNext();
    },

    //called at the end of a nap
    wakeUp: function() {
        this.isSleeping = false;
        this.energy = Cats.MAX_ENERGY;
        this.hunger += randInt(1, 6);
        this.action("wakes up");
        this.addMorale(20);
    },

    //leaves current room and goes into a random other room
    leaveRoom: function() {
        var nextRoomId;

        do {
            nextRoomId = chooseRandom(House.unlockedRooms);
        }
        while(this.room.id == nextRoomId);

        var nextRoom = House.rooms[nextRoomId];
        
        this.room.removeCat(this);
        nextRoom.addCat(this);
    },

    /* Helpers */
    //adds morale points, handles changes in morale stage
    addMorale: function(points) {
        this.moralePoints += points;

        if(this.moralePoints >= 100) {
            if(this.morale < Cats.MoraleEnum.morales.length - 1) {
                //next stage, give 20 points of grace
                this.morale++;
                this.moralePoints = 20;
            } else {
                //already at max, stay there
                this.moralePoints = 100;
            }
        } else if(this.moralePoints < 0) {
            if(this.morale > 0) {
                //previous stage, give 80 points of grace
                this.morale--;
                this.moralePoints = 80;
            } else {
                //already at min, stay there
                this.moralePoints = 0;
            }
        }
    },

    //adds energy, makes sure neither limit is reached
    addEnergy: function(points) {
        if(this.energy + points > Cats.MAX_ENERGY) {
            //max
            this.energy = Cats.MAX_ENERGY;
        } else if(this.energy + points >= 0) {
            //min
            this.energy += points;
        }
    },

    //plays a notification if the player is in the room
    action: function(actionMsg, noName) {
        if(!noName) {
            actionMsg = this.name + " " + actionMsg;
        }

        if(House.currentRoom == this.room.id) {
            //message only plays if player is in the House AND in the same room
            Notifications.notify(actionMsg, House, true);
        }
    },

    //returns male or female string based on gender
    genderPronoun: function(male, female) {
        return this.isFemale ? female : male;
    }
};

var Cats = {
    MAX_ENERGY: 20,
    DEFAULT_MALE_NAMES: [ "Garfield", "Salem", "Tom", "Azrael", "Whiskers", "Felix", "Oscar", "Edgar", "Sox", "Ollie", "Leo", "Snickers", "Charcoal", "Prince", "Toby", "Mikesch", "Buddy", "Romeo", "Loki", "Gavin", "Momo", "Illia", "Theodore", "Eliot", "Milo", "Max", "Monty" ],
    DEFAULT_FEMALE_NAMES: [ "Miso", "Tara", "Nala", "Mistie", "Misty", "Coco", "Tasha", "Raven", "Valencia", "Princess", "Cherry", "Chloe", "Felicia", "Olivia", "Emma", "Belle", "Luna", "Minerva", "Ellie", "Athena", "Artemis", "Poppy", "Venus", "Calypso"],
    DEFAULT_NEUTRAL_NAMES: [ "Lolcat", "Sesame", "Unagi", "Avocado", "Mango", "Oreo", "Swirly", "Striped", "Alpha", "Beta", "Gamma", "Lucky", "Mittens", "Angel", "Dakota", "Ginger", "Tippy", "Snickers", "Fish", "Smokey", "Muffin", "Fuzzy", "Nibbles", "Chaser" ],
    //http://www.catbreedslist.com/all-cat-breeds/
    //secondary source - https://www.hillspet.com/cat-care/cat-breeds/
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
        "burmese": {
            tendencies: [ "playful", "friendly", "curious" ],
            colors: [ "blue", "platinum", "champagne", "sable", "lilac", "fawn", "red", "cream", "chocolate", "cinnamon" ],
            coats: [ "short", "silky", "glossy", "satin" ],
            eyeColors: [ "gold", "yellow" ],
            size: "medium",
            weight: {
                m: [8, 12],
                f: [6, 10]
            },
            lifespan: [15, 16]
        },
        "scottish fold": {
            tendencies: [ "playful", "friendly" ],
            colors: [ "white", "blue", "black", "red", "cream", "silver" ],
            coats: [ "short", "dense", "plush", "soft" ],
            eyeColors: [ "blue", "green", "gold", "bicolored" ],
            size: "medium",
            weight: {
                m: [7, 11],
                f: [5, 8]
            },
            lifespan: [11, 14]
        },
        "sphinx": {
            tendencies: [ "curious", "friendly", "quiet" ],
            colors: [ "white", "black", "blue", "red", "cream", "chocolate", "lavender" ],
            coats: [ "hairless", "fine" ],
            eyeColors: [ "blue", "red", "green", "black", "pink", "grey" ],
            size: "medium",
            weight: {
                m: [8, 12],
                f: [6, 9]
            },
            lifespan: [12, 14]
        }
    },

    MoraleEnum: {
        morales: ["depressed", "very unhappy", "unhappy", "indifferent", "happy", "very happy", "content"],
        fromInt: function(value) {
			if(value < 0) {
                return this.morales[0];
            }
            if(value >= this.morales.length) {
                return this.morales[this.morales.length - 1];
            }
            return this.morales[value];
		}
    },

    uniqueName: function(catName) {
        var ordinal = 1;
        var uniqueName = catName;
        var catList = House.cats.map(cat => cat.name);

        while(itemInList(catList, uniqueName, true)) {
            ordinal++;
            uniqueName = catName + " " + romanize(ordinal);
        }
        return uniqueName;
    }
};