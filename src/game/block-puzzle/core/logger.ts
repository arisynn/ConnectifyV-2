export const logGameplayEvent = (eventName: string, payload: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[GAMEPLAY_EVENT] [${timestamp}] ${eventName}`, JSON.stringify(payload));
  // Future implementation could send this to an API or analytics service
};
