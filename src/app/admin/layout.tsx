import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/admin.css";
import "@/styles/star-admin.css";
import "@/styles/admin-products.css";
import "@/styles/admin-select.css";
export const metadata: Metadata = {
  title: "Administração | ZenatoCell",
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap"
        precedence="default"
      />
      {children}
    </>
  );
}
