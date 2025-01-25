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

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join-room", (roomId, userId, userName) => {
    // Теперь передаем также имя пользователя
    console.log(`User ${userName} with ID ${userId} joined room 'general'`);

    // Присоединяем сокет к общей комнате
    socket.join('general');

    setTimeout(() => {
      // Проверяем, что сокет действительно в комнате
      if (socket.rooms['general']) {  // Проверка, есть ли комната в объекте socket.rooms
        console.log(`Socket is in room 'general'`);

        // Отправляем всем пользователям в комнате, включая имя пользователя
        io.to('general').emit("user-connected", userId, userName);
      } else {
        console.log(`Socket is NOT in room 'general'`);
      }
    }, 1000);

    socket.on("disconnect", () => {
      console.log("User Disconnected");
      io.emit("user-disconnected", userId);
    });
  });
});

server.listen(process.env.PORT || 3000);
