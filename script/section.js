function Section(selector, title) {
    this.selector = selector;
    this.needsAppend = false;
    this.element = $(this.selector);

    if(!this.element.length) {
        this.element = $("<div>").css("opacity", 0);
        if(this.selector.startsWith("#")) {
            this.element.attr("id", this.selector.substring(1));
        } else if(this.selector.startsWith(".")) {
            this.element.addClass(this.selector.substring(1));
        }

        if(!isUndefined(title)) {
            this.element.attr("data-legend", title);
        }

        this.needsAppend = true;
    }
}

Section.prototype = {
    create: function() {
        this.element.animate({opacity: 1}, 300, "linear");
        return this.element;
    },
    get: function() {
        return this.element;
    },
    exists: function() {
        return this.element.children().length > 0;
    }
};