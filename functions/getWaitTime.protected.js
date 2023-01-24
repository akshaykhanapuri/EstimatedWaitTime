exports.handler = async function (context, event, callback) {
  const helperFunctionssPath = Runtime.getFunctions().helperFunctions.path;
  const {
    getTask,
    getTaskQueueStats,
    getAverageWaitTime,
    getTaskPosition,
    createCallbackTask,
  } = require(helperFunctionssPath);

  const domain = `https://${context.DOMAIN_NAME}`;
  const { mode } = event;

  let twiml = new Twilio.twiml.VoiceResponse();
  const caller = event.From;
  const callSid = event.CallSid;
  let taskQueueSid = "";
  let workflowSid = "";
  let taskSid = "";

  switch (mode) {
    case "main":
      //Using the Call SID, obtain the Task SID and the TaskQueue SID
      const task = await getTask(context, callSid);
      taskQueueSid = task.taskQueueSid;
      taskSid = task.sid;
      workflowSid = task.workflowSid;

      //Using the TaskQueue SID, fetch the Cumulative statistics for the taskqueue
      const taskQueueStats = await getTaskQueueStats(context, taskQueueSid);
      const ewt = getAverageWaitTime(
        taskQueueStats.waitDurationUntilAccepted
      ).minutes;

      //Using the Task SID and the TaskQueue SID fetch the task position in the queue
      const taskPosInQueue = await getTaskPosition(
        context,
        taskSid,
        taskQueueSid
      );

      //Inform the calling party about their Queue position and Estimated wait time in the queue
      const message = `....Your Queue Position is ${taskPosInQueue}.... The estimated wait time is ${ewt} minutes.... If you do not want to wait on hold, you can press any digit to request a callback....`;

      //Provide option to the calling party to leave a Voicemail
      let gather = twiml.gather({
        input: "dtmf",
        timeout: "1",
        action: `${domain}/getWaitTime?mode=callback&workflowSid=${workflowSid}&taskQueueSid=${taskQueueSid}`,
      });
      gather.say(message);
      gather.play(`${domain}/Music.mp3`);
      break;

    case "callback":
      taskQueueSid = event.taskQueueSid;
      workflowSid = event.workflowSid;
      await createCallbackTask(
        context,
        caller,
        callSid,
        workflowSid,
        taskQueueSid
      );
      twiml.say(
        "Your callback request has been delivered...An available specialist will reach out to contact you...Thank you for your call."
      );
      twiml.hangup();
      break;

    default:
      return callback(500, null);
  }

  return callback(null, twiml);
};
