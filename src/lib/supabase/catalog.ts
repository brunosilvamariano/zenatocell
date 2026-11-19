import { createClient } from "@supabase/supabase-js";
import { products, type Product } from "@/data/catalog";
export async function getPublicCatalog(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return products;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client
    .from("store_products")
    .select("*")
    .order("name");
  if (error) throw new Error("Não foi possível carregar o catálogo da loja.");
  return data as Product[];
}
