exports.handler = async function (context, event, callback) {
  console.log("Executing getWaitTime");
  const helperFunctionssPath = Runtime.getFunctions().helperFunctions.path;
  const {
    getTask,
    getTaskQueueStats,
    getAverageWaitTime,
    getTaskPosition,
  } = require(helperFunctionssPath);

  const domain = `https://${context.DOMAIN_NAME}`;

  let twiml = new Twilio.twiml.VoiceResponse();
  const caller = event.From;
  const callSid = event.CallSid;

  //Using the Call SID, obtain the Task SID and the TaskQueue SID
  const task = await getTask(context, callSid);
  const taskQueueSid = task.taskQueueSid;
  const taskSid = task.sid;
  const workflowSid = task.workflowSid;

  //Using the TaskQueue SID, fetch the Cumulative statistics for the taskqueue
  const taskQueueStats = await getTaskQueueStats(context, taskQueueSid);
  const ewt = getAverageWaitTime(
    taskQueueStats.waitDurationUntilAccepted
  ).minutes;

  //Using the Task SID and the TaskQueue SID fetch the task position in the queue
  const taskPosInQueue = await getTaskPosition(context, taskSid, taskQueueSid);

  //Inform the calling party about their Queue position and Estimated wait time in the queue
  const message = `....Your Queue Position is ${taskPosInQueue}.... The estimated wait time is ${ewt} minutes.... If you do not want to wait on hold, you can press any digit to request a callback....`;

  //Provide option to the calling party to leave a Voicemail
  let gather = twiml.gather({
    input: "dtmf",
    timeout: "1",
    action: `${domain}/callback?workflowSid=${workflowSid}&taskQueueSid=${taskQueueSid}&callSid=${callSid}&caller=${caller}`,
  });
  gather.say(message);
  gather.play(`${domain}/Music.mp3`);

  return callback(null, twiml);
};
