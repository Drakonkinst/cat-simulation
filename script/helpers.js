/*
 * Miscellaneous helper functions.
 * */

/*
 * Returns a number between min and max, non-inclusive.
 * */
function randNum(min, max) {
    return Math.random() * (max - min) + min;
}

/*
 * Returns an integer between min and max, not including max
 * */
function randInt(min, max) {
    return Math.floor(randNum(min, max));
}

//returns a randomly selected item from an array
function chooseRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

//returns boolean given the chance to be true (range [0, 1])
function chance(chance) {
    return Math.random() < chance;
}

//focuses an element
function autoSelect(selector) {
    $(selector).focus().select();
}

/*
 * Returns an array of all the property names in an object.
 * 
 * Example:
 * keysAsList({a: 1, b: 1, c: 3, d: 1}) -> ["a", "b", "c", "d"]
 * 
 * */
function keysAsList(object) {
    var keys = [];
    for(var key in object) {
        if(object.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

/*
 * Returns an object based on its weight in the given keymap.
 * 
 * For example, in keymap {a: 1, b: 1, c: 3, d: 1} a, b, and d
 * have the same chance of being selected, while c has triple of
 * their individual chance. This dynamic probability
 * makes it easy to create trees of probability without
 * massive calculations, since all of the values are relative.
 * 
 * If a property is specified, then uses that choice's property as
 * weight instead of the choice's value itself.
 * */
function chooseWeighted(choiceMap, property) {

    //first, find the sum of all the values in choiceMap
    var totalWeight = 0;
    
    for(var i in choiceMap) {
        if(choiceMap.hasOwnProperty(i)) {
            if(exists(property)) {
                totalWeight += parseFloat(choiceMap[i][property]);
            } else {
                totalWeight += parseFloat(choiceMap[i]);
            }
        }
    }

    /*
     * Chooses a random number based on totalWeight, then
     * uses weightSum to find which choice interval that number lies in.
     * 
     * Larger weights will result in larger intervals, and therefore
     * have a greater chance of being selected.
     * */
    var rand = randNum(0, totalWeight);
    var weightSum = 0;

    for(i in choiceMap) {
        if(choiceMap.hasOwnProperty(i)) {
            if(exists(property)) {
                weightSum += parseFloat(choiceMap[i][property]);
            } else {
                weightSum += parseFloat(choiceMap[i]);
            }
            if(rand < weightSum) {
                return i;
            }
        }
    }

    //this code should be unreachable
    Logger.warn("No choice found");
}

//returns a number in roman numerals
function romanize(num) {
    var lookup = {
        m: 1000,
        cm: 900,
        d:  500,
        cd: 400,
        c:  100,
        xc:  90,
        l:   50,
        xl:  40,
        x:   10,
        ix:   9,
        v:    5,
        iv:   4,
        i:    1
    };

    var roman = "";
    
    for(var i in lookup) {
        while(num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }

    return roman;
}

//returns whether a variable exists in an array
function itemInList(list, item, ignoreCase) {
    if(ignoreCase) {
        //turn everything to uppercase
        item = item.toUpperCase();
        list = list.map(function(value) {
            return value.toUpperCase();
        });
    }
    return list.includes(item);
}

//returns if the object has no properties
function isEmpty(object) {
	for(var key in object) {
		if(object.hasOwnProperty(key)) {
			return false;
		}
	}
	return true;
}

/*
 * Returns if a variable is not defined.
 * This will return true if the variable is undefined or null,
 * but will return false if the variable is a boolean false,
 * which if(variable) does not support.
 * */
function isUndefined(variable) {
    return typeof variable === "undefined" || variable === null;
}

function exists(variable) {
    return !isUndefined(variable);
}