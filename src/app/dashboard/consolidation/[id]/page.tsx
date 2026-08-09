import { ConsolidationRequestDetail } from "@/components/dashboard/ConsolidationRequestDetail";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ConsolidationRequestDetail requestId={id} />;
}
