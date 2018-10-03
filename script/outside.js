var Outside = {
    name: "outside",
    events: [],
    onArrival: function(transitionDiff) {
        Game.moveEquipmentView(null, transitionDiff)
    },
    Init: function() {
        this.tab = Game.addLocation("outside", "A Quiet Town", Outside);
        this.panel = $("<div>").attr("id", "outside-panel").addClass("location").appendTo("#location-slider");
        Game.updateSlider();
    }
}