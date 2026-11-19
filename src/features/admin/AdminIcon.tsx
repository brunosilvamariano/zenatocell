export default function AdminIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    edit: "m15 4 5 5M4 20l4-1L21 6l-4-4L4 15v5Z",
    history: "M3 12a9 9 0 1 0 2.6-6.4L3 8M3 3v5h5M12 7v5l3 2",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "m6 6 12 12M6 18 18 6",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    calendar: "M4 5h16v16H4zM8 2v6M16 2v6M4 10h16",
    external: "M14 3h7v7M10 14 21 3M10 3H3v18h18v-7",

    overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    products: "m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9",
    orders: "M6 5h12v16H6zM9 3h6v4H9zM9 12h6M9 16h4",
    stock: "M3 8h18v13H3zM2 3h20v5H2zM9 12h6",
    finance: "M3 21h18M6 17v-6M12 17V3M18 17V8",
    members:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-4",
    settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  };
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.overview} />
    </svg>
  );
}
