"use client";
import { useState } from "react";

export default function Messages() {
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");

  const sendMessage = async () => {
    await fetch("/api/superadmin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: "superadmin", receiverId, content }),
    });
    alert("Message sent");
    setReceiverId("");
    setContent("");
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Send Messages</h2>
      <input
        value={receiverId}
        onChange={e => setReceiverId(e.target.value)}
        placeholder="Receiver ID"
        className="w-full p-2 mb-2 rounded"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Message Content"
        className="w-full p-2 mb-2 rounded"
      />
      <button
        onClick={sendMessage}
        className="bg-[#6c63ff] px-4 py-2 rounded"
      >
        Send Message
      </button>
    </div>
  );
}
