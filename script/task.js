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

Task.prototype.scheduleNext = function(scale) {
    var minUntilNextTask = randInt(this.minInterval, this.maxInterval);

        //apply scale
        if(scale > 0) {
            minUntilNextTask *= scale;
        }

        //speed up events with cheats
        if(Game.options.fastEvents) {
            minUntilNextTask /= 8;
        }

        Logger.log("Next " + this.name + " event scheduled in " + minUntilNextTask + " minutes");

        //if event already exists, replace it
        if(this.eventTimeout) {
            clearTimeout(this.eventTimeout);
        }

        this.eventTimeout = Game.setTimeout(this.task, minUntilNextTask * 60 * 1000);
}