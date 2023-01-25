exports.handler = async function (context, event, callback) {
  console.log("Executing callback");
  const helperFunctionssPath = Runtime.getFunctions().helperFunctions.path;
  const { createCallbackTask } = require(helperFunctionssPath);

  const domain = `https://${context.DOMAIN_NAME}`;

  let twiml = new Twilio.twiml.VoiceResponse();
  const caller = event.caller;
  const callSid = event.callSid;
  const taskQueueSid = event.taskQueueSid;
  const workflowSid = event.workflowSid;

  await createCallbackTask(context, caller, callSid, workflowSid, taskQueueSid);
  twiml.say(
    "Your callback request has been delivered...An available specialist will reach out to contact you...Thank you for your call."
  );
  twiml.hangup();

  return callback(null, twiml);
};
