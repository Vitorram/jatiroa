// app.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do EJS (pode trocar por Pug/Handlebars se quiser)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Cada sala começa livre e sem tipo de chamado
let salas_status = {};
for (let i = 1; i <= 8; i++) {
  salas_status[`Sala ${i}`] = { status: "livre", tipo: "" };
}

// Dashboard
app.get("/", (req, res) => {
  res.render("dashboard", { salas: salas_status });
});

// Lista de professores
app.get("/professores", (req, res) => {
  const salas = Object.keys(salas_status);
  res.render("professores", { salas });
});

// Página de professor
app.get("/professor/:num", (req, res) => {
  const sala = `Sala ${req.params.num}`;
  if (!salas_status[sala]) {
    return res.status(404).send("Sala inválida");
  }
  res.render("professor", { sala });
});

// Criar chamado
app.post("/chamado", (req, res) => {
  const { sala, tipo } = req.body;
  if (salas_status[sala]) {
    salas_status[sala] = { status: "chamado", tipo: tipo || "" };
    io.emit("atualizar", { sala, status: "chamado", tipo: tipo || "" });
    return res.status(200).send("Chamado enviado!");
  }
  return res.status(400).send("Sala inválida");
});

// Atender chamado
app.post("/atender/:num", (req, res) => {
  const sala = `Sala ${req.params.num}`;
  if (salas_status[sala]) {
    salas_status[sala] = { status: "livre", tipo: "" };
    io.emit("atualizar", { sala, status: "livre", tipo: "" });
    return res.redirect("/");
  }
  return res.status(400).send("Sala inválida");
});

// Status geral
app.get("/status", (req, res) => {
  res.json(salas_status);
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("Novo cliente conectado!");
  socket.on("disconnect", () => {
    console.log("Cliente desconectado!");
  });
});

// Iniciar servidor
const PORT = 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
