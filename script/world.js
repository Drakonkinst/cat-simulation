/*
 * World object that manages the global virtual world. Unlike
 * modules, World is always present no matter the player's
 * location.
 */
var World = {
    WEATHER_INTERVAL: [5, 10],  //possible interval between weather updates, in minutes

    currentWeather: null,       //name of current weather
    day: 0,                     //current day, increments every time the player sleeps
    catsAbandoned: 0,           //statistic tracking how many cats you have refused to take in :(
    
    /*
     * Weather probability tree
     * Weather can change randomly throughout the day, as well as overnight.
     * The next weather is based on the weighted probabilities listed below.
     * */
    weather: {
        "sunny": {
            greeting: "the curtains open to clear skies",
            //farewell: "",
            causes: {
                "sunny": {
                    weight: 3
                },
                "cloudy": {
                    weight: 1,
                    notification: "the sun yields to white clouds. puffs of soft cotton drift across the horizon."
                }
            }
        },
        "cloudy": {
            greeting: "the curtains open to lazy clouds, floating across the sky",
            causes: {
                "sunny": {
                    weight: 6,
                    notification: "a ray of light breaks the clouded skies. soon, the yellow sun shines anew."
                },
                "cloudy": {
                    weight: 38
                },
                "rain": {
                    weight: 6,
                    notification: "a sea of dark clouds rolls in like the tide. raindrops patter softly above."
                },
                "snow": {
                    weight: 1,
                    notification: "the winds grow colder. crystals of ice flutter from the sky."
                }
            }
        },
        "rain": {
            greeting: "it is raining today",
            causes: {
                "sunny": {
                    weight: 4,
                    notification: "the last drops of water fall from the heavens. the sun shines brightly, filled with hope."
                },
                "cloudy": {
                    weight: 5,
                    notification: "the rain stops. cold wind and muggy skies are poor replacements."
                },
                "rain": {
                    weight: 38
                },
                "storm": {
                    weight: 2,
                    notification: "sheets of rain pour out of the sky. winds howl with a primal fury."
                },
                "hail": {
                    weight: 1,
                    notification: "water turns solid. they strike the ground with further intensity."
                }
            }
        },
        "storm": {
            greeting: "there's a storm outside",
            causes: {
                "rain": {
                    weight: 9,
                    notification: "the storm thins. soon, a light drizzle is all that remains."
                },
                "storm": {
                    weight: 10
                },
                "lightning": {
                    weight: 1,
                    notification: "jagged streaks of light split the sky asunder. darkness shatters before its will."
                },
            }
        },
        "lightning": {
            greeting: "a bolt of lightning cracks the sky",
            causes: {
                "storm": {
                    weight: 4,
                    notification: "roaring thunder grips the earth."
                },
                "rain": {
                    weight: 1,
                    notification: "with a final rumble of thunder, the gods relent their fury."
                }
            }
        },
        "snow": {
            greeting: "snowflakes flutter to the ground",
            causes: {
                "cloudy": {
                    weight: 2,
                    notification: "the snowfall stops. cold wind and muggy skies are poor replacements."
                },
                "rain": {
                    weight: 2,
                    notification: "snowfall gives way to light rain."
                },
                "hail": {
                    weight: 3,
                    notification: "soft flakes turn to ice. they shatter upon impact."
                },
                "snow": {
                    weight: 13
                }
            }
        },
        "hail": {
            greeting: "ice pelts the roof from above",
            causes: {
                "snow": {
                    weight: 1,
                    notification: "ice melts to soft white flakes of snow."
                },
                "hail": {
                    weight: 2
                },
                "storm": {
                    weight: 1, 
                    notification: "the hail stops. a wall of rain continues its assault."
                }
            }

        }
    },

    dreams: [ "dark and stormy nights", "bright skies and lazy clouds", "soft whispers and a warm embrace", "fish swimming across the sky", "a hunter stalking its prey", "a world covered in ash", "crimson mist and a wolf's howl", "a trident in the sea", "a better life" ],

    //global events
    events: [
        {
            //Stray Cat Event - how to get more cats!
            title: "A Stray Cat",
            isAvailable: function() {
                return !["rain", "storm", "lightning", "hail"].includes(World.currentWeather);
            },
            getContext: function() {
                var context = {
                    start: {},  //notification, intro, weather, request
                    flee: {},   //location,
                    request: {}
                };
    
                var cat = context.cat = new Cat();
    
                var modules = {
                    "house": function() {
                        context.start.notification = "a stray cat arrives, looking for a home";
                        context.start.intro = "a stray cat scratches at the door";
                        context.start.request = "seems to want to come inside";
                        context.flee.location = "down the sidewalk";
                        context.flee.goodbye = "go back inside";
                        context.request.adopt = "take it inside";
                    },
                    "outside": function() {
                        context.start.notification = "a stray cat walks by",
                        context.start.intro = "a stray cat slinks into view",
                        context.start.request = "seems to like you";
                        context.flee.location = "into a dark alleyway";
                        context.flee.goodbye = "continue";
                        context.request.adopt = "adopt it";
                    },
                    "default": function() {
                        Logger.warn("modules could not find a value");
                    }
                };
                (modules[Game.activeModule.name] || modules["default"])();
    
                var weather = {
                    "sunny": function() {
                        context.start.weather = "cat's shadow stretches long under the warm sun";
                        context.request.weather = "";
                    },
                    "cloudy": function() {
                        context.start.weather = "the wind is biting";
                        context.request.weather = ", is shivering";
                    },
                    "snow": function() {
                        context.start.weather = "a trail of pawprints in the snow lead off into the distance";
                        context.request.weather = ", is shivering";
                    },
                    "default": function() {
                        Logger.warn("weather could not find a value");
                    }
                };
                (weather[World.currentWeather] || weather["default"])();
    
                if(cat.traits.includes("friendly") && cat.traits.includes("quiet")) {
                    context.start.action = "purring softly";
                } else if(cat.traits.includes("friendly")) {
                    context.start.action = "purring loudly";
                } else if(cat.traits.includes("quiet")) {
                    context.start.action = "meowing quietly";
                } else {
                    context.start.action = "meowing loudly";
                }
    
                if(cat.hunger > 10) {
                    context.request.status = "doesn't seem to have eaten for days";
                } else {
                    context.request.status = "seems healthy enough";
                }
    
                //Logger.log(context);
                return context;
            },
            scenes: {
                "start": function(context) {
                    var c = context.start;
                    return {
                        text: [
                            c.intro + ", " + c.action + ".",
                            c.weather + ".",
                            c.request + "."
                        ],
                        notification: c.notification,
                        blink: true,
                        buttons: {
                            "getCloser": {
                                text: "get closer",
                                nextScene: {"flee": 1, "request": 2}
                            },
                            "ignore": {
                                text: "ignore it",
                                nextScene: "end"
                            }
                        }
                    };
                },
                "flee": function(context) {
                    var c = context.flee;
                    return {
                        text: [
                            "cat scampers away, fleeing " + c.location + ".",
                            "probably won't come back."
                        ],
                        buttons: {
                            "goodbye": {
                                text: c.goodbye,
                                nextScene: "end"
                            }
                        }
                    };
                },
                "request": function(context) {
                    var cat = context.cat;
                    var c = context.request;
    
                    var line1 = "cat is a " + cat.color + " " + cat.breed + " with " + cat.coat + " fur.";
                    if(cat.coat == "hairless") {
                        line1 = "cat is a " + cat.color + " hairless " + cat.breed + ".";
                    }
                    var line2 = cat.genderPronoun("he", "she") + " " + c.status + c.weather;
                    if(cat.hunger <= 10 && c.weather.length > 0) {
                        line2 += " though";
                    }
                    line2 += ".";
                    return {
                        text: [
                            line1,
                            line2,
                            "large " + cat.eyeColor + "-colored eyes stare up at you."
                            //todo - description of eye? "round"
                        ],
                        buttons: {
                            "adopt": {
                                text: c.adopt,
                                nextScene: {"adoptNamed": 6, "adoptNameless": 5}
                            },
                            "abandon": {
                                text: "leave it",
                                click: function() {
                                    World.catsAbandoned++;
                                    if(World.catsAbandoned >= 10 && !Game.hasPerk("heartless")) {
                                        Game.addPerk("heartless");
                                    }
                                },
                                nextScene: "end"
                            }
                        }
                    };
                },
                "adoptNamed": function(context) {
                    var cat = context.cat;
                    return {
                        text: [
                            "there's a collar around the cat's neck.",
                            "tag says \"" + cat.name + ".\"",
                            "doesn't seem to have an address."
                        ],
                        buttons: {
                            "continue": {
                                text: "continue",
                                nextScene: "end",
                                click: function() {
                                    Notifications.notify("a new addition to the family");
                                    House.addCat(cat);
                                }
                            }
                        }
                    };
                },
                "adoptNameless": function(context) {
                    var cat = context.cat;
                    return {
                        text: [
                            "cat doesn't seem to have a collar.",
                            "looks like it's up to you."
                        ],
                        input: "give the cat a name",
                        maxinput: 20,
                        valid: function(text) {
                            if(text.length === 0 || /^[\s\'\-\_]+$/g.test(text)) {
                                return "can't be nothing";
                            }
                            if(text.replace(/[\-\'\s\_]/g, "_").indexOf("__") > -1 || !/^[a-z0-9\-\'\_\s]+$/i.test(text)) {
                                return "cat doesn't seem to recognize that";
                            }
                            if(itemInList(House.cats.map(cat => cat.name), text, true)) {
                                return "name is taken";
                            }
                            return true;
                        },
                        buttons: {
                            "name": {
                                text: "name",
                                nextScene: "end",
                                checkValid: true,
                                tooltip: new Tooltip("top left").append($("<div>").text("confirm name?")),
                                click: function() {
                                    Notifications.notify("a new addition to the family");
                                    cat.name = Events.eventPanel().find("input").val();
                                    House.addCat(cat);
                                }
                            },
                            "random": {
                                text: "random",
                                click: function() {
                                    var namePool = (cat.isFemale ? Cats.DEFAULT_FEMALE_NAMES : Cats.DEFAULT_MALE_NAMES).concat(Cats.DEFAULT_NEUTRAL_NAMES);
                                    Events.eventPanel().find("input").val(Cats.uniqueName(chooseRandom(namePool)));
                                }
                            }
                        }
                    };
                },
            }
        },
    ],

    //attempts to change the weather based on the current weather
    nextWeather: function(hideAnnouncement) {
        var possibilities = World.weather[World.currentWeather].causes;
        var nextWeather = chooseWeighted(possibilities, "weight");
        var notification = possibilities[nextWeather].notification

        //play notification if the weather changes
        if(!isUndefined(notification) && !hideAnnouncement) {
            Logger.log("Changed weather to " + nextWeather);
            Notifications.notify(notification);
        }

        World.currentWeather = nextWeather;

        //schedule next update
        if(World.currentWeather == "lightning") {
            //shouldn't stay on lightning for very long
            World.WeatherTask.scheduleNext(0.3);
        } else {
            //use default interval
            World.WeatherTask.scheduleNext();
        }
    },

    //pauses the game and transitions to the next day
    sleep: function() {
        Game.keyLock = true;
        //white-out content
        $("#outer-slider").animate({opacity: 0}, 600, "linear", function() {
            //reset all sliders
            $("#outer-slider").css("left", "0px");
            $("#location-slider").css("left", "0px");
            $("#equipment-container").css({"top": "40px", "right": "0px"});

            //set current to default\
            Game.activeModule = House;
            $(".header-button").removeClass("selected");
            House.tab.addClass("selected");
            //set room to bedroom?

            //animate onArrival before the screen fades in
            House.onArrival();

            //come back after a time delay
            Game.setTimeout(function() {
                Game.keyLock = false;
                $("#outer-slider").animate({opacity: 1}, 600, "linear");
                //dream system needs improvements - either many messages of this style, or a randomizer with two clauses
                World.dream();
                World.nextDay();

                //update rooms so the lights on/off button shows - this should be changed
                for(var k in House.rooms) {
                    House.rooms[k].updateManageButtons();
                }

                //delay weather greeting?
            }, 3000);
        });
    },

    dream: function() {
        var dream = chooseRandom(this.dreams);
        Notifications.notify("dreamed of " + dream);

        //chance for dream 2 not to occur, but if it does it must be different than dream 1
        //later: World.dreams { "type": [] }, can have "bad dreams" and returns what type of dream it is
        //if bad/restless, (which should also be calculated in sleep), reduces number of actions player can make on the next day
    },

    //called at the start of a new day
    nextDay: function() {
        World.day++;
        Notifications.notify(World.weather[World.currentWeather].greeting);
        $("#day-notify").text("day " + World.day + ".").css("opacity", 1).animate({opacity: 0}, 3000, "linear");
        House.nextDay();
    },

    Init: function() {
        World.WeatherTask = new Task("weather", World.nextWeather, World.WEATHER_INTERVAL[0], World.WEATHER_INTERVAL[1]);
        
        //World.currentWeather = chooseRandom(keysAsList(World.weather));
        World.currentWeather = chooseRandom(["sunny", "cloudy", "snow"]);
        World.WeatherTask.scheduleNext();
        World.nextDay();
    }
};