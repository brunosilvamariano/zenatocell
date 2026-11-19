export default function AdminIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    branding: "m12 3 9 5v8l-9 5-9-5V8l9-5ZM12 3v18M3 8l9 5 9-5",
    upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
    lock: "M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4M12 14v3",
    mail: "M3 5h18v14H3zM3 6l9 7 9-7",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    "eye-off":
      "m3 3 18 18M10 5a12 12 0 0 1 2 0c6 0 10 7 10 7a21 21 0 0 1-3 4M6 6a22 22 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1M10 10a3 3 0 0 0 4 4",
    shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
    back: "M20 12H4m6-6-6 6 6 6",
    alert: "M12 3 2 21h20L12 3Zm0 6v5m0 3v1",

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
