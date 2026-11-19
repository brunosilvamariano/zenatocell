import type {
  AdminProduct,
  BrandRow,
  Member,
  Order,
  Entry,
  Movement,
  OrderItem,
} from "@/features/admin/types";
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      store_branding: Table<BrandRow>;
      products: Table<AdminProduct>;
      order_items: Table<OrderItem>;
      members: Table<Member>;
      orders: Table<Order>;
      financial_entries: Table<Entry>;
      stock_movements: Table<Movement>;
    };
    Views: {
      store_products: {
        Row: Omit<AdminProduct, "description" | "cost" | "stock" | "active">;
        Relationships: [];
      };
    };
    Functions: {
      save_branding: {
        Args: { p_display_name: string; p_logo_path: string | null };
        Returns: undefined;
      };
      save_product: {
        Args: { p_product: Record<string, unknown> };
        Returns: undefined;
      };
      adjust_stock: {
        Args: { p_product_id: string; p_quantity: number; p_reason: string };
        Returns: undefined;
      };
      create_order: {
        Args: {
          p_customer: string;
          p_contact: string;
          p_notes: string;
          p_items: { product_id: string; quantity: number }[];
        };
        Returns: string;
      };
      transition_order: {
        Args: { p_id: string; p_status: string };
        Returns: undefined;
      };
      add_financial_entry: {
        Args: {
          p_kind: string;
          p_amount: number;
          p_description: string;
          p_date: string;
        };
        Returns: undefined;
      };
      set_member: {
        Args: { p_user_id: string; p_role: string; p_active: boolean };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
