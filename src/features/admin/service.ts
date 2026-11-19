import { getSupabase } from "@/lib/supabase/browser";
import type {
  AdminProduct,
  Entry,
  Member,
  Movement,
  OrderItem,
  Order,
} from "./types";
export async function loadAdmin() {
  const client = getSupabase();
  if (!client) throw new Error("Configure o Supabase para continuar.");
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity.user)
    throw new Error("Entre novamente para continuar.");
  const { data: member, error: memberError } = await client
    .from("members")
    .select("*")
    .eq("user_id", identity.user.id)
    .eq("active", true)
    .single();
  if (memberError || !member)
    throw new Error("Seu usuário ainda não tem acesso ao painel.");
  const finance = member.role !== "staff";
  const results = await Promise.all([
    client.from("products").select("*").order("name"),
    client.from("orders").select("*").order("created_at", { ascending: false }),
    finance
      ? client
          .from("financial_entries")
          .select("*")
          .order("occurred_on", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    client
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    member.role === "superadmin"
      ? client.from("members").select("*")
      : Promise.resolve({ data: [], error: null }),
  ]);
  const { data: items, error: itemError } = await client
    .from("order_items")
    .select("*");
  if (itemError) throw new Error(itemError.message);
  const failure = results.find((result) => result.error);
  if (failure?.error) throw new Error(failure.error.message);
  return {
    member: member as Member,
    items: items as OrderItem[],
    products: results[0].data as AdminProduct[],
    orders: results[1].data as Order[],
    entries: results[2].data as Entry[],
    movements: results[3].data as Movement[],
    members: results[4].data as Member[],
  };
}
type Functions =
  import("@/lib/supabase/database").Database["public"]["Functions"];
export async function mutate<N extends keyof Functions>(
  name: N,
  values: Functions[N]["Args"],
) {
  const client = getSupabase();
  if (!client) throw new Error("Banco ainda não configurado.");
  const { error } = await client.rpc(name, values);
  if (error) throw new Error(error.message);
}
