import { siteConfig } from "@/lib/site-content";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path
        d="M13.5 10V8.5c0-.6.4-1 1-1H15V5h-1.5C11.6 5 10.5 6.1 10.5 8v2H9v2.5h1.5V19h2.5v-6.5H15l.4-2.5h-1.9Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a
        href={siteConfig.socials.instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Instagram de ${siteConfig.fullName}`}
        className="transition-colors hover:text-bronze"
      >
        <InstagramIcon className="h-5 w-5" />
      </a>
      <a
        href={siteConfig.socials.facebook.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Facebook de ${siteConfig.fullName}`}
        className="transition-colors hover:text-bronze"
      >
        <FacebookIcon className="h-5 w-5" />
      </a>
    </div>
  );
}
