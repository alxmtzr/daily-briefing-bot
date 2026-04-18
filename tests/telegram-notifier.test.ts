import { vi, it, describe, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { TelegramNotifier } from "../src/notifiers/telegram-notifier";

vi.mock("axios");

describe("TelegramNotifier", () => {
    beforeEach(() => {
        process.env.NOTIFIER_BOT_TOKEN = "test-token";
        process.env.NOTIFIER_CHAT_ID = "test-chat-id";
    });

    afterEach(() => {
        delete process.env.NOTIFIER_BOT_TOKEN;
        delete process.env.NOTIFIER_CHAT_ID;
    });

    it("throws if NOTIFIER_BOT_TOKEN is not set", () => {
        delete process.env.NOTIFIER_BOT_TOKEN;
        expect(() => new TelegramNotifier()).toThrow("NOTIFIER_BOT_TOKEN is not set");
    });

    it("throws if NOTIFIER_CHAT_ID is not set", () => {
        delete process.env.NOTIFIER_CHAT_ID;
        expect(() => new TelegramNotifier()).toThrow("NOTIFIER_CHAT_ID is not set");
    });

    it("sends a POST request to the correct Telegram URL with HTML parse mode", async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: { ok: true } });
        const notifier = new TelegramNotifier();

        await notifier.notify("Hello, <b>world</b>!");

        expect(axios.post).toHaveBeenCalledWith(
            "https://api.telegram.org/bottest-token/sendMessage",
            {
                chat_id: "test-chat-id",
                text: "Hello, <b>world</b>!",
                parse_mode: "HTML",
            }
        );
    });

    it("propagates errors from the Telegram API", async () => {
        vi.mocked(axios.post).mockRejectedValue(new Error("400 Bad Request"));
        const notifier = new TelegramNotifier();

        await expect(notifier.notify("Hello!")).rejects.toThrow("400 Bad Request");
    });
});
