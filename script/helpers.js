/*
 * Miscellaneous helper functions.
 * */

//returns whether a variable's type matches the requested type
function isType(variable, type) {
    if(type === "array") {
        return Array.isArray(variable);
    }
    return typeof variable === type;
}

//returns a random number between min and max
function randNum(min, max) {
    return Math.random() * (max - min) + min;
}

//returns a randomly selected item from an array
function chooseRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/*
 * Returns an object based on its weight in the given keymap.
 * 
 * For example, in keymap {a: 1, b: 1, c: 3, d: 1} a, b, and d
 * have the same chance of being selected, while c has triple of
 * their individual chance. This percentage-based probability
 * makes it easy to create trees of probability without
 * massive calculations, since all of the values are relative.
 * */
function chooseWeighted(choiceMap) {

    //first, find the sum of all the values in choiceMap
    var totalWeight = 0;
    
    for(var i in choiceMap) {
        if(choiceMap.hasOwnProperty(i)) {
            totalWeight += parseFloat(choiceMap[i]);
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
        weightSum += parseFloat(choiceMap[i]);
        if(rand < weightSum) {
            return i;
        }
    }

    //this code should be unreachable
    Logger.warn("No choice found");
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

//returns if the object is undefined, useful for checking if a boolean exists
function isUndefined(variable) {
    return typeof variable === "undefined" || variable === null;
}