var Outside = {
    name: "outside",
    BuyItems: {
        "cat treat": {
            type: "inventory",
            availableMsg: "found a local pet store, could have some useful supplies",
            buyMsg: "a treat to cheer up the little ones back home",
            maxMsg: "more treats won't help now",
            cost: function() {
                return {
                    "money": 3
                };
            }
        },
        "cat food": {
            type: "resource",
            maximum: 1000,
            availableMsg: "get some food for your cats!",
            buyMsg: "survival needs",
            maxMsg: "don't be stuffing your cats with food now...",
            cost: function() {
                return {
                    "money" : 1
                };
            },
            quantity: function() {
                return 10;
            }
        },
        "food bowl": {
            type: "building",
            maximum: 100,
            availableMsg: "get a container to hold the cat food.",
            buyMsg: "nice bowls!",
            maxMsg: "how did you fit 1000 of them in your house?",
            cost: function() {
                return {
                    "money": 4
                };
            }
        }
    },
    
    events: [],
    onArrival: function(transitionDiff) {
        Game.moveEquipmentView(null, transitionDiff);
    },
    updateBuyButtons: function() {
        var buyContainer = new Container("#buy-buttons", "buy:");

        for(var item in Outside.BuyItems) {
            var buyItem = Outside.BuyItems[item];
            var max = false;

            if(!isUndefined(buyItem.maximum)) {
                max = Game.hasItem(item, buyItem.maximum);
            }

            if(isUndefined(buyItem.button)) {
                if(Outside.unlocked(item)) {
                    var location = buyContainer.get();
                    var cost = buyItem.cost()
                    var tooltip = new Tooltip(location.children().length > 10 ? "top left" : "bottom left");

                    for(var id in cost) {
                        tooltip.append($("<div>").addClass("row_key").text(id)).append($("<div>").addClass("row_val").text(cost[id]));
                    }

                    buyItem.button = new Button({
                        id: "buy_" + item,
                        text: item,
                        width: "80px",
                        tooltip: tooltip,
                        onClick: function() {
                            //Outside.buy(item);
                            Outside.buy(this.id.substring(4));
                        }
                    });

                    buyItem.button.get().css("opacity", 0).animate({opacity: 1}, 300, "linear").appendTo(location);

                    Notifications.notify(buyItem.availableMsg);
                }
            } else {
                //TODO - refresh the tooltip - for items that change cost based on context
                if(max && !buyItem.button.get().hasClass("disabled")) {
                    Notifications.notify(buyItem.maxMsg);
                }
            }
            if(!isUndefined(buyItem.button)) {
                buyItem.button.setDisabled(max);
            }
        }

        if(buyContainer.needsAppend && buyContainer.exists()) {
            buyContainer.create().appendTo("#outside-panel");
        }
    },
    buy: function(item) {
        var info = Outside.BuyItems[item];
        var num = Game.equipment[item] || 0;

        if(info.maximum <= num) {
            return;
        }

        var cost = info.cost();
        for(var id in cost) {
            if(Game.hasItem(id, cost[id])) {
                Game.addItem(id, -cost[id]);
            } else {
                Notifications.notify("not enough " + id);
                return;
            }
        }

        if(info.type == "building" && isUndefined(House.stores[item])) {
            House.stores[item] = 0;
        }

        Notifications.notify(info.buyMsg/*, House*/);

        if(isUndefined(info.quantity)) {
            Game.addItem(item, 1);
        } else {
            Game.addItem(item, info.quantity());
        }
        
        Outside.updateBuyButtons();
    },
    unlocked: function(item) {
        if(Buttons.getButton("buy_" + item)) {
            return true;
        }
        
        var info = Outside.BuyItems[item];
        var cost = info.cost();
        
        for(var id in cost) {
            if(!Game.hasItem(id)) {
                return false;
            }
        }

        return true;
    },
    Init: function() {
        this.tab = Game.addLocation("outside", "A Quiet Town", Outside);
        this.panel = $("<div>").attr("id", "outside-panel").addClass("location").appendTo("#location-slider");
        Game.updateSlider();

        new Button({
            id: "work",
            text: "go to work",
            cooldown: 4000,
            tooltip: new Tooltip().append($("<div>").text("you need to go to work.")),
            onClick: function() {
                Notifications.notify("hard labor, but necessary");
                Game.addItem("money", Math.floor(randNum(1, 7)));
                Outside.updateBuyButtons();
            }
        }).appendTo("#outside-panel");

        Outside.updateBuyButtons();
    }
};