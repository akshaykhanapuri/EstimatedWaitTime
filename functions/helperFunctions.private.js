/*
 * A function that takes a Call SID as input and returns a JSON
 * object having information about the corresponding Task
 *
 */
const getTask = async (context, callSid) => {
  console.log("Executing getTask");
  const client = context.getTwilioClient();
  const task = await client.taskrouter
    .workspaces(context.WORKSPACE_SID)
    .tasks.list({
      evaluateTaskAttributes: `call_sid= '${callSid}'`,
      limit: 20,
    });
  return task[0];
};

/*
 * A function that takes TaskQueue SID as input and returns
 * cumulative statistics associated with that TaskQueue
 *
 */
const getTaskQueueStats = async (context, taskQueueSid) => {
  console.log("Executing getTaskQueueStats");
  const client = context.getTwilioClient();
  const taskQueueStats = await client.taskrouter
    .workspaces(context.WORKSPACE_SID)
    .taskQueues(taskQueueSid)
    .cumulativeStatistics({
      Minutes: context.CUMULATIVE_STAT_DURATION_MINUTES, // Determines the time duration for which the cumulative stats are fetched. It is set as an environment variable
    })
    .fetch();
  return taskQueueStats;
};

/*
 * A function that takes time duration in seconds as input and returns
 * the same duration in hours, minutes, seconds
 *
 */
const getAverageWaitTime = (t) => {
  console.log("Executing getAverageWaitTime");
  const moment = require("moment");
  const durationInSeconds = moment.duration(t.avg, "seconds");
  return {
    type: "avgWaitTime",
    hours: durationInSeconds._data.hours,
    minutes: durationInSeconds._data.minutes,
    seconds: durationInSeconds._data.seconds,
  };
};

/*
 * A function that takes Task SID and TaskQueue SID as input and returns
 * the position of the task inside the TaskQueue
 *
 */
const getTaskPosition = async (context, taskSid, taskQueueSid) => {
  console.log("Executing getTaskPosition");
  const client = context.getTwilioClient();
  const taskList = await client.taskrouter
    .workspaces(context.WORKSPACE_SID)
    .tasks.list({
      assignmentStatus: "pending, reserved",
      taskQueueSid: taskQueueSid,
      ordering: "DateCreated:asc,Priority:desc",
      limit: 20,
    });

  return taskList.findIndex((task) => task.sid === taskSid);
};

/*
 * A function that creates a callback Task when the caller presses
 * DTMF key
 *
 */
const createCallbackTask = async (
  context,
  caller,
  callSid,
  workflowSid,
  taskQueueSid
) => {
  console.log("Executing createCallbackTask");
  let callbackTaskAttributes = {
    taskType: "callback",
    to: caller,
    originalCallSid: callSid,
  };
  const client = context.getTwilioClient();
  const callbackTask = await client.taskrouter
    .workspaces(context.WORKSPACE_SID)
    .tasks.create({
      attributes: JSON.stringify(callbackTaskAttributes),
      type: "callback",
      taskChannel: "callback",
      workflowSid: workflowSid,
      taskQueueSid: taskQueueSid,
    });
  return callbackTask;
};

module.exports = {
  getTask,
  getTaskQueueStats,
  getAverageWaitTime,
  getTaskPosition,
  createCallbackTask,
};
