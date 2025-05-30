const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("login-btn");
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

let socket;
let currentUsername = "";

function addMessage(username, text, time) {
  const msgElement = document.createElement("div");
  msgElement.className = "message";
  msgElement.innerHTML = `
    <span class="username">${username}</span>
    <span class="time">${time}</span>
    <div class="text">${text}</div>
  `;
  messagesDiv.appendChild(msgElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
  const sysElement = document.createElement("div");
  sysElement.className = "system-message";
  sysElement.textContent = text;
  messagesDiv.appendChild(sysElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${window.location.host}`);

  socket.onopen = () => {
    console.log("Connected to server");
    if (currentUsername) {
      addSystemMessage(`Вы вошли как ${currentUsername}`);
    }
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "history") {
      data.messages.forEach((msg) => {
        addMessage(msg.username, msg.text, msg.time);
      });
    } else if (data.type === "message") {
      addMessage(data.username, data.text, data.time);
    }
  };

  socket.onclose = () => {
    addSystemMessage("Соединение прервано. Переподключаемся...");
    setTimeout(connect, 3000);
  };
}

loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (username) {
    currentUsername = username;
    localStorage.setItem("username", username);
    loginContainer.style.display = "none";
    chatContainer.style.display = "block";
    connect();
    messageInput.focus();
  }
});

sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "message",
        username: currentUsername,
        text: text,
      })
    );
    messageInput.value = "";
  }
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

if (localStorage.getItem("username")) {
  usernameInput.value = localStorage.getItem("username");
}
