/*
 * Task class that builds a reschedulable Task. They run a
 * task function on a variable interval.
 * 
 * TODO:
 * - add support for arguments?
 * */
function Task(name, task, minInterval, maxInterval) {
    this.name = name;                   //the display name of the task, used for debugging
    this.task = task;                   //the function to run
    this.minInterval = minInterval;     //the minimum time before the task should run (in minutes)
    this.maxInterval = maxInterval;     //the maximum time before the task should run (in minutes)
}
Task.prototype = {
    //schedules the next task, usually called at the end of the task function
    scheduleNext: function(scale) {
        var interval = Math.floor(randNum(this.minInterval, this.maxInterval));
        if(scale > 0) {
            interval *= scale;
        }
        if(Game.options.fastEvents) {
            interval /= 8;
        }
        //Logger.log("Next " + this.name + " scheduled in " + interval + " minutes");
        
        this._eventTimeout = setTimeout(this.task, interval * 60 * 1000);
    }
}