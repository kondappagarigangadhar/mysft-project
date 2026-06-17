import { PageLoader } from "@/components/ui/PageLoader";

/**
 * Root segment loading UI. Shown during route transitions for any child route
 * that does not define its own `loading.tsx` (Next.js falls back to parent).
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <PageLoader label="Loading page…" />
    </div>
  );
}
