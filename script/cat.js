function Cat(properties) {
    properties = properties || {};
    this.name = properties.name || chooseRandom(Cats.DEFAULT_NAMES);

    if(!isUndefined(House.cats)) {
        this.name = Cats.uniqueName(this.name);
    }

    this.breed = properties.breed || chooseRandom(keysAsList(Cats.BREEDS));
    this.isFemale = properties.isFemale || Math.random() < 0.5;

    var breed = Cats.BREEDS[this.breed];

    //70% chance to retain each tendency
    this.traits = [];
    for(var i in breed.tendencies) {
        if(chance(0.7)) {
            this.traits.push(breed.tendencies[i]);
        }
    }

    var weightRange = this.isFemale ? breed.weight.f : breed.weight.m;
    this.weight = properties.weight || Math.floor(randNum(weightRange[0], weightRange[1]));

    this.color = chooseRandom(breed.colors);
    this.coat = chooseRandom(breed.coats);
    this.eyeColor = chooseRandom(breed.eyeColors);

    this.hunger = Math.floor(randNum(0, 21));
}
Cat.prototype = {
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

    genderPronoun: function(male, female) {
        return this.isFemale ? female : male;
    }
};

var Cats = {
    DEFAULT_NAMES: [ "Miso", "Tara", "Garfield", "Nala", "Salem", "Tom", "Azrael", "Whiskers", "Felix", "Oscar", "Coco", "Mistie", "Misty", "Edgar", "Lolcat", "Sox", "Ollie", "Tasha", "Raven", "Leo", "Unagi", "Valencia", "Snickers", "Sesame", "Cherry", "Avocado", "Mango", "Oreo", "Princess", "Charcoal", "Prince", "Swirly", "Striped", "Alpha", "Beta", "Gamma", "Toby", "Mikesch", "Buddy", "Lucky", "Loki", "Romeo", "Momo", "Gavin", "Mittens", "Angel", "Emma", "Belle", "Dakota", "Chloe", "Ginger", "Poppy", "Tippy", "Snickers", "Fish" ],
    //http://www.catbreedslist.com/all-cat-breeds/
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
            uniqueName = catName + " the " + ordinalSuffix(ordinal);
        }
        return uniqueName;
    }
};