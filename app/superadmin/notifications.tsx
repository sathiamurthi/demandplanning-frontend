"use client";
import { useState } from "react";

export default function Notifications() {
  const [message, setMessage] = useState("");
  const [targetId, setTargetId] = useState("");

  const sendNotification = async () => {
    await fetch("/api/superadmin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, message }),
    });
    alert("Notification sent");
    setMessage("");
    setTargetId("");
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Send Notifications</h2>
      <input
        value={targetId}
        onChange={e => setTargetId(e.target.value)}
        placeholder="Target User/Tenant ID"
        className="w-full p-2 mb-2 rounded"
      />
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Notification Message"
        className="w-full p-2 mb-2 rounded"
      />
      <button
        onClick={sendNotification}
        className="bg-[#6c63ff] px-4 py-2 rounded"
      >
        Send Notification
      </button>
    </div>
  );
}
