const socket = io("/");
const videoGrid = document.getElementById("video-grid");

let password;
let user = localStorage.getItem("user"); // Загружаем имя пользователя из localStorage

// Проверка, есть ли авторизация
if (localStorage.getItem("password") === "1804" && user) {
  // Уже авторизованы, загружаем ранее сохраненные данные
} else {
  while (true) {
    // Запрос пароля
    password = prompt("Пароль назови");
    if (password === "1804") { 
      // Запрос имени
      while (true) {
        user = prompt("Назовись").trim(); // Убираем пробелы в начале и конце
        if (user) {
          // Сохраняем данные в localStorage
          localStorage.setItem("password", password);
          localStorage.setItem("user", user);
          break; // Выход из цикла ввода имени
        } else {
          alert("Надо имя ввести"); // Если имя пустое
        }
      }
      break; // Выход из общего цикла, если пароль и имя введены
    } else {
      alert("Пароль неверный");
    }
  }
}

var peer = new Peer({
  host: "xn--b1afhjbe8bm1g2a.xn--p1ai", // домен нужно указать в Punycode формате
  port: 443,
  path: "/peerjs",
  secure: true, // если используется HTTPS
});

let myAudioStream;
let microphoneEnabled = true; // Статус микрофона, по умолчанию включен
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: false, // Мы работаем только с аудио
  })
  .then((stream) => {
    myAudioStream = stream;
    addAudioStream(stream, user, peer.id); // Добавляем свой поток с именем

    peer.on("call", (call) => {
      console.log("Someone is calling me");
      call.answer(stream);
      call.on("stream", (userAudioStream) => {
        addAudioStream(userAudioStream, call.metadata.userName, call.peer); // Используем имя звонящего
      });
    });

    socket.on("user-connected", (userId, userName) => {
      console.log(`User connected: ${userName} (ID: ${userId})`);
      connectToNewUser(userId, stream, userName); // Передаем userName при подключении нового пользователя
    });

    socket.on("user-disconnected", (userId) => {
      console.log(`User disconnected: ${userId}`);
      const userContainer = document.querySelector(`.user-container[data-id="${userId}"]`);
      if (userContainer) {
        userContainer.remove(); // Удаляем контейнер пользователя
      }
    });

    socket.on("microphone-status", (userId, status) => {
      console.log(`User ${userId} microphone status: ${status}`);
      const userContainer = document.querySelector(`.user-container[data-id="${userId}"]`);
      if (userContainer) {
        const audio = userContainer.querySelector("audio");
        if (audio) {
          audio.muted = !status; // Мутим или размущаем аудио
        }
      }
    });
  });

const connectToNewUser = (userId, stream, userName) => {
  console.log(`I am calling ${userName} (ID: ${userId})`);
  const call = peer.call(userId, stream, {
    metadata: { userName: user }, // Передаем свое имя при звонке
  });

  call.on("stream", (userAudioStream) => {
    addAudioStream(userAudioStream, userName, userId); // Добавляем поток с именем
  });
};

peer.on("open", (id) => {
  console.log(`My peer ID is ${id}`);
  socket.emit("join-room", "general", id, user); // Передаем имя пользователя на сервер
});

const addAudioStream = (stream, userName, userId) => {
  const existingUserContainer = document.querySelector(`.user-container[data-id="${userId}"]`);
  if (existingUserContainer) {
    return; // Если контейнер уже существует, не добавляем новый
  }

  const userContainer = document.createElement("div");
  userContainer.classList.add("user-container");
  userContainer.dataset.name = userName;
  userContainer.dataset.id = userId;

  const img = document.createElement("img");
  img.src = "132123.jpg"; // Путь к картинке
  img.alt = userName;
  img.classList.add("user-image");

  const nameLabel = document.createElement("div");
  nameLabel.textContent = userName;
  nameLabel.classList.add("name-label");

  userContainer.appendChild(img);
  userContainer.appendChild(nameLabel);

  if (userId !== peer.id) {
    const audio = document.createElement("audio");
    audio.srcObject = stream;
    audio.addEventListener("loadedmetadata", () => {
      audio.play();
    });
    userContainer.appendChild(audio);
  }

  videoGrid.append(userContainer);
};

// Логика для кнопок
const muteButton = document.querySelector("#muteButton");
const disconnectBtn = document.querySelector("#disconnect");

muteButton.addEventListener("click", () => {
  microphoneEnabled = !microphoneEnabled;
  myAudioStream.getAudioTracks()[0].enabled = microphoneEnabled;
  socket.emit("microphone-status", peer.id, microphoneEnabled);

  html = microphoneEnabled
    ? `<i class="fas fa-microphone"></i>`
    : `<i class="fas fa-microphone-slash"></i>`;
  muteButton.classList.toggle("background_red");
  muteButton.innerHTML = html;
});

disconnectBtn.addEventListener("click", () => {
  peer.destroy();
  const myAudioElement = document.querySelector("audio");
  if (myAudioElement) {
    myAudioElement.remove();
  }
  socket.emit("disconnect");
  window.location.href = "https://www.google.com";
});
