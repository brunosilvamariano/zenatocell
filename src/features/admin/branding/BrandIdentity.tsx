"use client";
import { useBrand } from "./BrandProvider";
export default function BrandIdentity({
  className = "",
}: {
  className?: string;
}) {
  const { brand } = useBrand();
  return (
    <span className={"admin-brand-identity " + className}>
      <span className="admin-brand-image">
        <img src={brand.logoUrl} alt="" width={52} height={52} />
      </span>
      <span className="admin-brand-copy">
        <strong>{brand.displayName}</strong>
        <span>Gestão da loja</span>
      </span>
    </span>
  );
}
