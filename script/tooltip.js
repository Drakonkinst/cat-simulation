/*
 * arguments:
 * - position: orientation of tooltip relative to element (default "bottom left")
 *   - accepted values: "top", "bottom", "right", "left"
 * - element: tooltip element
 * */
function Tooltip(element, position) {
    position = position || "bottom left";
    this.element = $("<div>");
    if(!isUndefined(element)) {
        this.element.append(element);
    }

    this.element.addClass("tooltip " + position);
}
Tooltip.prototype = {
    append: function(element) {
        this.element.append(element);
        return this;
    },
    appendTo: function(element) {
        this.element.appendTo(element);
    },
    exists: function() {
        return this.element.children().length > 0;
    },
    getElement: function() {
        return this.element;
    }
}