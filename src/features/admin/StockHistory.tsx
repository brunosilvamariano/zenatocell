import type { AdminProduct, Movement } from "./types";
export default function StockHistory({
  movements,
  products,
}: {
  movements: Movement[];
  products: AdminProduct[];
}) {
  return (
    <section className="admin-panel">
      <header>
        <h2>Histórico de movimentações</h2>
        <span>Últimos 100 registros</span>
      </header>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Motivo</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>
                  {products.find(
                    (product) => product.id === movement.product_id,
                  )?.name || movement.product_id}
                </td>
                <td>
                  {movement.quantity > 0 ? "+" : ""}
                  {movement.quantity}
                </td>
                <td>{movement.reason}</td>
                <td>{new Date(movement.created_at).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!movements.length && (
        <div className="admin-empty">
          <p>Nenhuma movimentação registrada.</p>
        </div>
      )}
    </section>
  );
}
