export type Member = {
  user_id: string;
  email: string;
  role: "superadmin" | "owner" | "staff";
  active: boolean;
};
export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  photos: string[];
  description: string;
  price: number | null;
  cost: number;
  stock: number;
  installment: number | null;
  months: number;
  warranty: string | null;
  active: boolean;
};
export type Order = {
  id: string;
  customer: string;
  contact: string;
  status: "pending" | "confirmed" | "paid" | "cancelled";
  total: number;
  created_at: string;
  notes: string;
};
export type Entry = {
  id: string;
  kind: "income" | "expense";
  amount: number;
  description: string;
  occurred_on: string;
  order_id: string | null;
};
export type Movement = {
  id: string;
  product_id: string;
  quantity: number;
  reason: string;
  created_at: string;
};
export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
};
