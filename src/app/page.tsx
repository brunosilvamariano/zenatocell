import Storefront from "@/components/storefront/Storefront";
import { getPublicCatalog } from "@/lib/supabase/catalog";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  return <Storefront products={await getPublicCatalog()} />;
}
