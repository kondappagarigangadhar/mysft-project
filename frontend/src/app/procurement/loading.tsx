import { PageLoader } from "@/components/ui/PageLoader";

/** Procurement routes — theme-aware loader while pages hydrate. */
export default function ProcurementLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-start justify-center pt-12 md:pt-16">
      <PageLoader label="Loading…" variant="inline" />
    </div>
  );
}
