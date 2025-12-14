// popup.js

async function authHeader() {
  const config = await fetch(chrome.runtime.getURL("config.local.json"))
  .then(r => r.json());
  return "Basic " + btoa(`${config.USERNAME}:${config.PASSWORD}`);
}

document.getElementById("sendBtn").addEventListener("click", sendPrompt);
document.getElementById("promptInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendPrompt();
  }
});

async function sendPrompt() {
  let isLoading = false;
  if (isLoading) return; // prevent double submits
  const inputEl = document.getElementById("promptInput");
  const box = document.getElementById("responseBox");
  const sendBtn = document.getElementById("sendBtn");

  const input = inputEl.value.trim();

  // 1️⃣ Empty prompt guard
  if (!input) {
    box.textContent = "⚠️ Please enter a prompt.";
    return;
  }

  isLoading = true;

  // 2️⃣ UI → loading state
  box.textContent = "⏳ Thinking...";
  sendBtn.disabled = true;
  inputEl.disabled = true;

  try {
    const config = await fetch(chrome.runtime.getURL("config.local.json"))
      .then(r => r.json());

    const response = await fetch(`${config.BACKEND}/hawk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": await authHeader()
      },
      body: JSON.stringify({ prompt: input })
    });

    // Clear loading text once streaming starts
    box.textContent = "";

    // 3️⃣ Streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      box.textContent += "H.A.W.K.:";
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      box.textContent += chunk;
      box.scrollTop = box.scrollHeight;
    }

  } catch (err) {
    console.error(err);
    box.textContent = "❌ Error contacting backend.";
  } finally {
    // 4️⃣ Restore UI state
    isLoading = false;
    sendBtn.disabled = false;
    inputEl.disabled = false;
  }
}

