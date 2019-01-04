/*
 * Task class that builds a reschedulable Task. They run a
 * task function on a variable interval.
 * 
 * TODO:
 * - add support for arguments?
 * */
function Task(name, task, minInterval, maxInterval) {
    this.name = name;                   //the display name of the task, used for debugging
    //the function to run
    this.task = function() {
        task();
        this.eventTimeout = null;
    };                   
    this.minInterval = minInterval;     //the minimum time before the task should run (in minutes)
    this.maxInterval = maxInterval;     //the maximum time before the task should run (in minutes)
}

var Tasks = {
    Task: function(name, task, minInterval, maxInterval) {
        
    },
    scheduleNext: function(t, scale) {
        var minUntilNextTask = randInt(t.minInterval, t.maxInterval);

        //apply scale
        if(scale > 0) {
            minUntilNextTask *= scale;
        }

        //speed up events with cheats
        if(Game.options.fastEvents) {
            minUntilNextTask /= 8;
        }

        Logger.log("Next " + t.name + " event scheduled in " + minUntilNextTask + " minutes");

        //if event already exists, replace it
        if(t.eventTimeout) {
            clearTimeout(t.eventTimeout);
        }

        t.eventTimeout = Game.setTimeout(t.task, minUntilNextTask * 60 * 1000);
    }
};