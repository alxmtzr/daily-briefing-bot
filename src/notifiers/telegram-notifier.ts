import axios from "axios";
import { Notifier } from "../interfaces/notifier";

export class TelegramNotifier implements Notifier {
    private readonly BASE_URL = "https://api.telegram.org/bot";
    private readonly token: string;
    private readonly chatId: string;

    constructor() {
        const token = process.env.NOTIFIER_BOT_TOKEN;
        const chatId = process.env.NOTIFIER_CHAT_ID;
        if (!token) throw new Error("NOTIFIER_BOT_TOKEN is not set");
        if (!chatId) throw new Error("NOTIFIER_CHAT_ID is not set");
        this.token = token;
        this.chatId = chatId;
    }

    async notify(message: string): Promise<void> {
        await axios.post(`${this.BASE_URL}${this.token}/sendMessage`, {
            chat_id: this.chatId,
            text: message,
            parse_mode: "HTML",
        });
    }
}
