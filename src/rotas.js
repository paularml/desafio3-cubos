const express = require("express");

const {
  cadastrarUsuario,
  login,
  detalharUsuario,
  editarUsuario,
} = require("./controladores/usuarios");

const verificarUsuarioLogado = require("./intermediarios/autenticacao");

const {
  cadastrarTransacao,
  detalharTransacao,
  atualizarTransacao,
  excluirTransacao,
  obterExtratoDeTransacao,
} = require("./controladores/transacoes");
const { listarCategorias } = require("./controladores/listarCategorias");
const { listarTransacoesIntermediario } = require("./intermediarios/listarTransacoesIntermediario");

const rotas = express();

rotas.post("/usuarios", cadastrarUsuario);
rotas.post("/login", login);

rotas.use(verificarUsuarioLogado);

rotas.put("/usuario", editarUsuario);
rotas.get("/usuario", detalharUsuario);
rotas.get("/categoria", listarCategorias);
rotas.post("/transacao", cadastrarTransacao);
rotas.get("/transacao", listarTransacoesIntermediario);
rotas.get("/transacao/extrato", obterExtratoDeTransacao);
rotas.get("/transacao/:id", detalharTransacao);
rotas.put("/transacao/:id", atualizarTransacao);
rotas.delete("/transacao/:id", excluirTransacao);

module.exports = rotas;
