import { EmptyState } from "@/components/admin/ui";
import { MatchResultManager } from "@/components/admin/results/MatchResultManager";
import { listMatches } from "@/lib/services/matches";

export const dynamic = "force-dynamic";

export default async function AdminResultadosPage() {
  const result = await listMatches();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resultados</h1>
        <p className="mt-1 text-sm text-muted">
          Registra y edita los marcadores de cada partido. La clasificación y la fase final se
          actualizan automáticamente.
        </p>
      </div>

      {!result.ok ? (
        <EmptyState
          icon="!"
          title="No se pudieron cargar los partidos"
          description={result.error}
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon="?"
          title="Aún no hay partidos"
          description="Los partidos se generan al ejecutar el sorteo."
        />
      ) : (
        <MatchResultManager matches={result.data} />
      )}
    </div>
  );
}