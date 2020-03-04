/**
 * Helper file to hold useful utility functions that are used
 * throughout the code.
 */

/**
 * Chooses a random element from an array.
 * 
 * @param {Array} array The array to choose from
 * @return {*} A random element from the array
 */
function chooseRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns whether the variable is undefined or not.
 * 
 * @param {*} variable The variable to check
 * @return {boolean} Whether the variable is undefined or not
 */
function isUndefined(variable) {
    return typeof variable === "undefined" || variable === null;
}

/**
 * Returns the value if it is defined, or the default value otherwise.
 * 
 * @param {*} value The value to check
 * @param {*} defaultValue The default value
 * @return {*} value if defined or defaultValue
 */
function getOrDefault(value, defaultValue) {
    if(isUndefined(value)) {
        return defaultValue;
    }
    return value;
}