var Notifications = {

    notifyQueue: {},

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

    printMessage: function(message) {
        // TODO Closure
        const MESSAGE_FADE = 500;
        $("<div>").addClass("notification")
            .css("opacity", 0)
            .text(message)
            .animate({ "opacity": 1 }, MESSAGE_FADE, "linear", function() {
                Notifications.clearHidden();
            })
            .prependTo(".notifications");
    },

    clearHidden: function() {
        var bottom = $(".notify-gradient").position().top
            + $(".notify-gradient").outerHeight(true);

        $(".notification").each(function() {
            if($(this).position().top > bottom) {
                $(this).remove();
            }
        })
    },

    printQueue: function(location) {
        if(Notifications.notifyQueue.hasOwnProperty(location.name)) {
            while(Notifications.notifyQueue[location.name].length > 0) {
                Notifications.printMessage(
                    Notifications.notifyQueue[location.name].shift());
            }
        }
    },

    Init: function() {
        var notifications = $("<div>").addClass("notifications").appendTo(".wrapper");
        $("<div>").addClass("notify-gradient").appendTo(notifications);
    }
}