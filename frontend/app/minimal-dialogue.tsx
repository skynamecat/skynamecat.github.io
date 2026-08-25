"use client";

import { useRef, useState, type FormEvent } from "react";

type Message = {
  id: string;
  role: "site" | "visitor";
  text: string;
};

type ChatResponse = {
  code: number;
  data?: {
    sessionId: string;
    messageId: string;
    answer: string;
  };
};

const initialMessages: Message[] = [
  { id: "intro-1", role: "site", text: "你好，我是 skynamecat。" },
  { id: "intro-2", role: "visitor", text: "你平时在做什么？" },
  { id: "intro-3", role: "site", text: "写代码、整理知识，也把偶尔冒出来的灵感做成小东西。" },
  { id: "intro-4", role: "visitor", text: "这里可以看到什么？" },
  { id: "intro-5", role: "site", text: "想法、作品，以及一些不急着抵达的探索。慢慢看，随便坐。" },
];

function createReply(question: string) {
  if (/你好|嗨|hello/i.test(question)) return "你好呀，很高兴在这里遇见你。";
  if (/作品|项目|做过/.test(question)) return "我主要在做 Web、AI 和一些让数字生活更舒服的小项目。";
  if (/联系|邮箱|找到你/.test(question)) return "你可以在 GitHub 搜索 skynamecat 找到我。";
  if (/庞菠菠|宠物/.test(question)) return "庞菠菠住在标准模式里，切回去就能和她互动。";
  if (/你是谁|介绍|关于你/.test(question)) return "我是 skynamecat，一个喜欢简单界面、也喜欢复杂问题的创造者。";
  return "这个问题我先记下了。这里仍在慢慢生长，欢迎过一阵再来看看。";
}

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const randomPart = Math.random().toString(36).slice(2);
  return `message-${Date.now().toString(36)}-${randomPart}`;
}

export function MinimalDialogue() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const sessionId = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isReplying) return;

    const visitorId = createMessageId();
    setMessages((current) => [...current, { id: visitorId, role: "visitor", text: question }]);
    setInput("");
    setIsReplying(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: question }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);

      const payload = (await response.json()) as ChatResponse;
      if (payload.code !== 0 || !payload.data?.answer) throw new Error("Invalid chat response");

      sessionId.current = payload.data.sessionId;
      setMessages((current) => [
        ...current,
        { id: payload.data!.messageId, role: "site", text: payload.data!.answer },
      ]);
    } catch {
      // Keep the static export pleasant during local/offline previews.
      setMessages((current) => [
        ...current,
        { id: createMessageId(), role: "site", text: createReply(question) },
      ]);
    } finally {
      window.clearTimeout(timeout);
      setIsReplying(false);
    }
  }

  return (
    <>
      <div className="minimal-dialogue" aria-live="polite">
        {messages.map((message) => (
          <article
            className={`minimal-message from-${message.role}${message.id === "intro-1" ? " is-lead" : ""}`}
            key={message.id}
          >
            <span>{message.role === "site" ? "S" : "你"}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
      <form className="minimal-dock" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="与 skynamecat 对话"
          placeholder="问我点什么…"
          autoComplete="off"
          maxLength={500}
          disabled={isReplying}
        />
        <button type="submit" disabled={!input.trim() || isReplying} aria-label="发送消息">
          {isReplying ? "·" : "↑"}
        </button>
      </form>
    </>
  );
}
