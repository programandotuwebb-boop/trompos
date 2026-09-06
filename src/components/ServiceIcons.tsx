type IconProps = {
  className?: string;
};

export function ScissorsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="46" r="8" />
      <circle cx="44" cy="46" r="8" />
      <line x1="20" y1="46" x2="52" y2="14" />
      <line x1="44" y1="46" x2="12" y2="14" />
    </svg>
  );
}

export function RazorIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <g transform="rotate(-20 32 32)">
        <rect x="10" y="28" width="26" height="9" rx="4.5" />
        <path d="M36 27 L58 31 L58 34 L36 38 Z" />
        <circle cx="32.5" cy="32.5" r="2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
