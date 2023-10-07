const pool = require("../conexao");

const listarCategorias = async (request, response) => {
  try {
    const lista = await pool.query("select * from categorias");

    const categorias = lista.rows;

    return response.json(categorias);
  } catch (error) {
    return response.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

module.exports = { listarCategorias };
