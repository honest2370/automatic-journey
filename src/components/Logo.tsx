import { cn } from "./ui";

/**
 * LogoMark — the real ADF brand mark (the glossy blue "A" arrow),
 * rendered from the official artwork supplied by the CEO.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/logo-mark.png"
      alt="ADF"
      width={size}
      height={size}
      className={cn("inline-block object-contain select-none", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/**
 * Logo — icon mark + "ADF / Digital Futurist" wordmark, used in headers.
 */
export function Logo({
  size = 40,
  showText = true,
  className,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showText && (
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-base">
            ADF
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-600/70">
            Digital Futurist
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * LogoLockup — the full official lockup image (icon + "ADF" wordmark baked
 * into the artwork), for splash / auth screens where the exact brand
 * artwork should appear as a single image.
 */
export function LogoLockup({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/logo-lockup.png"
      alt="ADF — Arafat Digital Futurist"
      style={{ height: size }}
      className={cn("inline-block w-auto object-contain select-none", className)}
      draggable={false}
    />
  );
}
