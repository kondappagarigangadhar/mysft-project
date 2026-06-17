import { cn } from "@/lib/utils";

type PageLoaderProps = {
  /** Screen reader label */
  label?: string;
  /** Full viewport overlay vs inline block */
  variant?: "fullscreen" | "inline";
  /** Visual style */
  mode?: "spinner" | "skeleton";
  className?: string;
};

const skeletonBlock = "bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)]";
const spinnerRing =
  "border-2 border-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)] border-t-[var(--cta-button-bg)]";

/**
 * Reusable loading UI for route transitions (`loading.tsx`) and inline use.
 * Uses `--cta-button-bg` so spinners/skeletons follow admin theme settings.
 */
export function PageLoader({
  label = "Loading…",
  variant = "fullscreen",
  mode = "spinner",
  className,
}: PageLoaderProps) {
  if (mode === "skeleton") {
    return (
      <div
        className={cn(
          variant === "fullscreen" && "min-h-[50vh] w-full",
          "animate-pulse space-y-4 p-6",
          className,
        )}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <div className={cn("h-8 w-48 rounded-lg", skeletonBlock, "opacity-90")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={cn("h-32 rounded-xl", skeletonBlock)} />
          <div className={cn("h-32 rounded-xl", skeletonBlock)} />
          <div className={cn("h-32 rounded-xl", skeletonBlock)} />
        </div>
        <div className={cn("h-64 w-full rounded-xl", skeletonBlock, "opacity-80")} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        variant === "fullscreen" && "min-h-[50vh] w-full",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div className={cn("h-10 w-10 animate-spin rounded-full", spinnerRing)} aria-hidden />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
