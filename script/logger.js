/* 
 * Logger object that wraps the default console so that
 * debug messages are only printed if Logger.isDebug()
 * returns true.
 * */

var Logger = {
    /*
     * Controls whether the other functions will print anything
     * when called. This predicate can be changed to wherever the
     * debug boolean is stored for easy modification.
     * */
    isDebug: function() {
        return Game.options.debug;
    },

    /*
     * Standard logging - just like default console
     * logging, but with the isDebug() condition
     * */
    log: function(msg) {
        if(this.isDebug()) {
            console.log(msg);
        }
    },

    warn: function(msg) {
        if(this.isDebug()) {
            console.warn(msg);
        }
    },

    /*
     * Conditional logging - only logs if the condition
     * is met and isDebug() is true. Also returns whether
     * the condition was met either way, so the condition does
     * not have to be checked twice.
     * 
     * Note that by calling this wrapper class's method for
     * standard logging, isDebug() does not need to be checked.
     * */
    logIf: function(condition, msg) {
        if(condition) {
            this.log(msg);
        }
        return condition;
    },
    
    warnIf: function(condition, msg) {
        if(condition) {
            this.warn(msg);
        }
        return condition;
    }
};