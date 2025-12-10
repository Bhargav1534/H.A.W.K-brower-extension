// popup.js

import {BACKEND, USERNAME, PASSWORD } from "./config.local.js";

function authHeader() {
  return "Basic " + btoa(`${USERNAME}:${PASSWORD}`);
}

document.getElementById("sendBtn").addEventListener("click", sendPrompt);
document.getElementById("promptInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendPrompt();
  }
});

async function sendPrompt() {
  const input = document.getElementById("promptInput").value;
  const box = document.getElementById("responseBox");
  box.textContent = "";

  const response = await fetch(`${BACKEND}/hawk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader()
    },
    body: JSON.stringify({ prompt: input })
  });

  // STREAMING RESPONSE READER
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    box.textContent += chunk;
    box.scrollTop = box.scrollHeight;
  }
}
