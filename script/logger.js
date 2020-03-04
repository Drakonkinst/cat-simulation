/**
 * Logger object that wraps the default console object so that
 * debug messages are only printed when a certain game option is true.
 */
var Logger = {

    /**
     * Returns whether messages should be outputted to console, based on a
     * certain game option.
     * 
     * @return {boolean} Whether log messages should be outputted.
     */
    isDebug: function() {
        return Game.options.debug;
    },

    /**
     * Logs a message to the console.
     * 
     * @param {String} msg The string to output to console. 
     */
    log: function(msg) {
        if(Logger.isDebug()) {
            console.log(msg);
        }
    },

    /**
     * Logs a message only if the condition is true.
     * Returns whether the condition is true or false.
     * 
     * @param {boolean} condition The condition to check.
     * @param {String} msg The string to output to console.
     * @return {boolean} the condition
     */
    logIf: function(condition, msg) {
        if(condition) {
            Logger.log(msg);
        }
        return condition;
    },

    /**
     * Logs a warning message to the console.
     * 
     * @param {String} msg The string to output to console. 
     */
    warn: function(msg) {
        if(Logger.isDebug()) {
            console.warn(msg);
        }
    },

    /**
     * Logs a warning message only if the condition is true.
     * Returns whether the condition is true or false.
     * 
     * @param {boolean} condition The condition to check.
     * @param {String} msg The string to output to console. 
     * @return {boolean} the condition
     */
    warnIf: function(condition, msg) {
        if(condition) {
            Logger.warn(msg);
        }
        return condition;
    }

}