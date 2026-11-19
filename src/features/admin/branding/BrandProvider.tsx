"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase/browser";
export type StoreBrand = {
  displayName: string;
  logoPath: string | null;
  logoUrl: string;
};
const fallback: StoreBrand = {
  displayName: "ZenatoCell",
  logoPath: null,
  logoUrl: "/zenatocell/zenatocell.svg",
};
type Context = {
  brand: StoreBrand;
  available: boolean;
  loading: boolean;
  reload: () => Promise<void>;
};
const BrandContext = createContext<Context>({
  brand: fallback,
  available: false,
  loading: true,
  reload: async () => {},
});
export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState(fallback),
    [available, setAvailable] = useState(false),
    [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await client
        .from("store_branding")
        .select("display_name,logo_path")
        .eq("id", true)
        .single();
      if (error || !data) {
        setAvailable(false);
        return;
      }
      setBrand({
        displayName: data.display_name,
        logoPath: data.logo_path,
        logoUrl: data.logo_path
          ? client.storage.from("brand-assets").getPublicUrl(data.logo_path)
              .data.publicUrl
          : fallback.logoUrl,
      });
      setAvailable(true);
    } catch {
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return (
    <BrandContext.Provider value={{ brand, available, loading, reload }}>
      {children}
    </BrandContext.Provider>
  );
}
export function useBrand() {
  return useContext(BrandContext);
}
