const pool = require("../conexao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const senhaJwt = require("../senhaJwt");

//     CADASTRAR USUÁRIO     //

const cadastrarUsuario = async (request, response) => {
  const { nome, email, senha } = request.body;

  if (!nome) {
    return response.status(400).json("O nome é um campo obrigatório.");
  }
  if (!email) {
    return response.status(400).json("O e-mail é um campo obrigatório.");
  }
  if (!senha) {
    return response.status(400).json("A senha é um campo obrigatório.");
  }
  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const emailExiste = await pool.query(
      "select email from usuarios where email = $1",
      [email]
    );
    if (emailExiste.rowCount) {
      return response.status(400).json("E-mail já cadastrado.");
    }

    const usuarioCadastrado = await pool.query(
      "insert into usuarios (nome, email, senha) values ($1, $2, $3) returning id, nome, email",
      [nome, email, senhaCriptografada]
    );

    return response.status(201).json(usuarioCadastrado.rows[0]);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

//     LOGIN     //

const login = async (request, response) => {
  const { email, senha } = request.body;

  if (!email) {
    return response.status(400).json("O e-mail é um campo obrigatório.");
  }
  if (!senha) {
    return response.status(400).json("A senha é um campo obrigatório.");
  }
  try {
    const usuario = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );
    if (usuario.rowCount < 1) {
      return response.status(404).json("E-mail ou senha inválida.");
    }

    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);
    if (!senhaValida) {
      return response.status(400).json("E-mail ou senha inválida.");
    }

    const token = jwt.sign({ id: usuario.rows[0].id }, senhaJwt, {
      expiresIn: "8h",
    });
    const { senha: _, ...usuarioLogado } = usuario.rows[0];

    return response.json({ usuario: usuarioLogado, token });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

//     DETALHAR USUÁRIO     //

const detalharUsuario = async (request, response) => {
  try {
    const { senha: _, ...usuario } = request.usuario.rows[0];
    return response.json(usuario);
  } catch (error) {
    return response.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

//     EDITAR USUÁRIO     //

const editarUsuario = async (request, response) => {
  const { id } = request.usuario.rows[0];
  const { nome, email, senha } = request.body;

  if (!nome) {
    return response.status(400).json("O nome é um campo obrigatório.");
  }
  if (!email) {
    return response.status(400).json("O e-mail é um campo obrigatório.");
  }
  if (!senha) {
    return response.status(400).json("A senha é um campo obrigatório.");
  }

  try {
    const emailExiste = await pool.query(
      "select email from usuarios where email = $1 and id != $2",
      [email, id]
    );

    if (emailExiste.rowCount) {
      return response.status(400).json("E-mail já cadastrado.");
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    await pool.query(
      "update usuarios set nome = $1,  email = $2,  senha = $3 where id = $4",
      [nome, email, senhaCriptografada, id]
    );
    return response.json({ mensagem: "Atualizado com sucesso" });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};


module.exports = {
  cadastrarUsuario,
  login,
  detalharUsuario,
  editarUsuario,
};
