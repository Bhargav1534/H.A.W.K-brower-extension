async function init() {
  const config = await fetch(chrome.runtime.getURL("config.local.json"))
    .then(r => r.json());

  const BACKEND = config.BACKEND;
  const USERNAME = config.USERNAME;
  const PASSWORD = config.PASSWORD;

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
        body: JSON.stringify(payload)
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

  chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.tabs.sendMessage(tabId, { action: "COLLECT_DATA" });
  });

  chrome.webNavigation.onCompleted.addListener(details => {
    if (details.frameId === 0) {
      chrome.tabs.sendMessage(details.tabId, { action: "COLLECT_DATA" });
    }
  });

  console.log("Hawk Service Worker initialized.");
}

init();
