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
    this.isFemale = properties.isFemale || Math.random() < 0.5;

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
    this.weight = properties.weight || Math.floor(randNum(weightRange[0], weightRange[1]));
    
    //set color, coat, and eyeColor based on breed
    this.color = chooseRandom(breed.colors);
    this.coat = chooseRandom(breed.coats);
    this.eyeColor = chooseRandom(breed.eyeColors);

    //sets random hunger upon spawn
    this.hunger = Math.floor(randNum(0, 21));
}
Cat.prototype = {
    greeting: function() {
        //based on morale - later
        //"doesn't seem to mind this place" - indifferent
        Notifications.notify(this.name + " sniffs around, seems to like this place.", House);
    },
    
    meow: function(volume) {
        var loudness = volume || Math.floor(randNum(-4, 5));
        this.makeSound("meows", loudness, "quietly", "loudly");
    },

    purr: function(volume) {
        var loudness = volume || Math.floor(randNum(-4, 5));
        this.makeSound("purrs", loudness, "softly", "loudly");
    },

    makeSound: function(sound, loudness, softStr, loudStr) {
        const intensities = [" somewhat ", " ", " rather ", " very "];
        var base = this.name + " " + sound;
        var suffix = loudStr;

        if(loudness < -4 || loudness > 4) {
            Notifications.notify(this.name + " makes a strange sound");
            return;
        }

        if(loudness == 0) {
            Notifications.notify(base);
            return;
        }
        
        if(loudness < 0) {
            suffix = softStr;
        }

        Notifications.notify(base + intensities[Math.abs(loudness) - 1] + suffix);
    },

    eatFood: function(room) {
        if (this.hunger === 0) {
            return;
        }
        var foodLevel = room.food.level;
        if(foodLevel <= 0) {
            Notifications.notify(this.name + " looks at the empty food bowl despondently");
        } else if(foodLevel - this.hunger <= 0) {
            this.hunger -= foodLevel;
            room.food.level = 0;
            Notifications.notify(this.name + " scarfs down the last of the kibble");
        } else {
            room.food.level -= this.hunger;
            this.hunger = 0;
            Notifications.notify(this.name + " eats some food");
        }
        room.updateFood();
    },

    genderPronoun: function(male, female) {
        return this.isFemale ? female : male;
    }
};

var Cats = {
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