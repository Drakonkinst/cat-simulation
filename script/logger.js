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
        
    },

    warn: function(msg) {
        if(this.isDebug()) {
            console.warn(msg);
        }
    }

}