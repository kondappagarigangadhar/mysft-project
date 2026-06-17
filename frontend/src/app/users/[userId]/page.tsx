import { redirect } from 'next/navigation';

export default async function UserLegacyDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    redirect(`/platform/users/view/${userId}`);
}
