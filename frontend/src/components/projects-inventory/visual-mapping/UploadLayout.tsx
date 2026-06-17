'use client';

import React, { RefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { LuUpload } from 'react-icons/lu';

export function UploadLayout({
    uploadRef,
    layoutFileName,
    onPickFile,
}: {
    uploadRef: RefObject<HTMLInputElement | null>;
    layoutFileName: string;
    onPickFile: (file: File) => void;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Upload a layout file</p>
            <p className="mt-1 text-xs text-slate-500">Supported: images and PDF</p>
            <div className="mt-3 flex items-center gap-3">
                <Button type="button" variant="companyOutline" size="cta" className="rounded-xl" onClick={() => uploadRef.current?.click()}>
                    <LuUpload className="mr-2" size={16} />
                    Choose File
                </Button>
                <span className="text-xs text-slate-500">{layoutFileName || 'No file selected'}</span>
            </div>
            <input
                ref={uploadRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickFile(file);
                }}
            />
        </div>
    );
}
