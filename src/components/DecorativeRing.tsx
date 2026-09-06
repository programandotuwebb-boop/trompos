export default function DecorativeRing({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="pointer-events-none absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)]"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke="#b8b8b8"
        strokeWidth="1.5"
        strokeDasharray="90 260"
        strokeLinecap="round"
      />
    </svg>
  );
}
