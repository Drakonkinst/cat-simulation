 /* ====== HELPER METHODS ====== */

 //return if the VARIABLE's type matches the TYPE requested
 function isType(variable, type) {
    if(type === "array") {
        return Array.isArray(variable);
    }
    return typeof variable === type;
}

function randNum(min, max) {
    return Math.random() * (max - min) + min;
}

//returns a random value from an ARRAY
function chooseRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function chooseWeighted(choices) {
    var totalWeight = 0;
    var weightSum = 0;

    for(var i in choices) {
        if(choices.hasOwnProperty(i)) {
            totalWeight += parseFloat(choices[i]);
        }
    }

    var rand = randNum(0, totalWeight);

    for(i in choices) {
        weightSum += parseFloat(choices[i]);
        if(rand < weightSum) {
            return i;
        }
    }

    Logger.warn("No choice found");
}

//returns if an OBJECT has no properties
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