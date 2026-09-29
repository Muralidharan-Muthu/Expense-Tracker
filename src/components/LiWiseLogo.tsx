import { cn } from "@/lib/utils";
import liWiseLogo from "@/assets/liwise-logo-concept-1.png";
import liWiseLogoDark from "@/assets/liwise-logo-dark.png";

type LiWiseLogoProps = {
  compact?: boolean;
  className?: string;
};

export function LiWiseLogo({ compact = false, className }: LiWiseLogoProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <img src={liWiseLogo} alt="" aria-hidden="true" width={1024} height={1024} className="size-9 shrink-0 object-contain dark:hidden" />
      <img src={liWiseLogoDark} alt="" aria-hidden="true" width={1024} height={1024} className="hidden size-9 shrink-0 object-contain dark:block" />
      {!compact && (
        <span className="truncate text-base font-bold leading-none">LiWise</span>
      )}
    </span>
  );
}
