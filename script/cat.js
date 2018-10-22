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
    this.moralePoints = 50;
    //points until next morale drop - things like petting/such should be increasingly less effective
    this.energy = Cats.MAX_ENERGY;

    this.isSleeping = false;
    this.room = null;

    var cat = this;
    this.wakeUpTask = new Task("[" + cat.name + " - wake up]", function() {
        cat.wakeUp();
    }, 1, 5);
}
Cat.prototype = {
    tick: function() {

        if(this.isSleeping) {
            return;
        }

        if(chance(0.005) && this.leaveRoom()) {
            return;
        }

        this.energy -= 0.1;
        this.hunger += 0.05;

        if(this.hunger < 3) {
            this.addMorale(3 - Math.floor(this.hunger));
        }

        if(this.energy <= 0) {
            this.startSleep();
            return;
        }

        if(chance(0.01)) {
            this.meow();
        } else if(chance(0.01)) {
            this.purr();
        } else if(chance(0.05) && this.morale < 3) {
            this.hiss();
        }


        if(!isUndefined(this.room.food)) {
            if(this.room.food.level > 0 && this.hunger >= 3) {
                if(chance(0.35)) {
                    this.eatFood(this.room);
                }
            } else if(this.hunger >= 6 && chance(0.05)) {
                this.action("looks at the empty food bowl despondently");
                this.addMorale(-5);
            }
        } else if(this.hunger >= 10 && chance(0.85)) {
            this.addMorale(5 - this.hunger);
            if(this.leaveRoom(this.room)) {
                return;
            }
        }
    },

    nextDay: function() {
        if(this.morale == 0 && chance(0.9)) {
            this.runAway();
        }
    },

    startSleep: function() {
        this.isSleeping = true;
        this.action("curls up for a nap");
        this.wakeUpTask.scheduleNext();
    },

    wakeUp: function() {
        this.isSleeping = false;
        this.energy = Cats.MAX_ENERGY;
        this.hunger += randInt(1, 6);
        this.action("wakes up");
        this.addMorale(20);
    },

    leaveRoom: function() {
        var index = House.unlockedRooms.indexOf(this.room.id);
        var nextIndex;

        do {
            nextIndex = randInt(0, House.unlockedRooms.length);
        }
        while(index == nextIndex);

        var nextRoom = House.rooms[House.unlockedRooms[nextIndex]];
        
        this.room.removeCat(this);
        nextRoom.addCat(this);
        return nextIndex > index;
    },

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

    addMorale: function(points) {
        this.moralePoints += points;

        if(this.moralePoints >= 100) {
            if(this.morale < Cats.MoraleEnum.morales.length - 1) {
                this.morale++;
                this.moralePoints = 20;
            } else {
                this.moralePoints = 100;
            }
        } else if(this.moralePoints < 0) {
            if(this.morale > 0) {
                this.morale--;
                this.moralePoints = 80;
            }
            this.moralePoints = 0;
        }
    },

    addEnergy: function(points) {
        if(this.energy + points > Cats.MAX_ENERGY) {
            this.energy = Cats.MAX_ENERGY;
        } else if(this.energy + points >= 0) {
            this.energy += points;
        }
    },

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
    
    meow: function(volume) {
        var loudness = volume || randInt(-4, 5);
        this.makeSound("meows", loudness, "quietly", "loudly");
    },

    purr: function(volume) {
        var loudness = volume || randInt(-4, 5);
        this.makeSound("purrs", loudness, "softly", "loudly");
    },

    hiss: function(volume) {
        var loudness = volume || randInt(-4, 5);
        this.makeSound("hisses", loudness, "quietly", "loudly");
    },

    makeSound: function(sound, loudness, softStr, loudStr) {
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

    //attempt to eat food in the current room
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
    },

    action: function(actionMsg, noName) {
        if(!noName) {
            actionMsg = this.name + " " + actionMsg;
        }

        if(House.currentRoom == this.room.id) {
            Notifications.notify(actionMsg, House, true);
        }
    },

    genderPronoun: function(male, female) {
        return this.isFemale ? female : male;
    }
};

var Cats = {
    MAX_ENERGY: 20,
    DEFAULT_MALE_NAMES: [ "Garfield", "Salem", "Tom", "Azrael", "Whiskers", "Felix", "Oscar", "Edgar", "Sox", "Ollie", "Leo", "Snickers", "Charcoal", "Prince", "Toby", "Mikesch", "Buddy", "Romeo", "Loki", "Gavin", "Momo", "Illia", "Theodore", "Eliot", "Milo", "Max", "Monty" ],
    DEFAULT_FEMALE_NAMES: [ "Miso", "Tara", "Nala", "Mistie", "Misty", "Coco", "Tasha", "Raven", "Valencia", "Princess", "Cherry", "Chloe", "Felicia", "Olivia", "Emma", "Belle", "Luna", "Minerva", "Ellie", "Athena", "Artemis", "Poppy", "Venus"],
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