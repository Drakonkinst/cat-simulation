var Cat = {
    Morale: {

        //adds morale points and handles changes in morale stage
        addPoints: function(points) {
            this.moralePoints += points;

            if(this.moralePoints >= this.MAX_POINTS) {
                //morale increases
                if(this.morale < this.MORALES.length - 1) {
                    //next stage, starts with grace
                    this.morale++;
                    this.moralePoints = this.GRACE_POINTS;
                } else {
                    //max stage
                    this.moralePoints = this.MAX_POINTS;
                }
            } else if(this.moralePoints < 0) {
                //morale decreases
                if(this.morale > 0) {
                    //previous stage, starts with grace
                    this.morale--;
                    this.moralePoints = this.MAX_POINTS - this.GRACE_POINTS;
                } else {
                    //min stage
                    this.moralePoints = 0;
                }
            }
        },
    },

    //updates a cat
    tick: function() {
        var wantsToLeave = false;

        //exit early if cat has just moved rooms
        if(this.movedRecently) {
            this.movedRecently = false;
            return;
        }

        //exit early if cat is busy
        if(!this.isActive) {
            return;
        }

        //chance for cat to leave for no reason
        if(chance(0.005)) {
            wantsToLeave = true;
        }

        //increments energy, hunger, and thirst
        this.energy -= 1;
        this.hunger += 5;
        this.thirst += 6;

        //if cat has eaten recently, increase morale
        if(this.hunger < 300) {
            this.addMorale(300 - Math.floor(this.hunger));
        }

        //if cat has drank recently, increase morale
        if(this.thirst < 300) {
            this.addMorale(300 - Math.floor(this.thirst));
        }

        //lose morale if litter box is smelly
        if(exists(this.room.litterBox) && this.room.litterBox >= 6) {
            this.addMorale(5 - this.room.litterBox);
        }

        //if cat is out of energy, nap
        if(this.energy <= 0) {
            this.startNap();
            return;
        }

        /* Actions */
        //sounds
        if(chance(0.01)) {
            this.meow();
        } else if(chance(0.01)) {
            this.purr();
        } else if(chance(0.01) && this.morale < 3) {
            this.hiss();
        }

        //food
        if(exists(this.room.food) && this.hunger >= 300) {
            if(this.room.food.level > 0) {
                if(chance(0.35)) {
                    this.eatFood();
                }
            } else {
                if(this.hunger >= 1000 && chance(0.65)) {
                    //wants to look for food in other rooms
                    this.addMorale(500 - this.hunger);
                    wantsToLeave = true;
                } else if(this.hunger >= 600 && chance(0.05)) {
                    this.action("looks at the empty food bowl despondently");
                }
            }
        } else if(this.hunger >= 1000 && chance(0.65)) {
            //wants to look for food in other rooms
            this.addMorale(500 - this.hunger);
            wantsToLeave = true;
        }

        //water
        if(exists(this.room.water) && this.thirst >= 300) {
            if(this.room.water.level > 0) {
                if(chance(0.35)) {
                    this.drinkWater();
                }
            } else {
                if(this.thirst >= 1000 && chance(0.65)) {
                    //wants to look for food in other rooms
                    this.addMorale(500 - this.thirst);
                    wantsToLeave = true;
                } else if(this.thirst >= 600 && chance(0.05)) {
                    this.action("looks at the dry water bowl sadly");
                }
            }
        } else if(this.thirst >= 1000 && chance(0.65)) {
            //wants to look for food in other rooms
            this.addMorale(500 - this.thirst);
            wantsToLeave = true;
        }

        //litter box
        if(this.consumedRecently && chance(0.2)) {
            if(exists(this.room.litterBox)) {
                if(chance(0.40)) {
                    this.useLitterBox();
                    this.consumedRecently = false;
                }
            } else {
                if(chance(0.30)) {
                    this.addMorale(-500);
                    wantsToLeave = true;
                }
            }
        }

        //leaves room at end of tick
        if(wantsToLeave) {
            this.movedRecently = true;
            this.leaveRoom();
        }
    },

    //begins nap
    startNap: function() {
        this.isSleeping = true;
        this.isActive = false;
        var minUntilWakeUp = randInt(1, 5);

        this.action("curls up for a nap");
        Game.setTimeout(function() {
            this.wakeUp();
        }, minUntilWakeUp * 60 * 1000);
    },

    //ends nap
    wakeUp: function() {
        this.isSleeping = false;
        this.isActive = true;
        this.hunger += randInt(100, 600);
        this.thirst += randInt(100, 600);
        this.action("wakes up");
        this.addMorale(20);
    },

    //attempts to eat food in current room
    eatFood: function() {
        var foodLevel = this.room.food.level;
        var action;
        
        if(foodLevel - this.hunger <= 0) {
            //not enough food to sate hunger
            this.hunger -= foodLevel;
            this.room.food.level = 0;
            this.addMorale(7);
            action = "scarfs down the last of the kibble";
        } else {
            //sates hunger
            this.room.food.level -= this.hunger;
            this.hunger = 0;
            this.addMorale(10);
            action = "eats some food";
        }

        this.action(action);
        this.room.updateFood();
        this.consumedRecently = true;
    },

    //attempts to drink water in current room
    drinkWater: function() {
        var waterLevel = this.room.water.level;
        var action;

        if(waterLevel - this.thirst <= 0) {
            //not enough water to sate thirst
            this.thirst -= waterLevel;
            this.room.water.level = 0;
            this.addMorale(7);
            c = "drinks the last of the water";
        } else {
            //sates thirst
            this.room.water.level -= this.thirst;
            this.thirst = 0;
            this.addMorale(10);
            action = "drinks some water";
        }

        this.action(action);
        this.room.updateWater();
        this.consumedRecently = true;
    },

    //attempts to use litter box
    useLitterBox: function() {
        this.room.litterBox++;
        this.room.updateLitterBox();
    },

    //leaves current room and goes into another random room
    leaveRoom: function() {
        var nextRoomId;

        do {
            nextRoomId = chooseRandom(House.unlockedRooms);
        }
        while(this.room.id == nextRoomId);

        var nextRoom = House.rooms[nextRoomId];

        this.room.removeCat();
        nextRoom.addCat();
    },

    /* Sounds */
    meow: function() {},

    purr: function() {},

    hiss: function() {},

    //constructs sound message
    makeSound: function(sound, loudness, softStr, loudStr, target) {
        var intensities = [ " somewhat ", " ", " rather ", " very " ];
        var suffix = loudStr;
        var fullMsg = sound;

        //special case: loudness is out of bounds
        if(loudness < -4 || loudness > 4) {
            this.action("makes a strange sound");
            return;
        }

        //default action
        if(loudness == 0) {
            this.action(sound);
            return;
        }

        if(loudness < 0) {
            suffix = softStr;
        }

        fullMsg = sound + intensities[Math.abs(loudness) - 1] + suffix;

        if(exists(target)) {
            fullMsg += " at " + target;
        }

        this.action(fullMsg);
    },

    //notifies player of cat action if they are in the room
    action: function(action, important, noName) {
        if(!noName) {
            //add name prefix
            action = this.name + " " + action;
        }

        if(isUndefined(this.room) || House.currentRoom == this.room.id || important) {
            //message only shows if player is in the same room unless important == true
            Notifications.notify(actionMsg, House, !important);
        }
    },

    //alias to this.Morale.addPoints()
    addMorale: function(points) {
        this.Morale.addPoints(points);
    },

    //returns male/female object based on gender
    genderPronoun: function(maleObj, femaleObj) {
        return this.isFemale ? femaleObj : maleObj;
    },

    
}