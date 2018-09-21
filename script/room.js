var Room = {
    name: "room",
    events: [{
        title: "A Stray Cat",
        isAvailable: function() {
            return true;
        },
        scenes: {
            "start": {
                text: [
                    "a stray cat slinks into view, purring softly.",    //TODO: meowing quietly, hissing, ... as it gets closer
                    "seems to want to come inside."
                ],
                notification: "a stray cat arrives, looking for a home",
                blink: true,
                buttons: {
                    "adopt": {
                        text: "take it inside",
                        nextScene: {"adoptNamed": 4, "adoptNameless": 1}    //weighted probability
                    },
                    "abandon": {
                        text: "leave it",
                        notification: "cat left a wanderer, disappears out of sight.",
                        nextScene: "end"
                    }
                }
            },
            "adoptNamed": {
                text: ["cat has a name tag, says \"Bob\"."],
                buttons: {
                    "continue": {
                        text: "continue",
                        notification: "a new addition to the family.",
                        nextScene: "end"
                    }
                }
                
            },
            "adoptNameless": {
                text: ["cat doesn't seem to have a name tag."],
                input: {
                    text: "",
                    valid: function() {

                    }
                },
                buttons: {
                    "name": {
                        text: "name",
                        nextScene: "end"
                    }
                }
            }
        }
    }],
};