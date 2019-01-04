/*
 * Notifications object that manages the sidescroll of
 * messages on the left side of each module. Notifications
 * fade as new ones are added, and each module has its own
 * notification list.
 * */
var Notifications = {

    MESSAGE_FADE: 500,  //time in milliseconds it takes for a notification to turns completely visible

    /*
     * Keymap of each module's name and the array of visible notifications
     * associated with it.
     * */
    notifyQueue: {},

    /*
     * Adds a message to a module's notifications if that module
     * is currently active. If activeOnly is false and the module
     * is inactive, then saves the message to that module's notifyQueue.
     * */
    notify: function(message, module, noQueue) {
        message = message || "";

        //adds a period to the end of the message if one is needed
        if(message.length > 0 && ".!? ".indexOf(message.slice(-1)) == -1) {
            message += ".";
        }

        if(exists(module) && Game.activeModule != module) {
            if(!noQueue) {

                //creates key in notifyQueue if it does not exist
                if(!(module.name in this.notifyQueue)) {
                    this.notifyQueue[module.name] = [];
                }

                //adds message to notifyQueue in module
                this.notifyQueue[module.name].push(message);
            }
        } else {
            //requested module is active, so print message directly
            Notifications.printMessage(message);
        }
    },

    //prints a message to the active module's notifications
    printMessage: function(message) {
        var elem = $("<div>").addClass("notification").css("opacity", 0).text(message).prependTo('#notifications');
        elem.animate({opacity: 1}, Notifications.MESSAGE_FADE, "linear", function() {
            //removes invisible messages
            Notifications.clearHidden();
        });
    },

    //clears all notifications that are invisible
    clearHidden: function() {
        var bottom = $('#notify-gradient').position().top + $('#notify-gradient').outerHeight(true);
        $('.notification').each(function() {
            if($(this).position().top > bottom) {
                $(this).remove();
            }
        });
    },

    //empties notifyQueue in module and prints all of the messages to the active panel
    printQueue: function(module) {
        if(exists(this.notifyQueue[module.name])) {
            while(this.notifyQueue[module.name].length > 0) {
                Notifications.printMessage(this.notifyQueue[module.name].shift());
            }
        }
    },

    Init: function() {
        $("<div>").attr("id", "notifications").append($("<div>").attr("id", "notify-gradient")).appendTo("#wrapper");
    }
};