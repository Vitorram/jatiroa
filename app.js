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

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Salas com nomes reais
const salas_nomes = [
  "6A - 9A",
  "7B - 9E",
  "8A - 9D",
  "7C - 8D",
  "6B - 9C",
  "6C - 9B",
  "7A - 8B",
  "7D - 8C"
];

// Cada sala começa livre e sem tipo de chamado
let salas_status = {};
salas_nomes.forEach(sala => {
  salas_status[sala] = { status: "livre", tipo: "" };
});

// Dashboard
app.get("/", (req, res) => {
  res.render("dashboard", { salas: salas_status });
});

// Lista de professores
app.get("/professores", (req, res) => {
  res.render("professores", { salas: salas_nomes });
});

// Página de professor
app.get("/professor/:nome", (req, res) => {
  // Como o nome pode ter espaço e traço, usamos decodeURIComponent
  const sala = decodeURIComponent(req.params.nome);
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
app.post("/atender/:nome", (req, res) => {
  const sala = decodeURIComponent(req.params.nome);
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
