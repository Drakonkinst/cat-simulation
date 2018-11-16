function Problem(properties) {
    this.id = properties.id || "undefined"; //problem id
    
    this.causes = properties.causes || [];  //problems that are caused (added) by solving this
    this.solves = properties.solves || [];  //problems that are solved (removed) by solving this

    this.notification = properties.notification || "";  //weighted probability of possible notifications
    this.awards = properties.awards || {};
    this.costs = properties.costs || {};
    this.requires = properties.requires || {};

    this.onClick = properties.onClick || function() {};
    this.onFinish = properties.onFinish || function() {};

    this.isSolvable = isUndefined(properties.solvable) ? true : properties.solvable;
    this.isSolving = false;

    var problemText = properties.text || "you have a problem"
    if(problemText.slice(-1) != ".") {
        problemText += ".";
    }
    var tooltip = new Tooltip();

    for(var k in this.awards) {
        if(this.awards[k] > 1) {
            tooltip.addText("+" + this.awards[k] + " " + k);
        } else {
            tooltip.addText("+" + k);
        }
    }

    for(var k in this.costs) {
        if(this.costs[k] > 1) {
            tooltip.addText("-" + this.costs[k] + " " + k);
        } else {
            tooltip.addText("-" + k);
        }
    }

    this.button = new Button({
        id: "btn_" + this.id + "_solve",
        text: properties.button,
        cooldown: properties.duration,
        tooltip: tooltip,
        onClick: function() {
            var problem = Problems.getProblemFromEl(this);
            return problem.attemptSolve();
        },
        onFinish: function() {
            var problem = Problems.getProblemFromEl(this);
            if(problem.isActive()) {
                problem.solved();
            }
        }
    });

    this.element = $("<div>")
        .attr("id", this.id)
        .addClass("problem")
        .append($("<div>").attr("id", this.id + "_text").text(problemText).addClass("problem-text"))
        .append(this.button.get().addClass("problem-solve"));
}
Problem.prototype = {
    //inserts problem inside element
    insertIn: function(element) {
        this.isSolving = false;
        var activeProblems = $SM.get("problems.activeProblems");
        activeProblems.push(this.id);
        $SM.set("problems.activeProblems", activeProblems);
        this.element.appendTo(element);
    },

    //inserts problem after element
    insertAfter: function(prevElement) {
        this.isSolving = false;
        var activeProblems = $SM.get("problems.activeProblems");
        activeProblems.splice(activeProblems.indexOf(prevElement.attr("id")) + 1, 0, this.id);
        $SM.set("problems.activeProblems", activeProblems);
        this.element.insertAfter(prevElement)
    },

    attemptSolve: function() {
        for(var k in this.costs) {
            if(!$SM.hasItem(k, this.costs[k])) {
                Notifications.notify("not enough " + k);
                return false;
            }
        }

        this.solve();
        return true;
    },

    solve: function() {
        this.isSolving = true;

        //fade in "solving..."
        $("#" + this.id + "_text").append($("<span>").addClass("solving-text").text(" solving...").css("opacity", 0).animate({"opacity": 1}, 150, "linear"));

        //subtract costs
        for(var k in this.costs) {
            $SM.addItem(k, -this.costs[k]);
        }

        this.onClick();
    },

    solved: function() {
        this.isSolving = false;
        
        //adds awards
        for(var k in this.awards) {
            $SM.addItem(k, this.awards[k]);
        }

        //removes other solved problems
        for(var i = 0, problem; i < this.solves.length; i++) {
            problem = Problems.ProblemList[this.solves[i]];
            if(!isUndefined(problem) && problem.isActive()) {
                problem.remove();
            }
        }

        //adds new caused problems
        for(var i = this.causes.length - 1, problem; i >= 0; i--) {
            problem = Problems.ProblemList[this.causes[i]];
            if(!isUndefined(problem) && !problem.isActive()) {
                problem.insertAfter(this.element);
            }
        }

        this.onFinish();

        if(this.isSolvable) {
            $("#" + this.id + "_text").find(".solving-text").remove();
            this.remove();
        } else {
            $("#" + this.id + "_text").find(".solving-text").animate({"opacity": 0}, 75, "linear", function() {
                $(this).remove();
            });    
        }

        if(!isUndefined(this.notification)) {
            Notifications.notify(this.notification);
        }

        Problems.updateAll();
        Game.saveGame();
    },

    remove: function() {
        var activeProblems = $SM.get("problems.activeProblems");
        activeProblems.splice(activeProblems.indexOf(this.id), 1);
        this.element.detach();
        this.isSolving = false;
    },

    //returns if problem is currently active
    isActive: function() {
        return itemInList($SM.get("problems.activeProblems"), this.id);
    }
};

var Problems = {
    element: null,
    parentEl: null,
    ProblemInfo: {
        "start": {
            text: "you are sleeping",
            button: "wake up",
            duration: 10000,
            causes: ["age0", "dream"]
        },
        "age0": {
            text: "you are waking up",
            button: "open eyes",
            duration: 7000,
            awards: {"weariness": 1},
            causes: ["age1"],
            solves: ["dream"]
            //notify: something about maybe it's better to have stayed in bed?
        },
        "age1": {
            text: "you are awake",
            button: "get up",
            duration: 10000,
            notification: "pale walls and dusty floors",
            onFinish: function() {
                $SM.set("features.location.house", true);
                House.Init();
                Problems.setParent("house-panel");
                Game.travelTo(House);
            },
            causes: ["age2"]
        },
        "age2": {
            text: "you are alone",
            button: "solve",
            duration: 3000,
            
            causes: ["age3", "makefriend"]
        },
        "age3": {
            text: "you are lonely",
            button: "mourn",
            duration: 3000,
            solvable: false,
            awards: {"weariness": 1},
            costs: {"memory": 10, "experience": 3},
            solves: [""]
            //takes friends? requires friends? requires experiences
        },
        "age4": {
            text: "you are troubled",
            //requires experiences?
        },
        "age5": {
            text: "you are bitter",
        },
        "age6": {
            text: "you are starting to give up",
            button: "accept",
            //costs hope?
            onFinish: function() {
                Events.startEvent({
                    title: "A Strange Noise",
                    scenes: {

                    }
                });
            }
        },

        "dream": {
            text: "you need to dream",
            button: "dream",
            duration: 4000,
            solvable: false,
            onFinish: function() {
                World.dream();
            }
        },
        "makefriend": {
            text: "you need more friends",
            button: "make a friend",
            duration: 8000,
            solvable: false,
            awards: {"friend": 1},
            causes: ["talkfriend"]
        },
        "talkfriend": {
            text: "you need to talk to a friend",
            button: "solve",
            duration: 5000,
            solvable: false,
            awards: {"memory": 1},
            requires: {"friend": 1},
            causes: ["ignorefriend"]
        },
        "ignorefriend": {
            text: "you need to be let down",
            button: "be ignored",
            duration: 3000,
            notification: "a friend that only stays when the sun is bright is no friend at all",
            awards: {"weariness": 1},
            costs: {"friend": 1},
            causes: ["losefriend"],
            
        },
        "losefriend": {
            text: "you need to move on",
            button: "learn",
            duration: 15000,
            awards: {"experience": 1}
        }
    },

    getProblemFromEl: function(element) {
        var elId = $(element).attr("id");
        var id = elId.substring(4, elId.length - 6);
        return Problems.ProblemList[id];
    },

    setParent: function(id) {
        var element = $("#" + id);
        this.element.appendTo(element);
        $SM.set("problems.location", id);
    },

    updateAll: function() {
        var activeProblems = $SM.get("problems.activeProblems");
        for(var i = 0, problem; i < activeProblems.length; i++) {
            var problem = Problems.ProblemList[activeProblems[i]];
            for(var k in problem.requires) {
                if(!$SM.hasItem(k, problem.requires[k])) {
                    problem.remove();
                    break;
                }
            }
        }
    },

    Init: function() {
        this.element = $("<div>").attr("id", "problems");
        if(isUndefined($SM.get("problems.activeProblems"))) {
            $SM.set("problems.activeProblems", ["start"]);
        }
        
        Problems.ProblemList = {};
        for(var k in Problems.ProblemInfo) {
            Problems.ProblemInfo[k].id = k;
            Problems.ProblemList[k] = new Problem(Problems.ProblemInfo[k]);
        }

        if(isUndefined($SM.get("problems.location"))) {
            $SM.set("problems.location", "location-slider");
        }
        this.element.appendTo("#" + $SM.get("problems.location"));

        var activeProblems = $SM.get("problems.activeProblems");
        for(var i = 0; i < activeProblems.length; i++) {
            Problems.ProblemList[activeProblems[i]].element.appendTo("#problems");
        }
    }
};