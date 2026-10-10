import { SessionList } from "@/components/SessionList";

export default function Home() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Mes sessions</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Cours et réunions enregistrés, stockés localement sur cet appareil.
      </p>
      <SessionList />
    </div>
  );
}
