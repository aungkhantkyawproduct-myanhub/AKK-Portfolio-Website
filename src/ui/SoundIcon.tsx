export default function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11 4 5.5 8.5H2v7h3.5L11 20z" />
      {on ? (
        <>
          <path d="M15 8a6 6 0 0 1 0 8" />
          <path d="M18 4.5a10 10 0 0 1 0 15" />
        </>
      ) : (
        <>
          <path d="m16 9 6 6M22 9l-6 6" />
        </>
      )}
    </svg>
  );
}
