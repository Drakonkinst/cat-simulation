var StateManager = {
    State: null,

    Init: function(stateObject) {
        $SM.State = stateObject;
    },

    //returns iterable array of the property path of input
    getPath: function(input) {
        var path = input.split(/[.\[\]'"]+/);

        //remove empty strings
        for(var i = 0; i < path.length; i++) {
            if(path[i] === "") {
                path.splice(i, 1);
                i--;
            }
        }

        return path;
    },

    //create all parents then set state
    createState: function(stateName, value) {
        var path = $SM.getPath(stateName);
        var obj = $SM.State;
        var w = null;

        for(var i = 0; i < path.length - 1; i++) {
            w = path[i];
            if(isUndefined(obj[w])) {
                obj[w] = {};
            }
            obj = obj[w];   //deeper down the rabbit hole...
        }
        obj[path[i]] = value;
        //return obj;
    },

    get: function(stateName, requestZero) {
        var path = $SM.getPath(stateName);
        var obj = $SM.State;
        var w = null;

        for(var i = 0; i < path.length; i++) {
            w = path[i];
            if(isUndefined(obj[w])) {
                return requestZero ? 0 : undefined;
            }
            obj = obj[w];
        }

        return obj;
    },

    set: function(stateName, value) {
        //space to check value validity
        $SM.createState(stateName, value);
    },

    add: function(stateName, value) {
        var old = $SM.get(stateName, true);

        if(isNaN(old)) {
            Logger.warn("State " + stateName + " was corrupted (NaN). Resetting to 0.");
            old = 0;
        } else if(typeof old != "number" || typeof value != "number") {
            Logger.warn("Failed to do math with state " + stateName + " or value " + value + " because at least one is not a number");
            return;
        }

        $SM.set(stateName, old + value);
    },

    /* ====== Specific State Functions ====== */
    addPerk: function(name) {
        //perks must be defined in Game.Perks
        if(isUndefined(Game.Perks[name])) {
            Logger.warn("Attempted to add perk \"" + name + "\" that doesn't exist!");
            return;
        }
        
        //perks can only be added once
        if($SM.hasPerk(name)) {
            return;
        }

        //adds perk
        $SM.set("character.perks[\"" + name + "\"]", true);
        Notifications.notify(Game.Perks[name].notify);
        Game.updatePerks();
    },

    //returns if the character has the specified perk
    hasPerk: function(name) {
        return $SM.get("character.perks[\"" + name + "\"]");
    },

    //
    addItem: function(name, value) {
        $SM.add("character.equipment[\"" + name + "\"]", value);

        if(House.Buildings.hasOwnProperty(name)) {
            House.updateHouse();
        } else {
            Game.updateEquipment(); 
        }
    },

    /*
     * Returns if the player's inventory contains an item.
     * If a value is specified, returns if the player's inventory
     * contains at least that many of the item.
     * */
    hasItem: function(name, value) {
        value = value || 1;
        return $SM.get("character.equipment[\"" + name + "\"]", true) >= value;
    }
};
var $SM = StateManager;