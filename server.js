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
    console.log(`User ${userName} with ID ${userId} joined room '${roomId}'`);

    // Присоединяем сокет к комнате
    socket.join(roomId);

    // Отправляем всем пользователям в комнате, включая имя пользователя
    io.to(roomId).emit("user-connected", userId, userName);

    socket.on("disconnect", () => {
      console.log("User Disconnected");
      io.to(roomId).emit("user-disconnected", userId);
    });
  });

  socket.on("microphone-status", (userId, status) => {
    console.log(`User ${userId} microphone status: ${status}`);
    io.emit("microphone-status", userId, status); // Отправляем всем пользователям обновленный статус
  });
});

server.listen(process.env.PORT || 3000);
