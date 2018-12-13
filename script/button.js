/*
 * Button class that represents a clickable button in the window.
 * Buttons can have text inside of them, a cooldown before it can be
 * clicked again, an action when it is clicked, a tooltip displayed on
 * hover, and an action after the button has cooled down.
 * 
 * properties {
 *      id: id of Button (default "btn_undefined")
 *      cooldown: cooldown of Button in milliseconds (default 0)
 *      text: Button text (default "press me")
 *      onClick: function to run when Button is clicked (default warning)
 *      onFinish: function to run when the Button finishes cooling down (optional)
 *      tooltip: Tooltip shown when hovering over Button (optional)
 *      width: custom width of button (px)
 * }
 * */
function Button(properties) {
    this.id = properties.id || "btn_undefined";
    this.cooldown = properties.cooldown || 0;
    this.onCooldown = false;
    var text = properties.text || "press me";

    //create Button element
    this.element = $("<div>")
        .attr("id", this.id)
        .addClass("button")
        .text(text)
        .click(function() {
            //convert element to jQuery object
            var el = $(this);

            if(!el.hasClass("disabled")) {
                //uses a callback to find the button object from the element's id, then clicks it
                var button = Buttons.getButton(el.attr("id"));
                var result = button.onClick();

                //if result returns true or undefined, click treated as "successful" - begins the button cooldown
                if(isUndefined(result) || result) {
                    button.startCooldown();
                }
            }
        })
        .append($("<div>").addClass("cooldown"));

    //adds Tooltip if it exists
    if(!isUndefined(properties.tooltip) && properties.tooltip.exists()) {
        properties.tooltip.appendTo(this.element);
    }

    //modifies width if custom width exists
    if(!isUndefined(properties.width)) {
        this.element.css("width", properties.width);
    }

    //every button should do something on click, so warns console if nothing happens
    this.onClick = properties.onClick || function() {
        Logger.warn("Button \"" + this.id + "\" clicked but nothing happened");
    };
    this.onFinish = properties.onFinish;
    
    //registers button for easier callbacks later
    Buttons.buttons[this.id] = this;
}
Button.prototype = {
    //initiates button cooldown, called on click
    startCooldown: function() {
        var cooldown = this.cooldown;

        //button hax!
        if(Game.options.instantButtons) {
            cooldown = 0;
        } else if(Game.options.fastButtons) {
            cooldown /= 4;
        }

        //avoids perma-disabled bug by treating cooldown as instant
        if(cooldown <= 2) {
            if(!isUndefined(this.onFinish)) {
                this.onFinish();
            }
            return;
        }

        //makes sure the button isn't already in the middle of a cooldown
        this.clearCooldown();

        //animates button
        this.element.find(".cooldown").width("100%").animate({width:"0%"}, cooldown, "linear", function() {
            //callbacks are fun
            var button = Buttons.getButton($(this).parent().attr("id"));
            button.clearCooldown();
            if(!isUndefined(button.onFinish)) {
                button.onFinish();
            }
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

    //appends Button element to another element
    appendTo: function(element) {
        this.element.appendTo(element);
        return this;
    },

    //returns the Button's element
    get: function() {
        return this.element;
    }
};

/* 
 * Buttons object that stores and handles requests for all
 * Button objects, allows for easier callbacks and less headaches
 * */
var Buttons = {
    //keymap of Button ids and their associated Button objects
    buttons: {},

    //returns a Button object based on requested id
    getButton: function(id) {
        return Buttons.buttons[id];
    }
};