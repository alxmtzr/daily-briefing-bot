export const config = {
    AI_ENABLED: process.env.AI_ENABLED !== "false",
    NOTIFIER_ENABLED: process.env.NOTIFIER_ENABLED !== "false",
    LOG_API_RESPONSES: process.env.LOG_API_RESPONSES === "true",
};
