import { Suspense } from "react";
import { SessionView } from "@/components/SessionView";

export default function SessionPage({ params }: PageProps<"/session/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
      <Session params={params} />
    </Suspense>
  );
}

async function Session({ params }: { params: PageProps<"/session/[id]">["params"] }) {
  const { id } = await params;
  return <SessionView id={id} />;
}
