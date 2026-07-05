"use client";

import { useRef, useEffect, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import type { TicketReply } from "@/src/features/support/types";
import { Button } from "@/components/ui/button";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export function TicketChat({
  replies,
  onSend,
  sending,
}: {
  replies: TicketReply[];
  onSend: (message: string, files: File[]) => Promise<void>;
  sending?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const submit = async () => {
    if (!message.trim() && files.length === 0) return;
    await onSend(message.trim(), files);
    setMessage("");
    setFiles([]);
  };

  return (
    <div className="flex h-[min(520px,70vh)] flex-col rounded-xl border border-[#f1f5f9] bg-[#ffffff]">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {replies.length === 0 ? (
          <p className="text-center text-sm text-[#5c6a7f]">No messages yet. Start the conversation.</p>
        ) : (
          replies.map((r) => {
            const isAdmin = r.sender_type === "admin";
            const isCustomer = r.sender_type === "customer";
            return (
              <div
                key={r.reply_id}
                className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    isAdmin
                      ? "bg-[#2563eb] text-[#ffffff]"
                      : isCustomer
                        ? "bg-[#f1f5f9] text-[#1e293b]"
                        : "bg-[#fffbeb] text-[#78350f]"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-medium uppercase opacity-70">{r.sender_type}</p>
                  <p className="whitespace-pre-wrap">{r.message}</p>
                  {Array.isArray(r.attachment_urls) && r.attachment_urls.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs underline">
                      {r.attachment_urls.map((url, i) => (
                        <li key={i}>
                          <a href={`/${url.replace(/^\//, "")}`} target="_blank" rel="noreferrer">
                            Attachment {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className={`mt-1 text-[10px] ${isAdmin ? "text-[#dbeafe]" : "text-[#5c6a7f]"}`}>
                    {formatTime(r.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a replyâ€¦"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm outline-none focus:border-[#93c5fd]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <div className="flex flex-col gap-1">
            <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-[#53697e] hover:bg-[#f8fafc]">
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []).filter((f) => f.size <= MAX_ATTACHMENT_BYTES))}
              />
            </label>
            <Button size="sm" loading={sending} onClick={() => void submit()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {files.length > 0 ? (
          <p className="mt-1 text-xs text-[#53697e]">{files.length} file(s) attached</p>
        ) : null}
      </div>
    </div>
  );
}

