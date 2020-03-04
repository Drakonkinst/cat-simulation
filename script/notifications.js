/**
 * Notifications object that displays messages on the sidebar. Notifications
 * fade as new ones are added, and can sometimes be based on the player's
 * location.
 */
var Notifications = {

    /**
     * A keymap with each location's name and a list of
     * queued notifications corresponding to that location.
     */
    notifyQueue: {},

    /**
     * Sends a notification message to the player. If the player is not
     * in the correct location, adds it to the queue unless noQueue is true.
     *  
     * @param {String} message The message to send
     * @param {Location} location An optional location object
     * @param {boolean} noQueue Whether the message should be queued or not
     */
    notify: function(message, location, noQueue) {
        message = getOrDefault(message, "");

        if(!isUndefined(location) && Game.currentLocation != location) {
            if(!noQueue) {
                // add to queue
                if(!Notifications.notifyQueue.hasOwnProperty(location.name)) {
                    Notifications.notifyQueue[location.name] = [];
                }
                Notifications.notifyQueue[location.name].push(message);
            }
        } else {
            Notifications.printMessage(message);
        }
    },

    /**
     * Sends a notification message to the player.
     * TODO: Closure
     * 
     * @param {String} message The message to send
     */
    printMessage: function(message) {
        const MESSAGE_FADE = 500;
        $("<div>").addClass("notification")
            .text(message)
            .css("opacity", 0)
            .animate({ "opacity": 1 }, MESSAGE_FADE, "linear", function() {
                Notifications.clearHidden();
            })
            .prependTo(".notifications");
    },

    /**
     * Sends a notification message to the player.
     * 
     * @param {String} message The message to send
     */
    printMessage2: (function() {
        const MESSAGE_FADE = 500;
        return function() {
            $("<div>").addClass("notification")
                .text(message)
                .css("opacity", 0)
                .animate({ "opacity": 1 }, MESSAGE_FADE, "linear", function() {
                    Notifications.clearHidden();
                })
                .prependTo(".notifications");
        };
    })(),

    /**
     * Removes all notification messages that have gone out of visibility.
     */
    clearHidden: function() {
        // get the bottommost y-value of the notify-gradient div
        var bottom = $(".notify-gradient").position().top
            + $(".notify-gradient").outerHeight(true);

        $(".notification").each(function() {
            // if the element if out of the visible bounds, remove it
            if($(this).position().top > bottom) {
                $(this).remove();
            }
        })
    },

    /**
     * Prints the notification queue for a given location.
     * 
     * @param {Location} location The location to use
     */
    printQueue: function(location) {
        if(Notifications.notifyQueue.hasOwnProperty(location.name)) {
            while(Notifications.notifyQueue[location.name].length > 0) {
                Notifications.printMessage(Notifications.notifyQueue[location.name].shift());
            }
        }
    },

    /**
     * Initializes the Notification object, adding its HTML div.
     */
    Init: function() {
        var notifications = $("<div>").addClass("notifications").appendTo(".wrapper");
        $("<div>").addClass("notify-gradient").appendTo(notifications);
    }
}