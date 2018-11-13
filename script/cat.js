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
    this.traits = properties.traits || [];
    if(this.traits.length == 0) {
        for(var i in breed.tendencies) {
            if(chance(0.7)) {
                this.traits.push(breed.tendencies[i]);
            }
        }
    }
    
    //set weight based on gender and breed
    var weightRange = this.isFemale ? breed.weight.f : breed.weight.m;
    this.weight = properties.weight || randInt(weightRange[0], weightRange[1]);
    
    //set color, coat, and eyeColor based on breed
    this.color = properties.color || chooseRandom(breed.colors);
    this.coat = properties.coat || chooseRandom(breed.coats);
    this.eyeColor = properties.eyeColor || chooseRandom(breed.eyeColors);

    //sets random hunger upon spawn
    this.hunger = properties.hunger || randInt(0, 11);
    this.thirst = properties.thirst || randInt(0, 11);
    this.morale = properties.morale || randInt(2, Cats.MoraleEnum.morales.length);
    this.moralePoints = properties.moralePoints || 50;
    this.energy = properties.energy || Cats.MAX_ENERGY;

    this.isSleeping = isUndefined(properties.isSleeping) ? false : properties.isSleeping;
    this.wantsToLeave = isUndefined(properties.wantsToLeave) ? false : properties.wantsToLeave;
    this.consumedRecently = isUndefined(properties.consumedRecently) ? chance(1 - ((this.hunger + this.thirst) / 20)) : properties.consumedRecently;
    this.room = properties.room || null;

    var cat = this;
    this.wakeUpTask = new Task("[" + cat.name + " - wake up]", function() {
        cat.wakeUp();
    }, 1, 5);
}
Cat.prototype = {
    //updates the cat
    tick: function() {
        if(this.wantsToLeave) {
            this.wantsToLeave = false;
            return;
        }

        if(this.isSleeping || this.isExamining) {
            //exit early if the cat is sleeping or being examined
            return;
        }

        //chance for cat to leave the room for no reason
        if(chance(0.005)) {
            this.wantsToLeave = true;
        }

        //increments energy and hunger
        this.energy -= 0.1;
        this.hunger += 0.05;
        this.thirst += 0.06;

        //if cat has eaten recently, increase morale
        if(this.hunger < 3) {
            this.addMorale(3 - Math.floor(this.hunger));
        }

        if(!isUndefined(this.room.litterBox) && this.room.litterBox >= 6) {
            this.addMorale(5 - this.litterBox);
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
        if(!isUndefined(this.room.food) && this.hunger >= 3) {
            if(this.room.food.level > 0) {
                if(chance(0.35)) {
                    this.eatFood();
                }
            } else {
                if(this.hunger >= 10 && chance(0.65)) {
                    //wants to look for food in other rooms
                    this.addMorale(5 - Math.floor(this.hunger));
                    this.wantsToLeave = true;
                } else if(this.hunger >= 6 && chance(0.05)) {
                    this.action("looks at the empty food bowl despondently");
                }
                
            }
        } else if(this.hunger >= 10 && chance(0.65)) {
            //wants to look for food in other rooms
            this.addMorale(5 - Math.floor(this.hunger));
            this.wantsToLeave = true;
        }

        //water
        if(!isUndefined(this.room.water) && this.thirst >= 3) {
            if(this.room.water.level > 0) {
                if(chance(0.35)) {
                    this.drinkWater();
                }
            } else {
                if(this.thirst >= 10 && chance(0.65)) {
                    //wants to look for water in other rooms
                    this.addMorale(5 - Math.floor(this.thirst));
                    this.wantsToLeave = true;
                } else if(this.thirst >= 6 && chance(0.05)) {
                    this.action("looks at the dry water bowl sadly");
                }
            }
        } else if(this.thirst >= 10 && chance(0.65)) {
            //wants to look for water in other rooms
            this.addMorale(5 - Math.floor(this.thirst));
            this.wantsToLeave = true;
        }

        //litter box
        if(this.consumedRecently && chance(0.2)) {
            if(isUndefined(this.room.litterBox)) {
                if(chance(0.3)) {
                    this.addMorale(-5);
                    this.wantsToLeave = true;
                }
            } else {
                this.useLitterBox();
                this.consumedRecently = false;
            }
        }

        //makes cat leave room at end of tick
        if(this.wantsToLeave) {
            this.leaveRoom();
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
        this.action("sniffs around, " + message, true);
    },

    //called upon the start of a new day
    nextDay: function() {
        if(this.morale == 0 && chance(0.9)) {
            this.runAway(true);
        }
    },

    //removes cat from house
    runAway: function(isNight) {
        this.room.removeCat(this);
        House.cats.splice(House.cats.indexOf(this), 1);
        $SM.addItem("cat", -1);
        var cat = this;

        Events.startEvent({
            title: "A Disappearance",
            getContext: function() {
                var context = {};
                context.name = cat.name;

                if(isNight) {
                    context.text1 = cat.name + " disappeared in the night.";
                    context.text2 = "doesn't seem likely " + this.genderPronoun("he", "she") + "'ll return.";
                    location = " last night";
                } else {
                    context.text1 = cat.name + " has disappeared.";
                    context.text2 = "hopefully " + cat.genderPronoun("he", "she") + "'ll have better luck in the wild.";
                    context.location = "";
                }

                return context;
            },
            scenes: {
                "start": function(c) {
                    return {
                        text: [
                            c.text1,
                            c.text2
                        ],
                        notification: c.name + " ran away" + c.location,
                        blink: true,
                        buttons: {
                            "continue": {
                                text: "move on",
                                nextScene: "end"
                            }
                        }
                    }
                }
            }
        });
    },

    examine: function() {
        var self = this;
        this.isExamining = true;
        var moraleBoostsRemaining = 3;
        Events.startEvent({
            title: this.name,
            scenes: {
                "start": function() {
                    var description, action;
                    if(self.coat == "hairless") {
                        description = self.color + " hairless " + self.genderPronoun("male", "female") + " " + self.breed;
                    } else {
                        description = self.genderPronoun("male", "female") + " " + self.breed + " with " + self.coat + " " + self.color + " fur";
                    }

                    if(self.traits.includes("playful")) {
                        action = "looks up at you inquisitively";
                    } else {
                        action = "meows as you approach"
                    }
                    return {
                        text: [
                            self.name + " is a " + description + ".",
                            self.genderPronoun("he", "she") + " " + action + "."
                        ],
                        buttons: {
                            "pick up": {
                                text: "pick up",
                                nextScene: {"pickUp": 5, "failPickUp": 1}
                                //probabilities can be decided earlier!
                            },
                            "treat": {
                                text: "give treat",
                                available: function() {
                                    return $SM.hasItem("cat treat");
                                },
                                tooltip: new Tooltip().addCost("cat treat", 1),
                                click: function() {
                                    $SM.addItem("cat treat", -1);
                                    self.action("eats a treat");
                                    if(moraleBoostsRemaining > 0) {
                                        self.addMorale(10);
                                        moraleBoostsRemaining--;
                                    }
                                    if(self.morale >= 3) {
                                        self.purr();
                                    }
                                    return true;
                                }
                            },
                            "pet": {
                                text: "pet",
                                click: function() {
                                    if(moraleBoostsRemaining > 0) {
                                        self.addMorale(5);
                                        moraleBoostsRemaining--;
                                    }
                                    if(self.morale >= 3) {
                                        self.purr();
                                    } else {
                                        self.meow();
                                    }
                                }
                            },
                            "done": {
                                text: "done",
                                click: function() {
                                    self.isExamining = false;
                                },
                                nextScene: "end"
                            }
                        }
                    };
                },
                "pickUp": function() {
                    var status = self.genderPronoun("he", "she") + " sits comfortably in your arms";
                    if(self.hunger >= 15) {
                        status = "looks like " + self.genderPronoun("he", "she") + " hasn't eaten in days";
                    } else if(self.hunger >= 10) {
                        status = "probably lighter than " + self.genderPronoun("he", "she") + " should be";
                    }

                    return {
                        text: [
                            self.name + " looks " + Cats.MoraleEnum.fromInt(self.morale) + " right now.",
                            status + "."
                        ],
                        buttons: {
                            "put down": {
                                text: "put down",
                                click: function() {
                                    self.isExamining = false;
                                },
                                nextScene: "end"
                            }
                        }
                    }
                },
                "failPickUp": function() {
                    return {
                        text: [
                            self.name + " scampers away before you can grab " + self.genderPronoun("him", "her")
                        ],
                        onLoad: function() {
                            self.leaveRoom();
                            self.wantsToLeave = true;
                        },
                        buttons: {
                            "continue": {
                                text: "continue",
                                click: function() {
                                    self.isExamining = false;
                                },
                                nextScene: "end"
                            }
                        }
                    }
                }
            }
        });
    },
    
    /* Sounds */
    meow: function(volume, target, noRepeat) {
        var loudness = volume || randInt(-4, 5);
        target = target || null;

        if(chance(0.5) && isUndefined(target)) {
            var possibilities = [ "you" ];
            if(this.room.cats.length > 1) {
                for(var i = 0; i < this.room.cats.length; i++) {
                    var catName = this.room.cats[i].name;
                    if(catName != this.name) {
                        possibilities.push(catName);
                    }
                }
            }
            target = chooseRandom(possibilities);
        }

        if(!this.traits.includes("quiet") && chance(0.1) && loudness == 4 && !noRepeat) {
            var numTimes = randInt(1,5);
            var cat = this;
            for(var i = 0; i < numTimes; i++) {
                Game.setTimeout(function() {
                    cat.meow(4, target, true);
                }, 3000 * i);
            }
        } else {
            this.makeSound("meows", loudness, "quietly", "loudly", target);
        }
    },

    purr: function(volume, target) {
        var loudness = volume || randInt(-4, 5);
        target = target || null;

        if(chance(0.3) && isUndefined(target)) {
            target = "you";
        }
        this.makeSound("purrs", loudness, "softly", "loudly", target);
    },

    hiss: function(volume, target) {
        var loudness = volume || randInt(-4, 5);
        this.makeSound("hisses", loudness, "quietly", "loudly");
    },

    //constructs sound message given arguments
    makeSound: function(sound, loudness, softStr, loudStr, target) {
        //hisses/meows AT "you" or another cat, code later
        const intensities = [" somewhat ", " ", " rather ", " very "];
        var suffix = loudStr;
        var targetStr = "";

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

        if(!isUndefined(target)) {
            targetStr = " at " + target;
        }

        this.action(sound + intensities[Math.abs(loudness) - 1] + suffix + targetStr);
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

    useLitterBox: function() {
        this.room.litterBox++;
        this.room.updateLitterBox();
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
    action: function(actionMsg, important, noName) {
        if(!noName) {
            actionMsg = this.name + " " + actionMsg;
        }

        if(isUndefined(this.room) || House.currentRoom == this.room.id || important) {
            //message only plays if player is in the House AND in the same room by default
            Notifications.notify(actionMsg, House, !important);
        }
    },

    //returns male or female string based on gender
    genderPronoun: function(maleStr, femaleStr) {
        return this.isFemale ? femaleStr : maleStr;
    }
};

var Cats = {
    MAX_ENERGY: 20,
    DEFAULT_MALE_NAMES: [ "garfield", "orpheus", "salem", "tom", "azrael", "whiskers", "felix", "oscar", "edgar", "sox", "ollie", "leo", "snickers", "charcoal", "prince", "toby", "mikesch", "buddy", "romeo", "loki", "gavin", "momo", "illia", "theodore", "eliot", "milo", "max", "monty", "zeke" ],
    DEFAULT_FEMALE_NAMES: [ "miso", "lola", "mcgonagall", "tara", "nala", "mistie", "misty", "coco", "tasha", "raven", "valencia", "princess", "cherry", "chloe", "felicia", "olivia", "emma", "belle", "luna", "minerva", "ellie", "athena", "artemis", "poppy", "venus", "calypso", "elise", "kathy", "elizabeth", "hope" ],
    DEFAULT_NEUTRAL_NAMES: [ "lolcat", "sesame", "unagi", "avocado", "mango", "oreo", "swirly", "striped", "alpha", "beta", "gamma", "lucky", "mittens", "angel", "dakota", "ginger", "tippy", "snickers", "fish", "smokey", "muffin", "fuzzy", "nibbles", "chaser" ],
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