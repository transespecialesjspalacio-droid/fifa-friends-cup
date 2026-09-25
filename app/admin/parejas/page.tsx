import { listPairs } from "@/lib/services/pairs";
import { PairGrid } from "@/components/pairs/PairGrid";
import { EmptyState } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminPairsPage() {
  const result = await listPairs();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parejas</h1>
        <p className="mt-1 text-sm text-muted">
          Integrantes de cada pareja con el equipo y el grupo asignados en el sorteo.
        </p>
      </div>

      {!result.ok ? (
        <EmptyState
          icon="!"
          title="No se pudieron cargar las parejas"
          description={result.error}
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon="?"
          title="Aún no hay parejas"
          description="Las parejas se forman durante el sorteo."
        />
      ) : (
        <PairGrid pairs={result.data} />
      )}
    </div>
  );
}