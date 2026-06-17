'use client';

import React from 'react';
import Link from 'next/link';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';

export function InvoiceNotFound() {
    return (
      
            <div className="mx-auto max-w-3xl pb-12">
                <div className="mt-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Invoice not found</h1>
                    <p className="mt-2 text-gray-500">The invoice you are looking for does not exist.</p>
                    <Link
                        href="/company-admin/invoices"
                        className="mt-4 inline-block font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
                    >
                        Back to Invoices
                    </Link>
                </div>
            </div>
        
    );
}

type Props = {
    breadcrumbItems: BreadcrumbItem[];
    children: React.ReactNode;
};

/** Invoice detail shell — breadcrumb only (matches Work Orders / Leads pattern). */
export function InvoiceDetailShell({ breadcrumbItems, children }: Props) {
    return (
        <div className="max-w-none">
            <>
                <Breadcrumb items={breadcrumbItems} />
                <div className="w-full pb-10">{children}</div>
            </>
        </div>
    );
}
