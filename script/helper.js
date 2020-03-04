// Choose a random element from an array
function chooseRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function isUndefined(variable) {
    return typeof variable === "undefined" || variable === null;
}

function getOrDefault(value, defaultValue) {
    if(isUndefined(value)) {
        return defaultValue;
    }
    return value;
}