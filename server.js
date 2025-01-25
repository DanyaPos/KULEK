const express = require("express");
const app = express();
const server = require("http").Server(app);
app.set('view engine', 'ejs');
app.use(express.static('public'));
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use("/peerjs", peerServer);

app.get('/', (req, res) => {
  res.render("room", { roomId: 'general' });
});

// Список всех пользователей в комнате
let usersInRoom = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join-room", (roomId, userId, userName) => {
    // Проверка на наличие данных
    if (!userId || !userName) {
      console.log("User ID or User Name is missing");
      return;
    }

    // Добавляем пользователя в список
    usersInRoom.push({ id: userId, name: userName });

    // Присоединяем сокет к комнате
    socket.join(roomId);

    setTimeout(() => {
      // Отправляем список всех пользователей, включая нового
      io.to(roomId).emit("user-connected", userId, userName);

      // Отправляем список всех пользователей в комнате (для нового клиента)
      io.to(socket.id).emit("initial-users", usersInRoom);
    }, 1000);

    // Обрабатываем отключение пользователя
    socket.on("disconnect", () => {
      console.log("User Disconnected");
      // Удаляем пользователя из списка
      usersInRoom = usersInRoom.filter(user => user.id !== userId);
      io.emit("user-disconnected", userId);
    });
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port 3000');
});
