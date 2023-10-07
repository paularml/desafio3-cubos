const { listarTransacoes } = require("../controladores/transacoes");
const pool = require("../conexao");

const listarTransacoesIntermediario = async (request, response) => {
    const { id } = request.usuario.rows[0];
    const categoriasFiltro = request.query.filtro;

    try {
        let transacoes;
        if (categoriasFiltro) {
            transacoes = await listarTransacoes(id, categoriasFiltro);
        } else {
            const lista = await pool.query(
                "select * from transacoes where usuario_id = $1",
                [id]
            );

            transacoes = lista.rows;

        }

        return response.status(200).json(transacoes);
    } catch (error) {
        console.error(error);
        return response.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};

module.exports = { listarTransacoesIntermediario };
