import React from "react";
import { Key, Fingerprint, Smartphone, HardDrive, Monitor } from "lucide-react";

/**
 * Inline SVG icons for popular passkey/2FA providers.
 */

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const ProtonIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3h9a6 6 0 0 1 0 12H9v6H3V3z" fill="#6D4AFF"/>
    <path d="M9 15h3a6 6 0 0 0 0-12H9v12z" fill="#8A6FFF" opacity="0.6"/>
  </svg>
);

const BitwardenIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 5.5V12c0 4.5 3.5 8.5 9 10 5.5-1.5 9-5.5 9-10V5.5L12 2z" fill="#175DDC"/>
    <path d="M10 11h1.5V9H10v2zm0 3h1.5v-2H10v2zm2.5-3H14V9h-1.5v2zm0 3H14v-2h-1.5v2z" fill="white"/>
  </svg>
);

const OnePasswordIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#1A8CFF"/>
    <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2" fill="none"/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">1</text>
  </svg>
);

const YubiKeyIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="20" height="8" rx="4" fill="#84BD00"/>
    <circle cx="18" cy="12" r="2.5" fill="white"/>
    <rect x="5" y="10.5" width="8" height="3" rx="1.5" fill="white" opacity="0.8"/>
  </svg>
);

const MicrosoftIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/>
    <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/>
    <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/>
    <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/>
  </svg>
);

const DashlaneIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#00D66B"/>
    <path d="M7 8h10v2H7V8zm0 3h10v2H7v-2zm0 3h7v2H7v-2z" fill="white"/>
  </svg>
);

const LastPassIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#D32D27"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
    <circle cx="12" cy="12" r="2" fill="#D32D27"/>
  </svg>
);

const KeePassIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#6CAC35"/>
    <path d="M8 7l4 5-4 5h2l3-4 3 4h2l-4-5 4-5h-2l-3 4-3-4H8z" fill="white"/>
  </svg>
);

const NordPassIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#4687FF"/>
    <path d="M7 17V7l10 10V7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const AuthyIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#EC1C24"/>
    <path d="M12 4a8 8 0 1 0 0 16A8 8 0 0 0 12 4zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 12 6z" fill="white"/>
    <path d="M12 8v4l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const ChromeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#4285F4"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
    <path d="M12 8h8.5c-1.3-3-4.2-5-7.5-5-2 0-3.9.7-5.3 1.9L12 8z" fill="#EA4335"/>
    <path d="M7.7 14.8L3.5 7.9C2.5 9.2 2 10.5 2 12c0 3.9 2.7 7.2 6.5 8.2L7.7 14.8z" fill="#34A853"/>
    <path d="M16.3 14.8L12 8H3.5c.5.9 3.3 5.7 4.8 8.2 1.5 2.5 5.2 3.8 8.5 3.8.8 0 1.6-.1 2.3-.3l-2.8-4.9z" fill="#FBBC05"/>
    <circle cx="12" cy="12" r="3" fill="white"/>
  </svg>
);

const FirefoxIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#FF9400"/>
    <circle cx="12" cy="12" r="6" fill="#FF6B00"/>
    <circle cx="12" cy="12" r="3" fill="#FFD700"/>
  </svg>
);

/**
 * Maps keywords (from device_nickname or TOTP issuer) to icon components.
 * Checked in order — first match wins.
 */
type IconEntry = {
  keywords: string[];
  icon: (props: { size?: number; className?: string }) => React.ReactElement;
};

const ICON_MAP: IconEntry[] = [
  { keywords: ["google", "gpm", "gmail"], icon: ({ size, className }) => <div className={className}><GoogleIcon size={size} /></div> },
  { keywords: ["apple", "icloud", "face id", "touch id", "ios", "iphone", "ipad", "macbook", "safari", "macos"], icon: ({ size, className }) => <div className={className}><AppleIcon size={size} /></div> },
  { keywords: ["proton", "protonpass", "proton pass"], icon: ({ size, className }) => <div className={className}><ProtonIcon size={size} /></div> },
  { keywords: ["bitwarden"], icon: ({ size, className }) => <div className={className}><BitwardenIcon size={size} /></div> },
  { keywords: ["1password", "onepassword", "one password", "agilebits"], icon: ({ size, className }) => <div className={className}><OnePasswordIcon size={size} /></div> },
  { keywords: ["yubikey", "yubico", "fido", "hardware key", "security key"], icon: ({ size, className }) => <div className={className}><YubiKeyIcon size={size} /></div> },
  { keywords: ["microsoft", "windows hello", "azure", "ms authenticator", "microsoft authenticator"], icon: ({ size, className }) => <div className={className}><MicrosoftIcon size={size} /></div> },
  { keywords: ["authy"], icon: ({ size, className }) => <div className={className}><AuthyIcon size={size} /></div> },
  { keywords: ["dashlane"], icon: ({ size, className }) => <div className={className}><DashlaneIcon size={size} /></div> },
  { keywords: ["lastpass"], icon: ({ size, className }) => <div className={className}><LastPassIcon size={size} /></div> },
  { keywords: ["keepass", "keepassxc"], icon: ({ size, className }) => <div className={className}><KeePassIcon size={size} /></div> },
  { keywords: ["nordpass", "nord"], icon: ({ size, className }) => <div className={className}><NordPassIcon size={size} /></div> },
  { keywords: ["chrome", "chromium"], icon: ({ size, className }) => <div className={className}><ChromeIcon size={size} /></div> },
  { keywords: ["firefox"], icon: ({ size, className }) => <div className={className}><FirefoxIcon size={size} /></div> },
  { keywords: ["windows", "hello", "win"], icon: ({ size, className }) => <div className={className}><MicrosoftIcon size={size} /></div> },
  { keywords: ["android", "pixel", "samsung", "phone", "mobile"], icon: ({ size, className }) => <Smartphone size={size} className={className} /> },
  { keywords: ["mac", "laptop", "desktop", "pc"], icon: ({ size, className }) => <Monitor size={size} className={className} /> },
  { keywords: ["usb", "hardware"], icon: ({ size, className }) => <HardDrive size={size} className={className} /> },
  { keywords: ["fingerprint", "biometric", "face"], icon: ({ size, className }) => <Fingerprint size={size} className={className} /> },
];

/**
 * Resolves an icon component based on a nickname string.
 */
export const resolvePasskeyIcon = (
  nickname: string,
  size = 18,
  className?: string
): React.ReactElement => {
  const lower = nickname.toLowerCase();
  for (const entry of ICON_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.icon({ size, className });
    }
  }
  return <Key size={size} className={className} />;
};

/**
 * PasskeyIcon component — renders the correct provider icon for a passkey nickname.
 */
export const PasskeyIcon = ({
  nickname,
  size = 18,
  className,
}: {
  nickname: string;
  size?: number;
  className?: string;
}) => {
  return resolvePasskeyIcon(nickname, size, className);
};

/**
 * Popular 2FA authenticator apps shown as visual hints during TOTP enrollment.
 */
export const TOTP_APP_SUGGESTIONS = [
  {
    name: "Google Authenticator",
    icon: <GoogleIcon size={22} />,
    url: "https://googleauthenticator.net",
  },
  {
    name: "Apple Passwords",
    icon: <AppleIcon size={22} />,
    url: "https://support.apple.com/guide/iphone/use-built-in-two-factor-authentication-codes-iphf6b80b1ae/ios",
  },
  {
    name: "Microsoft Authenticator",
    icon: <MicrosoftIcon size={22} />,
    url: "https://www.microsoft.com/en-us/security/mobile-authenticator-app",
  },
  {
    name: "Authy",
    icon: <AuthyIcon size={22} />,
    url: "https://authy.com",
  },
  {
    name: "1Password",
    icon: <OnePasswordIcon size={22} />,
    url: "https://1password.com",
  },
  {
    name: "Bitwarden",
    icon: <BitwardenIcon size={22} />,
    url: "https://bitwarden.com",
  },
  {
    name: "Proton Pass",
    icon: <ProtonIcon size={22} />,
    url: "https://proton.me/pass",
  },
] as const;

export type TotpAppSuggestion = (typeof TOTP_APP_SUGGESTIONS)[number];
