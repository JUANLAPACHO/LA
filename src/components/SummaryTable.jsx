import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableIcon } from "lucide-react";

const cols = [
  { key: "frutas_visibles", label: "Frutas visibles evaluadas", unit: "" },
  { key: "pct_clean", label: "Fruta limpia", unit: "%" },
  { key: "pct_manchas", label: "Manchas", unit: "%" },
  { key: "pct_cicatrices", label: "Cicatrices", unit: "%" },
  { key: "pct_oleocelosis", label: "Posible oleocelosis", unit: "%" },
  { key: "pct_mechanical_damage", label: "Daño mecánico", unit: "%" },
];

const metaFields = [
  { key: "marca", label: "Marca" },
  { key: "calibre", label: "Calibre" },
  { key: "destino", label: "Destino" },
  { key: "codigo", label: "Código" },
];

export default function SummaryTable({ analysis }) {
  const hasSummary = cols.some((c) => analysis[c.key] != null);
  if (!hasSummary) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-primary" />
          Resumen de Evaluación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metaFields.map(({ key, label }) =>
            analysis[key] ? (
              <div key={key} className="bg-muted/60 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold text-foreground text-sm">{analysis[key]}</p>
              </div>
            ) : null
          )}
        </div>

        {/* Summary table */}
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[480px] mx-2">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-12">Foto</th>
                {cols.map((c) => (
                  <th key={c.key} className="text-center px-3 py-2 text-xs text-muted-foreground font-medium leading-tight">
                    {c.label}{c.unit ? ` (${c.unit})` : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-3 py-3 text-center">
                  {analysis.image_url ? (
                    <img src={analysis.image_url} alt="foto" className="w-10 h-10 object-cover rounded-md mx-auto" />
                  ) : "—"}
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-3 text-center font-semibold text-foreground">
                    {analysis[c.key] != null ? analysis[c.key] : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}