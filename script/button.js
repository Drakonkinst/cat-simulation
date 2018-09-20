/*
 * property values:
 * - String id: button's id (default "btn_undefined")
 * - String text: text inside button element (default "press me")
 * - int cooldown: cooldown of button in milliseconds (default 1000)
 * - Tooltip tooltip: button tooltip (optional)
 * - int width: special width of button (optional)
 * */
function Button(properties) {
    this.id = properties.id || "btn_undefined";
    this.cooldown = properties.cooldown || 1000;
    this.onCooldown = false;
    var text = properties.text || "press me";

    this.element = $("<div>")
        .attr("id", this.id)
        .addClass("button")
        .text(text)
        .click(function() {
            var el = $(this);
            if(!el.hasClass("disabled")) {
                var button = Buttons.getButton($(el).attr("id"));
                var result = button.onClick();
                if(isUndefined(result) || result) {
                    button.startCooldown();
                }
            }
        })
        .append($("<div>").addClass("cooldown"));


    //adds tooltip if it exists
    if(!isUndefined(properties.tooltip)) {
        if(properties.tooltip.exists()) {
            properties.tooltip.appendTo(this.element);
        }
    }

    //modifies width if special width exists
    if(!isUndefined(properties.width)) {
        this.element.css("width", properties.width)
    }

    this.onClick = properties.onClick || function() {
        Logger.warn("Button " + this.id + " clicked but nothing happened");
    };
    this.onFinish = properties.onFinish || function() {
        //empty function
    };
    
    Buttons.buttons[this.id] = this;
}
Button.prototype = {
    //initiates button cooldown, called on click
    startCooldown: function() {
        var cooldown = this.cooldown;
        if(Game.options.instantButtons) {
            cooldown = 100;
        } else if(Game.options.fastButtons) {
            cooldown /= 4;
        }

        if(cooldown <= 2) {
            return;
        }

        this.clearCooldown();

        this.element.find(".cooldown").width("100%").animate({width:"0%"}, cooldown, "linear", function() {
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
            this.element.addClass("disabled")
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

    //gets button element
    getElement: function() {
        return this.element;
    }
};

var Buttons = {
    buttons: {},
    getButton: function(id) {
        return Buttons.buttons[id];
    }
};