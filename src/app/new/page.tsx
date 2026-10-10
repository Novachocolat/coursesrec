import { NewSessionForm } from "@/components/NewSessionForm";

export default function NewSessionPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Nouvelle session</h1>
      <p className="mb-8 mt-1 text-sm text-muted">
        Le type et le contexte aideront l'IA à mieux comprendre et structurer les notes.
      </p>
      <NewSessionForm />
    </div>
  );
}
