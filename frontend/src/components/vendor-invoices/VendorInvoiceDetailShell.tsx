'use client';

import Link from 'next/link';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';

export function VendorInvoiceNotFound() {
    return (
        <div className="mx-auto max-w-3xl pb-12">
            <div className="mt-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800">Vendor invoice not found</h1>
                <p className="mt-2 text-gray-500">The vendor invoice you are looking for does not exist.</p>
                <Link href="/company-admin/vendors/invoices" className="mt-4 inline-block font-medium text-gray-700 underline-offset-2 hover:underline">
                    Back to Vendor Invoices
                </Link>
            </div>
        </div>
    );
}

export function VendorInvoiceDetailShell({ breadcrumbItems, children }: { breadcrumbItems: BreadcrumbItem[]; children: React.ReactNode }) {
    return (
        <div className="max-w-none">
            <Breadcrumb items={breadcrumbItems} />
            <div className="w-full pb-10">{children}</div>
        </div>
    );
}
