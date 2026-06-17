import { redirect } from 'next/navigation';

export default async function UserLegacyEditPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    redirect(`/platform/users/view/${userId}?edit=1`);
}
