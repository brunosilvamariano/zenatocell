"use client";
import AdminDialog from "./AdminDialog";
import type { Order, OrderItem } from "./types";
import { money } from "@/lib/format";
export default function OrderDetails({
  order,
  items,
  onClose,
}: {
  order: Order;
  items: OrderItem[];
  onClose: () => void;
}) {
  return (
    <AdminDialog onClose={onClose} labelledBy="order-details-title">
      <div className="admin-modal-inner">
        <header>
          <h2 id="order-details-title">Pedido #{order.id.slice(0, 8)}</h2>
          <button className="admin-quiet" onClick={onClose}>
            Fechar
          </button>
        </header>
        <p>
          <strong>{order.customer}</strong>
          <br />
          {order.contact}
        </p>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Unitário</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.unit_price)}</td>
                  <td>{money(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-order-total">
          <span>Total à vista</span>
          <strong>{money(order.total)}</strong>
        </div>
        {order.notes && <p>{order.notes}</p>}
      </div>
    </AdminDialog>
  );
}
