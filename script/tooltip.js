/*
 * Tooltip class that represents a tooltip shown when hovering over an element.
 * Tooltips can be oriented relative to the element.
 * 
 * position: orientation of the tooltip relative to the element (default "bottom left")
 * - accepted values: "top" or "bottom", "right" or "left"
 * arguments:
 * - element: Tooltip element, for text added before the object was constructed (may be
 *            easier to use .append())
 * */
function Tooltip(position) {
    this.element = $("<div>").addClass("tooltip " + (position || "bottom left"));
}
Tooltip.prototype = {
    //appends an element to the Tooltip, then returns itself for method chaining
    append: function(element) {
        this.element.append(element);
        return this;
    },
    
    //appends Tooltip to element
    appendTo: function(element) {
        this.element.appendTo(element);
        return this;
    },

    //returns whether the Tooltip has any text to show
    exists: function() {
        return this.element.children().length > 0;
    },
    getElement: function() {
        return this.element;
    }
}