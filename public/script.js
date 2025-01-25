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

  // Получаем всех текущих пользователей (например, через событие 'initial-users')
  socket.on("initial-users", (users) => {
    users.forEach((user) => {
      // Перебираем всех пользователей и подключаемся к ним
      if (user.id !== id) {
        connectToNewUser(user.id, myAudioStream, user.name); // Подключаемся к каждому
      }
    });
  });
});

socket.on("user-connected", (userId, userName) => {
  console.log(`User connected: ${userName} (ID: ${userId})`);
  connectToNewUser(userId, myAudioStream, userName); // Подключаемся к каждому новому пользователю
});



const addAudioStream = (stream, userName, userId) => {
  // Проверим, если уже есть контейнер с этим ID
  const existingUserContainer = document.querySelector(`.user-container[data-id="${userId}"]`);
  if (existingUserContainer) {
    return; // Если контейнер уже существует, не добавляем новый
  }

  // Создаем контейнер пользователя
  const userContainer = document.createElement("div");
  userContainer.classList.add("user-container");
  userContainer.dataset.name = userName; // Сохраняем имя
  userContainer.dataset.id = userId; // Сохраняем уникальный ID

  // Добавляем изображение
  const img = document.createElement("img");
  img.src = "132123.jpg"; // Путь к картинке
  img.alt = userName;
  img.classList.add("user-image");

  // Добавляем подпись с именем под аватарку
  const nameLabel = document.createElement("div");
  nameLabel.textContent = userName; // Отображаем имя
  nameLabel.classList.add("name-label");

  userContainer.appendChild(img);
  userContainer.appendChild(nameLabel); // Переносим подпись под аватарку

  // Если это не наш собственный поток, добавляем аудио
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

muteButton.addEventListener("click", () => {
  const enabled = myAudioStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myAudioStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = html;
  } else {
    myAudioStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = html;
  }
});
