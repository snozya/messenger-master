const STORAGE_KEY = "master-messenger-chats";
const THEME_KEY = "master-messenger-theme";

const seedChats = [
  {
    id: "design-team",
    name: "Design Team",
    status: "online",
    messages: [
      { text: "Привет! Проверишь макеты к релизу?", direction: "in", at: "09:30" },
      { text: "Да, уже смотрю. Вернусь с комментариями через 15 мин.", direction: "out", at: "09:31" },
    ],
  },
  {
    id: "family",
    name: "Семья",
    status: "last seen recently",
    messages: [
      { text: "Не забудь купить хлеб 🍞", direction: "in", at: "08:42" },
      { text: "Уже в списке, спасибо!", direction: "out", at: "08:45" },
    ],
  },
  {
    id: "backend-sync",
    name: "Backend Sync",
    status: "online",
    messages: [{ text: "Сегодня деплой в 18:00", direction: "in", at: "07:55" }],
  },
];

const state = {
  chats: loadChats(),
  activeChatId: null,
  query: "",
};

const chatList = document.getElementById("chatList");
const messagesEl = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const composer = document.getElementById("composer");
const input = document.getElementById("messageInput");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");
const template = document.getElementById("chatItemTemplate");

init();

function init() {
  applyTheme(loadTheme());

  state.activeChatId = state.chats[0]?.id ?? null;

  renderChats();
  renderMessages();

  composer.addEventListener("submit", sendMessage);
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderChats();
  });

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

function loadChats() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedChats);

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    return structuredClone(seedChats);
  }

  return structuredClone(seedChats);
}

function persistChats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.chats));
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
}

function activeChat() {
  return state.chats.find((chat) => chat.id === state.activeChatId) || null;
}

function renderChats() {
  chatList.innerHTML = "";

  const filtered = state.chats.filter((chat) => {
    if (!state.query) return true;
    const last = chat.messages.at(-1)?.text ?? "";
    return (
      chat.name.toLowerCase().includes(state.query) ||
      last.toLowerCase().includes(state.query)
    );
  });

  filtered.forEach((chat) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".chat-name").textContent = chat.name;
    node.querySelector(".chat-preview").textContent = chat.messages.at(-1)?.text || "Нет сообщений";
    node.querySelector(".chat-time").textContent = chat.messages.at(-1)?.at || "";

    if (chat.id === state.activeChatId) {
      node.classList.add("active");
    }

    node.addEventListener("click", () => {
      state.activeChatId = chat.id;
      renderChats();
      renderMessages();
      input.focus();
    });

    chatList.appendChild(node);
  });
}

function renderMessages() {
  messagesEl.innerHTML = "";

  const chat = activeChat();
  if (!chat) {
    chatHeader.querySelector("h2").textContent = "Выберите чат";
    chatHeader.querySelector("span").textContent = "";
    return;
  }

  chatHeader.querySelector("h2").textContent = chat.name;
  chatHeader.querySelector("span").textContent = chat.status;

  chat.messages.forEach((message) => {
    const bubble = document.createElement("article");
    bubble.className = `message ${message.direction}`;
    bubble.textContent = message.text;

    const time = document.createElement("small");
    time.textContent = message.at;
    bubble.appendChild(time);

    messagesEl.appendChild(bubble);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sendMessage(event) {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const chat = activeChat();
  if (!chat) return;

  chat.messages.push({
    text,
    direction: "out",
    at: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  });

  input.value = "";
  persistChats();
  renderChats();
  renderMessages();

  window.setTimeout(() => {
    chat.messages.push({
      text: "Автоответ Master Messenger: сообщение доставлено ✅",
      direction: "in",
      at: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    });
    persistChats();
    renderChats();
    renderMessages();
  }, 650);
}
