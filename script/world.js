//manages WORLD, not just outside
//that means weather and cat adoptions!

var World = {

    WEATHER_INTERVAL: [5, 10],
    //STRAY_CAT_INTERVAL: [5, 10],

    currentWeather: null,
    
    //weather can change randomly throughout the day, as well as overnight.
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

    events: [
        {
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
                        context.request.weather = ", is shivering"
                    },
                    "snow": function() {
                        context.start.weather = "a trail of pawprints in the snow lead off into the distance";
                        context.request.weather = ", is shivering"
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
                    context.request.status = "seems healthy enough"
                }
    
                //Logger.log(context);
                return context;
            },
            scenes: {
                "start": function(context) {
                    context = context.start;
                    return {
                        text: [
                            context.intro + ", " + context.action + ".",
                            context.weather + ".",
                            context.request + "."
                        ],
                        notification: context.notification,
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
                    context = context.flee;
                    return {
                        text: [
                            "cat scampers away, fleeing " + context.location + ".",
                            "probably won't come back."
                        ],
                        buttons: {
                            "goodbye": {
                                text: context.goodbye,
                                nextScene: "end"
                            }
                        }
                    };
                },
                "request": function(context) {
                    var cat = context.cat;
                    var context = context.request;
    
                    var line1 = "cat is a " + cat.color + " " + cat.breed + " with " + cat.coat + " fur.";
                    if(cat.coat == "hairless") {
                        line1 = "cat is a " + cat.color + " hairless " + cat.breed + ".";
                    }
                    var line2 = cat.genderPronoun("he", "she") + " " + context.status + context.weather;
                    if(cat.hunger <= 10 && context.weather.length > 0) {
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
                                text: "take it inside",
                                nextScene: {"adoptNamed": 2, "adoptNameless": 1}
                            },
                            "abandon": {
                                text: "leave it",
                                nextScene: "end"
                            }
                        }
                    };
                },
                "adoptNamed": function(context) {
                    return {
                        text: [
                            "there's a collar around the cat's neck.",
                            "tag says \"" + context.cat.name + ".\"",
                            "doesn't seem to have an address."
                        ],
                        buttons: {
                            "continue": {
                                text: "continue",
                                nextScene: "end",
                                click: function() {
                                    Notifications.notify("a new addition to the family");
                                    House.addCat(context.cat);
                                }
                            }
                        }
                    }
                },
                "adoptNameless": function(context) {
                    return {
                        text: [
                            "cat doesn't seem to have a collar.",
                            "looks like it's up to you."
                        ],
                        input: "give the cat a name",
                        maxinput: 20,
                        valid: function(text) {
                            if(text.length === 0 || /^[\s\'\-\_]+$/g.test(text)) {
                                return "can't be nothing"
                            }
                            if(text.replace(/[\-\'\s\_]/g, "_").indexOf("__") > -1 || !/^[a-z0-9\-\'\_\s]+$/i.test(text)) {
                                return "cat doesn't seem to recognize that"
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
                                    context.cat.name = Events.eventPanel().find("input").val();
                                    House.addCat(context.cat);
                                }
                            },
                            "random": {
                                text: "random",
                                click: function() {
                                    Events.eventPanel().find("input").val(chooseRandom(Cats.DEFAULT_NAMES));
                                }
                            }
                        }
                    }
                },
            }
        },
    ],

    nextWeather: function(hideAnnouncement) {
        var possibilities = World.weather[World.currentWeather].causes;
        var nextWeather = chooseWeighted(possibilities, "weight");
        if(!isUndefined(possibilities[nextWeather].notification) && !hideAnnouncement) {
            Notifications.notify(possibilities[nextWeather].notification);
        }
        World.currentWeather = nextWeather;

        if(World.currentWeather == "lightning") {
            World.WeatherTask.scheduleNext(0.5);
        } else {
            World.WeatherTask.scheduleNext();
        }
    },

    greeting: function() {
        Notifications.notify(World.weather[World.currentWeather].greeting);
    },

    Init: function() {
        World.WeatherTask = new Task("weather event", World.nextWeather, World.WEATHER_INTERVAL[0], World.WEATHER_INTERVAL[1]);
        //World.StrayCatTask = new Task("stray cat event", World.nextStrayCat, World.STRAY_CAT_INTERVAL[0], World.STRAY_CAT_INTERVAL[1]);
        
        //World.currentWeather = chooseRandom(keysAsList(World.weather));
        //World.currentWeather = "snow";
        World.currentWeather = chooseRandom(["sunny", "cloudy", "snow"]);
        //World.nextWeather();
        World.WeatherTask.scheduleNext();
        //World.StrayCatTask.scheduleNext();
        World.greeting();
    }
}