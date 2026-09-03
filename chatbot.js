/* OptiFeather Chat Widget — connects to the n8n AI agent webhook */
(function () {
  "use strict";

  var WEBHOOK_URL = "https://optifeather.app.n8n.cloud/webhook/optifeather-chat";
  var STORAGE_KEY = "optifeather_session_id";
  var HISTORY_KEY = "optifeather_chat_history";

  function getSessionId() {
    try {
      var id = sessionStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = "visitor-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      return "visitor-" + Date.now();
    }
  }

  function saveHistory(messages) {
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages)); } catch (e) {}
  }

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  var sessionId = getSessionId();
  var messages = loadHistory();
  var isOpen = false;
  var isSending = false;

  /* ---------- Styles ---------- */
  var style = document.createElement("style");
  style.textContent = [
    "#of-chat-launcher{position:fixed;bottom:24px;right:24px;width:58px;height:58px;border-radius:50%;",
    "background:var(--accent-gold,#c2a578);color:#0a0a0a;border:none;cursor:pointer;z-index:9999;",
    "display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(0,0,0,0.45);",
    "transition:transform 0.25s cubic-bezier(0.16,1,0.3,1),box-shadow 0.25s;font-family:'Manrope',sans-serif;}",
    "#of-chat-launcher:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 12px 34px rgba(194,165,120,0.35);}",
    "#of-chat-launcher svg{width:26px;height:26px;}",
    "#of-chat-launcher .of-close-icon{display:none;}",
    "#of-chat-launcher.open .of-chat-icon{display:none;}",
    "#of-chat-launcher.open .of-close-icon{display:block;}",
    "#of-chat-dot{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#ff5b5b;border:2px solid #0a0a0a;}",

    "#of-chat-window{position:fixed;bottom:94px;right:24px;width:370px;max-width:calc(100vw - 32px);",
    "height:520px;max-height:calc(100vh - 140px);background:#0d0d0f;border:1px solid rgba(194,165,120,0.25);",
    "border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.55);display:none;flex-direction:column;",
    "overflow:hidden;z-index:9999;font-family:'Manrope',sans-serif;opacity:0;transform:translateY(16px);",
    "transition:opacity 0.25s cubic-bezier(0.16,1,0.3,1),transform 0.25s cubic-bezier(0.16,1,0.3,1);}",
    "#of-chat-window.open{display:flex;opacity:1;transform:translateY(0);}",

    "#of-chat-header{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;",
    "align-items:center;gap:10px;background:rgba(255,255,255,0.02);}",
    "#of-chat-header .of-avatar{width:34px;height:34px;border-radius:50%;background:var(--accent-gold,#c2a578);",
    "display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#0a0a0a;font-size:14px;}",
    "#of-chat-header .of-title{font-size:14px;font-weight:600;color:#f4f4f4;}",
    "#of-chat-header .of-status{font-size:11px;color:#8a8a8a;display:flex;align-items:center;gap:5px;}",
    "#of-chat-header .of-status-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;}",

    "#of-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}",
    "#of-chat-body::-webkit-scrollbar{width:5px;}",
    "#of-chat-body::-webkit-scrollbar-thumb{background:rgba(194,165,120,0.3);border-radius:10px;}",

    ".of-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;",
    "white-space:pre-wrap;word-wrap:break-word;animation:of-fade-in 0.25s ease;}",
    "@keyframes of-fade-in{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}",
    ".of-msg.bot{align-self:flex-start;background:rgba(255,255,255,0.06);color:#f4f4f4;",
    "border-bottom-left-radius:4px;}",
    ".of-msg.user{align-self:flex-end;background:var(--accent-gold,#c2a578);color:#0a0a0a;",
    "border-bottom-right-radius:4px;}",
    ".of-msg strong{font-weight:700;}",

    "#of-typing{align-self:flex-start;display:flex;gap:4px;padding:10px 13px;background:rgba(255,255,255,0.06);",
    "border-radius:14px;border-bottom-left-radius:4px;}",
    "#of-typing span{width:6px;height:6px;border-radius:50%;background:#8a8a8a;animation:of-bounce 1.2s infinite ease-in-out;}",
    "#of-typing span:nth-child(2){animation-delay:0.15s;} #of-typing span:nth-child(3){animation-delay:0.3s;}",
    "@keyframes of-bounce{0%,60%,100%{transform:translateY(0);opacity:0.5;}30%{transform:translateY(-4px);opacity:1;}}",

    "#of-quick-replies{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 12px;}",
    ".of-quick-btn{font-family:'Manrope',sans-serif;font-size:11.5px;padding:6px 11px;border-radius:20px;",
    "border:1px solid rgba(194,165,120,0.35);background:transparent;color:#c2a578;cursor:pointer;",
    "transition:all 0.2s ease;white-space:nowrap;}",
    ".of-quick-btn:hover{background:rgba(194,165,120,0.12);}",

    "#of-chat-input-row{display:flex;align-items:center;gap:8px;padding:12px 14px;",
    "border-top:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);}",
    "#of-chat-input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);",
    "border-radius:20px;padding:9px 14px;color:#f4f4f4;font-size:13px;font-family:'Manrope',sans-serif;",
    "outline:none;transition:border-color 0.2s;}",
    "#of-chat-input:focus{border-color:rgba(194,165,120,0.5);}",
    "#of-chat-input::placeholder{color:#55555a;}",
    "#of-send-btn{width:34px;height:34px;border-radius:50%;background:var(--accent-gold,#c2a578);",
    "border:none;color:#0a0a0a;cursor:pointer;display:flex;align-items:center;justify-content:center;",
    "flex-shrink:0;transition:opacity 0.2s;}",
    "#of-send-btn:disabled{opacity:0.4;cursor:not-allowed;}",
    "#of-send-btn svg{width:16px;height:16px;}",

    "@media (max-width:480px){#of-chat-window{right:16px;left:16px;width:auto;bottom:88px;}",
    "#of-chat-launcher{right:16px;bottom:16px;}}"
  ].join("");
  document.head.appendChild(style);

  /* ---------- DOM ---------- */
  var launcher = document.createElement("button");
  launcher.id = "of-chat-launcher";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.innerHTML =
    '<svg class="of-chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
    '<svg class="of-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '<span id="of-chat-dot"></span>';

  var win = document.createElement("div");
  win.id = "of-chat-window";
  win.innerHTML =
    '<div id="of-chat-header">' +
      '<div class="of-avatar">OF</div>' +
      '<div><div class="of-title">OptiFeather Assistant</div>' +
      '<div class="of-status"><span class="of-status-dot"></span>Online</div></div>' +
    '</div>' +
    '<div id="of-chat-body"></div>' +
    '<div id="of-quick-replies"></div>' +
    '<div id="of-chat-input-row">' +
      '<input id="of-chat-input" type="text" placeholder="Ask about services or pricing…" autocomplete="off" />' +
      '<button id="of-send-btn" aria-label="Send">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button>' +
    '</div>';

  document.addEventListener("DOMContentLoaded", mount);
  if (document.readyState === "complete" || document.readyState === "interactive") mount();

  function mount() {
    if (document.getElementById("of-chat-launcher")) return;
    document.body.appendChild(launcher);
    document.body.appendChild(win);

    launcher.addEventListener("click", toggleChat);
    document.getElementById("of-send-btn").addEventListener("click", sendCurrentInput);
    document.getElementById("of-chat-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") sendCurrentInput();
    });

    renderQuickReplies([
      "What services do you offer?",
      "Estimate a price",
      "Book a call"
    ]);

    if (messages.length === 0) {
      pushMessage("bot", "Hi! I'm the OptiFeather assistant 👋 I can answer questions about our services and help estimate a price. What are you looking to do?");
    } else {
      messages.forEach(function (m) { renderMessage(m.role, m.text); });
      scrollToBottom();
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    launcher.classList.toggle("open", isOpen);
    win.classList.toggle("open", isOpen);
    var dot = document.getElementById("of-chat-dot");
    if (dot) dot.style.display = isOpen ? "none" : "block";
    if (isOpen) {
      setTimeout(function () {
        var input = document.getElementById("of-chat-input");
        if (input) input.focus();
      }, 200);
      scrollToBottom();
    }
  }

  function renderQuickReplies(options) {
    var wrap = document.getElementById("of-quick-replies");
    wrap.innerHTML = "";
    options.forEach(function (label) {
      var btn = document.createElement("button");
      btn.className = "of-quick-btn";
      btn.textContent = label;
      btn.addEventListener("click", function () { sendMessage(label); });
      wrap.appendChild(btn);
    });
  }

  function pushMessage(role, text) {
    messages.push({ role: role, text: text });
    saveHistory(messages);
    renderMessage(role, text);
    scrollToBottom();
  }

  function renderMessage(role, text) {
    var body = document.getElementById("of-chat-body");
    var div = document.createElement("div");
    div.className = "of-msg " + (role === "user" ? "user" : "bot");
    div.innerHTML = formatText(text);
    body.appendChild(div);
  }

  function formatText(text) {
    var safe = String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/\n/g, "<br>");
    return safe;
  }

  function scrollToBottom() {
    var body = document.getElementById("of-chat-body");
    if (body) body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    var body = document.getElementById("of-chat-body");
    var el = document.createElement("div");
    el.id = "of-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById("of-typing");
    if (el) el.remove();
  }

  function sendCurrentInput() {
    var input = document.getElementById("of-chat-input");
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMessage(text);
  }

  function sendMessage(text) {
    if (isSending) return;
    isSending = true;
    document.getElementById("of-send-btn").disabled = true;

    pushMessage("user", text);
    showTyping();

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId: sessionId })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Request failed: " + res.status);
        return res.json();
      })
      .then(function (data) {
        hideTyping();
        var reply = (data && (data.reply || data.output)) ||
          "Sorry, I didn't quite catch that. Could you rephrase?";
        pushMessage("bot", reply);
      })
      .catch(function () {
        hideTyping();
        pushMessage(
          "bot",
          "Hmm, I'm having trouble connecting right now. You can reach us directly on the Contact page, or try again in a moment."
        );
      })
      .finally(function () {
        isSending = false;
        document.getElementById("of-send-btn").disabled = false;
      });
  }
})();
