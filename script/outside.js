/*
 * Outside module that represents the outside world.
 */
var Outside = {
    name: "outside",    //module id

    MAX_DAILY_WORK: 10,

    //info table of all items that can be bought
    BuyItems: {
        //pet store
        "cat treat": {
            type: "inventory",
            availableMsg: "found a local pet store, could have some useful supplies",
            buyMsg: "a treat to cheer up the little ones back home",
            maxMsg: "more treats won't help now",
            cost: function() {
                return {
                    "money": 4
                };
            }
        },
        "cat food": {
            type: "resource",
            maximum: 1000,
            buyMsg: "cans of kibble to keep the hunger away",
            maxMsg: "pantry won't be able to hold any more",
            cost: function() {
                return {
                    "money" : 8
                };
            },
            quantity: function() {
                return 25;
            }
        },
        "water": {
            type: "resource",
            maximum: 1000,
            buyMsg: "water is good for you",
            maxMsg: "too much water is bad for you",
            cost: function() {
                return {
                    "money": 6
                }
            },
            quantity: function() {
                return 30;
            }
        },
        "food bowl": {
            type: "building",
            maximum: 100,
            buyMsg: "more bowls means more food",
            maxMsg: "more bowls won't help now",
            cost: function() {
                return {
                    "money": 12
                };
            }
        },
        "water bowl": {
            type: "building",
            maximum: 100,
            buyMsg: "cats love drinking out of bowls",
            maxMsg: "drinking out of taps works too, you know?",
            //should this just be tap water - free? maybe like electricity
            //electricity should only fail when used a LOT per day
            cost: function() {
                return {
                    "money": 12
                };
            }
        },
        "litter box": {
            type: "building",
            maximum: 5,
            buyMsg: "good for keeping the smell away",
            maxMsg: "house won't need any more",
            cost: function() {
                return {
                    "money": 20,
                }
            }
        }
    },
    
    //outside-related events
    events: [],

    //called when player travels to this location
    onArrival: function(transitionDiff) {
        Game.moveEquipmentView(null, transitionDiff);
    },

    //updates item buying section
    updateBuyButtons: function() {
        var buyContainer = new Container("#buy-buttons", "buy:");

        for(var item in Outside.BuyItems) {
            var buyItem = Outside.BuyItems[item];

            //determine whether item has hit max limit, if any
            var max = false;
            if(!isUndefined(buyItem.maximum)) {
                max = $SM.hasItem(item, buyItem.maximum);
            }

            if(isUndefined(buyItem.button)) {
                if(Outside.unlocked(item)) {
                    var location = buyContainer.get();
                    var cost = buyItem.cost();
                    var tooltip = new Tooltip(location.children().length > 10 ? "top left" : "bottom left");

                    for(var id in cost) {
                        tooltip.addCost(id, cost[id]);
                    }

                    //closure is important
                    (function(item) {
                        buyItem.button = new Button({
                            id: "buy_" + item,
                            text: item,
                            width: "80px",
                            tooltip: tooltip,
                            onClick: function() {
                                Outside.buy(item);
                            }
                        });
                    })(item);
                    
                    buyItem.button.get().css("opacity", 0).animate({opacity: 1}, 200, "linear").appendTo(location);

                    if(!isUndefined(buyItem.availableMsg)) {
                        Notifications.notify(buyItem.availableMsg);
                    }
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

    //attempts to buy an item
    buy: function(item) {
        var info = Outside.BuyItems[item];
        var num = $SM.get("character.equipment[" + item + "]", true);

        if(info.maximum <= num) {
            return;
        }

        var cost = info.cost();
        for(var id in cost) {
            if($SM.hasItem(id, cost[id])) {
                $SM.addItem(id, -cost[id]);
            } else {
                Notifications.notify("not enough " + id);
                return;
            }
        }

        if(info.type == "building" && !$SM.get("house.stores[" + item + "]")) {
            $SM.set("house.stores[" + item + "]", 0);
        }

        Notifications.notify(info.buyMsg);

        if(isUndefined(info.quantity)) {
            $SM.addItem(item, 1);
        } else {
            $SM.addItem(item, info.quantity());
        }
        
        if(info.type == "building") {
            //better way to do these loops? we're going to need a lot of them
            //should this be in addItem instead?
            for(var k in House.rooms) {
                House.rooms[k].updateBuildButtons();
            }
        }

        Outside.updateBuyButtons();
    },

    work: function() {
        Notifications.notify("hard labor, but necessary");
        $SM.addItem("money", randInt(5, 9));
        $SM.add("game.dailyWorked", 1);
        Outside.updateBuyButtons();

        if(Outside.dailyTimesWorked >= Outside.MAX_DAILY_WORK) {
            Notifications.notify("done working for the day");
        }
    },
    
    unlocked: function(item) {
        if(Buttons.getButton("buy_" + item)) {
            return true;
        }
        
        var info = Outside.BuyItems[item];
        var cost = info.cost();
        
        for(var id in cost) {
            if(!$SM.hasItem(id, cost[id] / 2)) {
                return false;
            }
        }

        return true;
    },

    updateTitle: function() {
        //A Quiet Town, A Bustling World - as more things unlock
    },

    Init: function() {
        this.tab = Game.addLocation("outside", "A Quiet Town", Outside);
        this.panel = $("<div>").attr("id", "outside-panel").addClass("location").appendTo("#location-slider");
        Game.updateSlider();

        new Button({
            id: "work",
            text: "find work",
            cooldown: 4000,
            tooltip: new Tooltip().addText("you need to fend for yourself."),
            onClick: Outside.work,
            onFinish: function() {
                Buttons.getButton("work").setDisabled($SM.get("game.dailyWorked", true) >= Outside.MAX_DAILY_WORK);
            }
        }).appendTo("#outside-panel");

        Outside.updateBuyButtons();
    }
};