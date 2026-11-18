export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M46 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4a10.6 10.6 0 0 1-4.6 7v5.7h7.4C43.5 37.2 46 31.4 46 24.5Z"
      />
      <path
        fill="#34A853"
        d="M24 47c6.2 0 11.4-2 15.2-5.8l-7.4-5.7a14 14 0 0 1-21-7.4H3.2v5.9A23 23 0 0 0 24 47Z"
      />
      <path
        fill="#FBBC05"
        d="M10.8 28.1a14 14 0 0 1 0-8.2V14H3.2a23 23 0 0 0 0 20Z"
      />
      <path
        fill="#EA4335"
        d="M24 10.1c3.4 0 6.4 1.1 8.8 3.4l6.6-6.6A23 23 0 0 0 3.2 14l7.6 5.9A14 14 0 0 1 24 10.1Z"
      />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <img
      className="instagram-icon"
      src="/zenatocell/instagram.svg"
      width="20"
      height="20"
      alt=""
    />
  );
}

export function Icon({ kind }: { kind: "bag" | "search" | "grid" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "bag" && (
        <>
          <path d="M5 8h14l2 13H3L5 8Z" />
          <path d="M9 10V6a3 3 0 0 1 6 0v4" />
        </>
      )}
      {kind === "search" && (
        <>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="m15 15 5 5" />
        </>
      )}
      {kind === "grid" && (
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      )}
    </svg>
  );
}
