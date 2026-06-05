import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TableIcon } from "lucide-react";
import QualityBadge from "./QualityBadge";
import moment from "moment";

const cols = [
  { key: "batch_label", label: "Lote" },
  { key: "marca", label: "Marca" },
  { key: "calibre", label: "Calibre" },
  { key: "destino", label: "Destino" },
  { key: "codigo", label: "Código" },
  { key: "frutas_visibles", label: "Frutas visibles" },
  { key: "pct_clean", label: "Fruta limpia (%)" },
  { key: "pct_manchas", label: "Manchas (%)" },
  { key: "pct_cicatrices", label: "Cicatrices (%)" },
  { key: "pct_oleocelosis", label: "Oleocelosis (%)" },
  { key: "pct_mechanical_damage", label: "Daño mecánico (%)" },
  { key: "color_pct_yellow", label: "Amarillo (%)" },
  { key: "color_pct_light_green", label: "Verde claro (%)" },
  { key: "color_pct_dark_green", label: "Verde oscuro (%)" },
  { key: "color_uniformity", label: "Uniformidad color" },
  { key: "quality_score", label: "Puntaje" },
  { key: "quality_grade", label: "Clasificación" },
  { key: "size_category", label: "Tamaño" },
  { key: "created_date", label: "Fecha" },
];

function exportCSV(analyses) {
  const headers = cols.map((c) => c.label);
  const rows = analyses.map((a) =>
    cols.map((c) => {
      if (c.key === "created_date") return moment(a[c.key]).format("DD/MM/YYYY HH:mm");
      return a[c.key] ?? "";
    })
  );
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lemoncheck_${moment().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecordsTable({ analyses }) {
  if (!analyses || analyses.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-primary" />
            Todos los registros ({analyses.length})
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => exportCSV(analyses)}>
            <Download className="w-3 h-3" />
            Exportar CSV / Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium sticky left-0 bg-muted/40 z-10 w-10">#</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-12">Foto</th>
                {cols.map((c) => (
                  <th key={c.key} className="text-left px-3 py-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyses.map((a, i) => (
                <tr key={a.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground text-xs sticky left-0 bg-card z-10">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link to={`/analysis/${a.id}`}>
                      {a.image_url ? (
                        <img src={a.image_url} alt="" className="w-10 h-10 object-cover rounded-md hover:scale-110 transition-transform" />
                      ) : (
                        <span className="text-xl">🍋</span>
                      )}
                    </Link>
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className="px-3 py-2 whitespace-nowrap text-foreground">
                      {c.key === "quality_grade" ? (
                        <QualityBadge grade={a[c.key]} size="sm" />
                      ) : c.key === "created_date" ? (
                        <span className="text-muted-foreground text-xs">{moment(a[c.key]).format("DD/MM/YY HH:mm")}</span>
                      ) : c.key === "quality_score" ? (
                        <span className="font-bold">{a[c.key] != null ? a[c.key].toFixed(1) : "—"}</span>
                      ) : (
                        a[c.key] != null ? String(a[c.key]) : <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}