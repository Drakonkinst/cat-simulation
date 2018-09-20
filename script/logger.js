/* ====== LOGGER OBJECT ====== 
 * Wraps the console so that debug messages
 * are only printed if Game.options.debug
 * is true.
 */
var Logger = {
    isDebug: function() {
        return Game.options.debug;
    },
    log: function(msg) {
        if(this.isDebug()) {
            console.log(msg);
        }
    },
    logIf: function(condition, msg) {
        if(condition && this.isDebug()) {
            this.log(msg);
        }
        return condition;
    },
    warn: function(msg) {
        if(this.isDebug()) {
            console.warn(msg);
        }
    },
    warnIf: function(condition, msg) {
        if(condition && this.isDebug()) {
            this.warn(msg);
        }
        return condition;
    },
}