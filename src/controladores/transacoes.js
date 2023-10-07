const pool = require("../conexao");

//     LISTAR TRANSAÇÕES     //

const listarTransacoes = async (usuarioId, categoriasFiltro) => {
  let query = 'select t.*, c.descricao as categoria_nome from transacoes t';
  query += ' inner join categorias c on t.categoria_id = c.id';
  query += ' where t.usuario_id = $1';

  const values = [usuarioId];
  const filtroCategorias = Array.isArray(categoriasFiltro) ? categoriasFiltro : [categoriasFiltro];

  if (filtroCategorias.length > 0) {
    query += ' and c.descricao in (' + filtroCategorias.map((_, i) => `$${i + 2}`).join(', ') + ')';
    values.push(...filtroCategorias);
  }

  const lista = await pool.query(query, values);
  return lista.rows;
};

//     CADASTRAR TRANSAÇÃO     //

const cadastrarTransacao = async (request, response) => {
  try {
    const usuario_id = request.usuario.rows[0].id;

    const query = `insert into transacoes 
        (tipo, descricao, valor, data, categoria_id, usuario_id) 
        values 
        ($1, $2, $3, $4, $5, $6) returning * `;

    const { tipo, descricao, valor, data, categoria_id } = request.body;

    const transacaoCadastrada = await pool.query(query, [
      tipo,
      descricao,
      valor,
      data,
      categoria_id,
      usuario_id,
    ]);

    const queryCategoria = "select descricao from categorias where id = $1";

    const nomeCategoria = await pool.query(queryCategoria, [categoria_id]);

    const resposta = {
      id: transacaoCadastrada.rows[0].id,
      tipo,
      descricao,
      valor,
      data,
      categoria_id,
      usuario_id,
      categoria_nome: nomeCategoria.rows[0].descricao,
    };

    return response.status(201).json(resposta);
  } catch (error) {
    return response.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

//     DETALHAR TRANSAÇÃO     //

const detalharTransacao = async (request, response) => {
  const { id } = request.params;
  const usuario_id = request.usuario.rows[0].id;

  try {
    const query = `
      select t.id, t.tipo, t.descricao, t.valor, t.data, t.categoria_id, t.usuario_id, c.descricao as categoria_nome
      from transacoes t
      join categorias c on t.categoria_id = c.id
      where t.id = $1 and t.usuario_id = $2
    `;

    const transacao = await pool.query(query, [id, usuario_id]);

    if (transacao.rowCount <= 0) {
      return response
        .status(404)
        .json({ mensagem: "Transação não encontrada." });
    }

    return response.json(transacao.rows[0]);
  } catch (error) {
    return response.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

//     ATUALIZAR TRANSAÇÃO     //

const atualizarTransacao = async (request, response) => {
  const { id } = request.params;
  const { descricao, valor, data, categoria_id, tipo } = request.body;

  if (!descricao) {
    return response
      .status(400)
      .json({ mensagem: "O campo descrição é obrigatório!" });
  }
  if (!valor) {
    return response
      .status(400)
      .json({ mensagem: "O campo valor é obrigatório!" });
  }
  if (!data) {
    return response
      .status(400)
      .json({ mensagem: "O campo data é obrigatório!" });
  }
  if (!categoria_id) {
    return response
      .status(400)
      .json({ mensagem: "O campo categoria_id é obrigatório!" });
  }
  if (!tipo) {
    return response
      .status(400)
      .json({ mensagem: "O campo tipo é obrigatório!" });
  }

  try {
    const queryTransacao = `select * from transacoes where id = $1`;

    const transacaoExistente = await pool.query(queryTransacao, [id]);

    if (transacaoExistente.rowCount <= 0) {
      return response
        .status(404)
        .json({ mensagem: "Transação não encontrada." });
    }

    const queryCategoria = `select * from categorias where id = $1`;

    const categoriaExistente = await pool.query(queryCategoria, [categoria_id]);

    if (categoriaExistente.rowCount <= 0) {
      return response
        .status(404)
        .json({ mensagem: "Transação não encontrada." });
    }

    if (tipo !== "entrada" && tipo !== "saida") {
      return response
        .status(400)
        .json({ mensagem: "O tipo deve ser igual a 'entrada' ou 'saida'" });
    }

    const queryAtualizar = `
    update transacoes
    set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 
    WHERE id = $6
    `;
    await pool.query(queryAtualizar, [
      descricao,
      valor,
      data,
      categoria_id,
      tipo,
      id,
    ]);

    return response.status(204).send();
  } catch (error) {
    return response.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

//     EXCLUIR TRANSAÇÃO     //

const excluirTransacao = async (request, response) => {
  const { id } = request.params;

  try {
    const queryTransacao = `
    select * 
    from transacoes
    where id = $1
    `;

    const transacaoExistente = await pool.query(queryTransacao, [id]);

    if (transacaoExistente.rowCount <= 0) {
      return response
        .status(404)
        .json({ mensagem: "Transação não encontrada." });
    }

    const queryExcluir = `
    delete
    from transacoes
    where id = $1
    `;

    await pool.query(queryExcluir, [id]);

    return response.status(204).send();
  } catch (error) {
    return response.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

//     OBTER EXTRATO DE TRANSAÇÃO     //

const obterExtratoDeTransacao = async (request, response) => {
  const usuario_id = request.usuario.rows[0].id;

  try {
    const queryEntrada = `select valor from transacoes where tipo = 'entrada' and usuario_id = $1`;

    const entradas = await pool.query(queryEntrada, [usuario_id]);

    const somaEntradas = entradas.rows.reduce(
      (total, valorAtual) => total + valorAtual.valor,
      0
    );

    const querySaida = `select valor from transacoes where tipo = 'saida' and usuario_id = $1`;

    const saidas = await pool.query(querySaida, [usuario_id]);

    const somaSaidas = saidas.rows.reduce(
      (total, valorAtual) => total + valorAtual.valor,
      0
    );

    const objetoEntradasESaidas = {
      entradas: somaEntradas,
      saidas: somaSaidas,
    };

    return response.json(objetoEntradasESaidas);
  } catch (error) {
    return response.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

module.exports = {
  listarTransacoes,
  cadastrarTransacao,
  detalharTransacao,
  atualizarTransacao,
  excluirTransacao,
  obterExtratoDeTransacao
};
