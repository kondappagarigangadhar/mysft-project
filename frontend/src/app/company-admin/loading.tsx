import { PageLoader } from "@/components/ui/PageLoader";

/**
 * Company admin subtree: keeps sidebar from layout visible while main content loads.
 */
export default function CompanyAdminLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-start justify-center pt-12 md:pt-16">
      <PageLoader label="Loading…" variant="inline" />
    </div>
  );
}
