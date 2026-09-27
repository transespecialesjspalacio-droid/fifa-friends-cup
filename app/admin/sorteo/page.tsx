import DrawPreparationPanel from "@/components/admin/sorteo/DrawPreparationPanel";
import { listMatches } from "@/lib/services/matches";
import { listPairs } from "@/lib/services/pairs";
import { getAdminSummary } from "@/lib/services/summary";

export const dynamic = "force-dynamic";

export default async function AdminDrawPage() {
  const [summaryResult, pairsResult, matchesResult] = await Promise.all([
    getAdminSummary(),
    listPairs(),
    listMatches(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sorteo</h1>
        <p className="mt-1 text-sm text-muted">
          Prepara y ejecuta el sorteo de parejas, equipos y grupos.
        </p>
      </div>

      <DrawPreparationPanel
        participantCount={summaryResult.ok ? summaryResult.data.participantCount : 0}
        teamCount={summaryResult.ok ? summaryResult.data.teamCount : 0}
        pairCount={summaryResult.ok ? summaryResult.data.pairCount : 0}
        tournamentStatus={summaryResult.ok ? summaryResult.data.status : null}
        drawRunCount={summaryResult.ok ? summaryResult.data.drawRunCount : 0}
        persistedPairs={pairsResult.ok ? pairsResult.data : []}
        persistedMatches={matchesResult.ok ? matchesResult.data : []}
        initialError={
          summaryResult.ok && pairsResult.ok && matchesResult.ok
            ? undefined
            : "No se pudo cargar el estado del sorteo."
        }
      />
    </div>
  );
}