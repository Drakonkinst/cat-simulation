var array = [Math, "drugs", "dragons", 3];
//console.log(chooseRandom(array));

var Game = {

    version: {
        alpha: false,
        beta: true,
        major: 2,
        minor: 0,
        release: 0,
        build: 1,
    },

    options: {
        debug: true
    },

    currentLocation: null,

    /**
     * Parses Game.version into a legible string.
     * Produces warnings if the version is invalid.
     * 
     * @return {String} The version string
     */
    getVersionString: function() {
        Logger.warnIf(Game.version.alpha && Game.version.beta, 
            "This build is marked as both alpha and beta!");

        var prefix = "";
        if(Game.version.alpha) {
            prefix = "alpha ";
        } else if(Game.version.beta) {
            prefix = "beta ";
        }

        return prefix + "v"
            + Game.version.major + "."
            + Game.version.minor
            + Game.version.release
            + Game.version.build
    },

    /**
     * Initializes the game.
     */
    Init: function() {
        Logger.log("Game initializing!");
        Logger.log("Version is " + Game.getVersionString());

        /* Layout */
        $(".content").empty();

        Notifications.Init();
    },

    /**
     * Launches the game.
     */
    Launch: function() {
        Game.Init();
    }
}

$(document).ready(function() {
    Game.Launch();
});
