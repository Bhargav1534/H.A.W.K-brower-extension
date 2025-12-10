// content.js

// ---------------------------------------
// 1. Readability extraction
// ---------------------------------------

function extractReadable() {
  try {
    const clone = document.cloneNode(true);
    const article = new Readability(clone).parse();

    if (!article) return null;

    return {
      mode: "readable",
      title: article.title || document.title,
      text: article.textContent || "",
      // html: article.content || "",
      excerpt: article.excerpt || ""
    };
  } catch (e) {
    return null;
  }
}


// ---------------------------------------
// 2. Shadow DOM + visible text extractor
// ---------------------------------------
function extractVisibleText() {
  const getText = (node) => {
    let out = "";

    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent.trim();
      if (t) out += t + " ";
    }

    if (node.shadowRoot) {
      out += getText(node.shadowRoot);
    }

    for (let child of node.childNodes) {
      out += getText(child);
    }

    return out;
  };

  return {
    mode: "visible-text",
    text: getText(document.body).trim()
  };
}

// ---------------------------------------
// 3. Structured extractor
// ---------------------------------------
function extractStructured() {
  const headings = [...document.querySelectorAll("h1, h2, h3")]
    .map(el => el.innerText.trim())
    .filter(Boolean);

  const paragraphs = [...document.querySelectorAll("p")]
    .map(el => el.innerText.trim())
    .filter(Boolean);

  const links = [...document.querySelectorAll("a")]
    .map(a => a.href)
    .filter(Boolean);

  return {
    mode: "structured",
    title: document.title,
    headings,
    paragraphs,
    links
  };
}

// ---------------------------------------
// 4. Best-fit extraction selector
// ---------------------------------------
function collectBest() {
  const readable = extractReadable();
  if (readable && readable.text.length > 50) return readable;

  const structured = extractStructured();
  if (structured.paragraphs.length || structured.headings.length) return structured;

  return extractVisibleText();
}

// ---------------------------------------
// 5. Final unified payload
// ---------------------------------------
function buildPayload(extra = {}) {
  const extracted = collectBest();
  const MAX_CHARS = 20000;

  return {
    url: location.href,
    title: document.title,
    mode: extracted.mode,
    text: extracted.text?.slice(0, MAX_CHARS) || "",
    headings: extracted.headings || [],
    paragraphs: extracted.paragraphs || [],
    links: extracted.links || [],
    // html: extracted.html || "",
    excerpt: extracted.excerpt || "",
    highlight: extra.highlight || "",
    timestamp: Date.now()
  };
}

// ---------------------------------------
// 6. Debounced background updates
// ---------------------------------------
let debounceTimer = null;

function sendUpdateDebounced() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(sendUpdate, 250);
}

function sendUpdate(extra = {}) {
  if (!chrome.runtime?.id) return;  // prevents invalid extension errors

  try {
    chrome.runtime.sendMessage({
      type: "PAGE_DATA",
      data: buildPayload(extra)
    });
  } catch (e) {
    console.warn("Send failed:", e);
  }
}


// ---------------------------------------
// 7. Background request: collect current page
// ---------------------------------------
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "COLLECT_DATA") {
    sendUpdate();
  }
});

// ---------------------------------------
// 8. User highlight detection
// ---------------------------------------
document.addEventListener("mouseup", () => {
  const selected = window.getSelection()?.toString() || "";
  if (selected.trim() !== "") {
    sendUpdate({ highlight: selected });
  }
});

// ---------------------------------------
// 9. Watch page for dynamic changes
// ---------------------------------------
const observer = new MutationObserver(() => {
  sendUpdateDebounced();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

console.log("H.A.W.K advanced content extractor active.");
