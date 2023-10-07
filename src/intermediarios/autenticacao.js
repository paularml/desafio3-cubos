const pool = require("../conexao");
const jwt = require("jsonwebtoken");
const senhaJwt = require("../senhaJwt");

const verificarUsuarioLogado = async (request, response, next) => {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.status(401).json({ mensagem: "Não autorizado." });
  }

  const token = authorization.split(" ")[1];

  try {
    const { id } = jwt.verify(token, senhaJwt);
    const usuario = await pool.query("select * from usuarios where id = $1", [
      id,
    ]);

    if (!usuario) {
      return response.status(401).json({ mensagem: "Não autorizado." });
    }
    request.usuario = usuario;

    next();
  } catch (error) {
    console.log(error);
    return response.status(401).json({ mensagem: "Não autorizado." });
  }
};

module.exports = verificarUsuarioLogado;
