var Notifications = {

    notifyQueue: {},    //list of all visible notifications

    //unshifts a notitification message to the Game.notifyQueue stack
    notify: function(module, text, activeOnly) {
        text = text || "";

        if(text.length > 0 && text.slice(-1) != ".") {
            text += ".";
        }

        if(module != null && Game.activeModule != module) {
            if(!activeOnly) {
                if(!(module in this.notifyQueue)) {
                    this.notifyQueue[module] = [];
                }
                this.notifyQueue[module].push(text);
            }
        } else {
            Notifications.printMessage(text);
        }
    },

    printMessage: function(text) {
        var elem = $("<div>").addClass("notification").css("opacity", 0).text(text).prependTo('#notifications');
        elem.animate({opacity: 1}, 500, "linear", function() {
            Notifications.clearHidden();
        });
    },

    //clears all notifications that are out of sight
    clearHidden: function() {
        var bottom = $('#notify-gradient').position().top + $('#notify-gradient').outerHeight(true);
        $('.notification').each(function() {
            if($(this).position().top > bottom) {
                $(this).remove();
            }
        });
    },


    Init: function() {
        $("<div>").attr("id", "notifications").append($("<div>").attr("id", "notify-gradient")).appendTo("#wrapper");
    }
}