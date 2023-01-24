/*
 * A function that takes a Call SID as input and returns a JSON
 * object having information about the corresponding Task
 *
 */
const getTask = async (context, callSid) => {
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
  const client = context.getTwilioClient();
  const taskQueueStats = await client.taskrouter
    .workspaces(context.WORKSPACE_SID)
    .taskQueues(taskQueueSid)
    .cumulativeStatistics({
      Minutes: 5, // Cumulative statistics for the past 5 minutes
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
