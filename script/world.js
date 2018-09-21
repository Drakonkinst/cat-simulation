//manages WORLD, not just outside
//that means weather and cat adoptions!

var World = {
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
                    weight: 12,
                    notification: "a ray of light breaks the clouded skies. soon, the yellow sun shines anew."
                },
                "cloudy": {
                    weight: 75
                },
                "rain": {
                    weight: 11,
                    notification: "a sea of dark clouds rolls in like the tide. raindrops patter softly above."
                },
                "snow": {
                    weight: 2,
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
    nextWeather: function(hideAnnouncement) {
        var possibilities = World.weather[World.currentWeather].causes;
        var nextWeather = chooseWeighted(possibilities, "weight");
        if(!isUndefined(possibilities[nextWeather].notification) && !hideAnnouncement) {
            Notifications.notify(null, possibilities[nextWeather].notification);
        }
        World.currentWeather = nextWeather;
        World.WeatherTask.scheduleNext();
    },
    greeting: function() {
        Notifications.notify(null, World.weather[World.currentWeather].greeting);
    },
    Init: function() {
        World.WeatherTask = new Task("weather event", World.nextWeather, 5, 10);
        
        var possibleWeathers = [];
        for(var property in World.weather) {
            if(World.weather.hasOwnProperty(property)) {
                possibleWeathers.push(property);
            }
        }
        
        World.currentWeather = chooseRandom(possibleWeathers);
        //World.nextWeather();
        World.WeatherTask.scheduleNext();
        World.greeting();
    }
}