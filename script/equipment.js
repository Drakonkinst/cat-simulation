function Equipment(id, title) {
    this.id = id;
    this.needsAppend = false;
    this.element = $("#" + this.id);

    if(!this.element.length) {
        this.element = $("<div>").attr("id", this.id).css("opacity", 0);

        if(!isUndefined(title)) {
            this.element.attr("data-legend", title);
        }

        this.needsAppend = true;
    }
}

Equipment.prototype = {
    create: function() {
        this.element.animate({opacity: 1}, 300, "linear");
        return this.element;
    },
    get: function() {
        return this.element;
    }
};
