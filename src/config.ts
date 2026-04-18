export type Config = {
    AI_ENABLED: boolean;
    NOTIFIER_ENABLED: boolean;
    LOG_API_RESPONSES: boolean;
    FORCE_COMMUTING_DAY: boolean;
};

export const config: Config = {
    AI_ENABLED: process.env.AI_ENABLED !== "false",
    NOTIFIER_ENABLED: process.env.NOTIFIER_ENABLED !== "false",
    LOG_API_RESPONSES: process.env.LOG_API_RESPONSES === "true",
    FORCE_COMMUTING_DAY: process.env.FORCE_COMMUTING_DAY === "true",
};
