import ParticipantsManager from "@/components/admin/participants/ParticipantsManager";
import { listParticipantsWithUsage } from "@/lib/services/participants";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage() {
  const result = await listParticipantsWithUsage();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Participantes</h1>
        <p className="mt-1 text-sm text-muted">
          Gestiona a los jugadores del torneo. Las parejas se forman al sortear.
        </p>
      </div>
      <ParticipantsManager
        participants={result.ok ? result.data : []}
        initialError={result.ok ? undefined : result.error}
      />
    </div>
  );
}