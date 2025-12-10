// background.js

import {BACKEND, USERNAME, PASSWORD } from "./config.local.js";

function authHeader() {
  return "Basic " + btoa(`${USERNAME}:${PASSWORD}`);
}

async function sendActivity(payload) {
  try {
    await fetch(`${BACKEND}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader()
      },
      body: JSON.stringify(payload) // url, dom, highlight
    });
  } catch (e) {
    console.error("Activity error:", e);
  }
}

// Listen for data from content script
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "PAGE_DATA") {
    sendActivity(msg.data);
  }
});

// Trigger content script when navigation completes
chrome.webNavigation.onCompleted.addListener(details => {
  if (details.frameId === 0) {
    chrome.tabs.sendMessage(details.tabId, { action: "COLLECT_DATA" });
  }
});
