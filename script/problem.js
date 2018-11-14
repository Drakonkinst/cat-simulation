function Problem(properties) {
    this.id = properties.id || "undefined"; //problem id
    
    this.causes = properties.causes || [];  //problems that are caused (added) by solving this
    this.solves = properties.solves || [];  //problems that are solved (removed) by solving this

    this.notification = properties.notification || {};  //weighted probability of possible notifications
    this.awards = properties.awards || {};
    this.costs = properties.costs || {};

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
        tooltip.addCost(this.awards, "+" + this.awards[k]);
    }

    for(var k in this.costs) {
        tooltip.addCost(this.costs, "-" + this.costs[k]);
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
            problem.solved();
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
        this.addProblem().appendTo(element);
    },

    //inserts problem after element
    insertAfter: function(element) {
        this.addProblem().insertAfter(element)
    },

    //activates problem
    addProblem: function() {
        this.isSolving = false;
        var activeProblems = $SM.get("problems.activeProblems");
        activeProblems.unshift(this.id);
        $SM.set("problems.activeProblems", activeProblems);
        return this.element;
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
            this.remove();
        }

        //fades out "solving..." text
        $("#" + this.id + "_text").find(".solving-text").animate({"opacity": 0}, 75, "linear", function() {
            $(this).remove();
        });

        if(!isEmpty(this.notification)) {
            Notifications.notify(chooseWeighted(this.notification));
        }

        Game.saveGame();
    },

    remove: function() {
        var activeProblems = $SM.get("problems.activeProblems");
        activeProblems.splice(activeProblems.indexOf(this.id), 1);
        this.element.remove();
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
            causes: ["age0"]
        },
        "age0": {
            text: "you are waking up",
            button: "open your eyes",
            duration: 10000,
            causes: ["age1"]
        },
        "age1": {
            text: "you are awake",
            button: "solve",
            duration: 1000,
            causes: ["age2"]
        },
        "age2": {
            text: "you are alone",
            button: "solve",
            duration: 5000,
            notification: "pale walls and dusty floors",
            onFinish: function() {
                House.Init();
                Problems.setParent("house-panel");
                Game.travelTo(House);
            },
            causes: ["age3"]
        },
        "age3": {
            text: "you are lonely",
            button: "mourn",
            duration: 15000,
            solvable: false
        }
    },

    getProblemFromEl: function(element) {
        var elID = $(element).attr("id");
        var id = elID.substring(4, elID.length - 6);
        return Problems.ProblemList[id];
    },

    setParent: function(id) {
        var element = $("#" + id);
        this.element.appendTo(element);
        $SM.set("problems.location", id);
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