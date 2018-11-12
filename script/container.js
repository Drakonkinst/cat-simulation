/*
 * Container that wraps around a container element that may or may not
 * exist, creates a pseudoelement if it does not exist that may
 * be appended to other elements.
 * */
function Container(selector, title, context) {
    this.needsAppend = false;      //whether the pseudoelement was created or not

    //searches for the element, in context if necessary
    if(isUndefined(context)) {
        this.element = $(selector); 
    } else {
        this.element = context.find(selector);
    }
       
    if(!this.element.length) {
        //element does not exist, create pseudoelement
        this.element = $("<div>").css("opacity", 0);

        //sets id or class based on selector argument
        if(selector.startsWith("#")) {
            this.element.attr("id", selector.substring(1));
        } else if(selector.startsWith(".")) {
            this.element.addClass(selector.substring(1));
        }

        //adds title if any
        if(!isUndefined(title)) {
            this.element.attr("data-legend", title);
        }

        this.needsAppend = true;
    }
}

Container.prototype = {
    //animates the element into view and returns it for appending
    create: function() {
        this.element.animate({opacity: 1}, 200, "linear");
        return this.element;
    },

    //returns the element for appending
    get: function() {
        return this.element;
    },

    //default optional check - is there anything inside this pseudo-element?
    exists: function() {
        return this.element.children().length > 0;
    }
};