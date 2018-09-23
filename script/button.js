/*
 * Button class that represents a clickable button in the window.
 * Buttons can have text inside of them, a cooldown before it can be
 * clicked again, an action when it is clicked, and an action after the
 * button has cooled down.
 * 
 * properties:
 * - String id: button's id (default "btn_undefined")
 * - String text: text inside button element (default "press me")
 * - int cooldown: cooldown of button in milliseconds (default 0)
 * - Function onClick: function that runs when the button is clicked (default empty)
 * - Function onFinish: function that runs when the button finished cooling down (default empty)
 * - (optional) Tooltip tooltip: button tooltip
 * - (optional) int width: special width of button
 * */
function Button(properties) {
    this.id = properties.id || "btn_undefined";
    this.cooldown = properties.cooldown || 0;
    this.onCooldown = false;
    var text = properties.text || "press me";

    this.element = $("<div>")
        .attr("id", this.id)
        .addClass("button")
        .text(text)
        .click(function() {
            var el = $(this);
            if(!el.hasClass("disabled")) {
                //uses a callback to find the button object from the element's id, then clicks it
                var button = Buttons.getButton(el.attr("id"));
                var result = button.onClick();

                //if result does not exist or returns true, begins the button cooldown
                if(isUndefined(result) || result) {
                    button.startCooldown();
                }
            }
        })
        .append($("<div>").addClass("cooldown"));


    //adds tooltip if it exists
    if(!isUndefined(properties.tooltip) && properties.tooltip.exists()) {
        properties.tooltip.appendTo(this.element);
    }

    //modifies width if special width exists
    if(!isUndefined(properties.width)) {
        this.element.css("width", properties.width)
    }

    //every button should do something on click, so warns console if nothing happens
    this.onClick = properties.onClick || function() {
        Logger.warn("Button \"" + this.id + "\" clicked but nothing happened");
    };
    this.onFinish = properties.onFinish || function() {
        //empty function
    };
    
    //registers button for easier callbacks later
    Buttons.buttons[this.id] = this;
}
Button.prototype = {
    //initiates button cooldown, called on click
    startCooldown: function() {
        var cooldown = this.cooldown;

        //button hax!
        if(Game.options.instantButtons) {
            cooldown = 100;
        } else if(Game.options.fastButtons) {
            cooldown /= 4;
        }

        if(cooldown <= 2) {
            this.onFinish();
            return;
        }

        //makes sure the button isn't already in the middle of a cooldown
        this.clearCooldown();

        this.element.find(".cooldown").width("100%").animate({width:"0%"}, cooldown, "linear", function() {
            //callbacks are fun
            var button = Buttons.getButton($(this).parent().attr("id"));
            button.onFinish();
            button.clearCooldown();
        });
        this.onCooldown = true;
        this.setDisabled(true);
    },

    //enables button and clears its cooldown
    clearCooldown: function() {
        this.onCooldown = false;
        this.setDisabled(false);
    },

    //sets disabled state (button cannot be clicked)
    setDisabled: function(disabled) {
        if(!disabled && !this.onCooldown) {
            this.element.removeClass("disabled");
        } else if(disabled) {
            this.element.addClass("disabled");
        }
    },

    //sets text of button
    setText: function(text) {
        this.element.text(text);
    },

    //sets cooldown
    setCooldown: function(cooldown) {
        this.cooldown = cooldown;
    },

    appendTo: function(element) {
        this.element.appendTo(element);
        //return this;
    }
};

/* 
 * Buttons object that stores and handles requests for all
 * Button objects, allows for easier callbacks and less headaches
 * */
var Buttons = {
    //keymap of all button ids and their associated buttons
    //TODO: each module should have their own button keymap
    buttons: {},

    //returns a Button object based on requested id
    getButton: function(id) {
        return Buttons.buttons[id];
    }
};