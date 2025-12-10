// content.js

function getDOMText() {
  return document.body?.innerText || "";
}

function getSelectedText() {
  return window.getSelection()?.toString() || "";
}

function collectPageData() {
  const data = {
    url: window.location.href,
    dom: getDOMText(),
    highlight: getSelectedText()
  };

  chrome.runtime.sendMessage({
    type: "PAGE_DATA",
    data
  });
}

// Listen for background request
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "COLLECT_DATA") {
    collectPageData();
  }
});

// Also detect whenever user selects text
document.addEventListener("mouseup", () => {
  const selected = getSelectedText();
  if (selected.trim() !== "") {
    chrome.runtime.sendMessage({
      type: "PAGE_DATA",
      data: {
        url: window.location.href,
        dom: getDOMText(),
        highlight: selected
      }
    });
  }
});
