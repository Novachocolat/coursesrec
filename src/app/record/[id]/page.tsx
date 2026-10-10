import { Suspense } from "react";
import { RecordView } from "@/components/RecordView";

export default function RecordPage({ params }: PageProps<"/record/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
      <Record params={params} />
    </Suspense>
  );
}

async function Record({ params }: { params: PageProps<"/record/[id]">["params"] }) {
  const { id } = await params;
  return <RecordView id={id} />;
}
