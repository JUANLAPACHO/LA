import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const pctRows = [
  { key: "pct_clean", label: "Fruta limpia", bar: "bg-emerald-400" },
  { key: "pct_manchas", label: "Manchas", bar: "bg-yellow-400" },
  { key: "pct_cicatrices", label: "Cicatrices", bar: "bg-orange-400" },
  { key: "pct_oleocelosis", label: "Posible oleocelosis", bar: "bg-amber-600" },
  { key: "pct_mechanical_damage", label: "Daño mecánico", bar: "bg-red-500" },
  { key: "pct_dehydration", label: "Deshidratación visible", bar: "bg-red-400" },
  { key: "pct_severe_defects", label: "Defectos severos", bar: "bg-red-700" },
];

const scoreRows = [
  { key: "score_size_uniformity", label: "Uniformidad de tamaño" },
  { key: "score_shape_uniformity", label: "Uniformidad de forma" },
  { key: "score_visual_quality", label: "Calidad visual general" },
];

function ScoreBar({ value }) {
  const pct = ((value || 0) / 10) * 100;
  const color = value >= 7 ? "bg-emerald-400" : value >= 5 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function QualityBreakdownTable({ analysis }) {
  const hasPct = pctRows.some((r) => analysis[r.key] != null);
  const hasScores = scoreRows.some((r) => analysis[r.key] != null);
  if (!hasPct && !hasScores) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Desglose Detallado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPct && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Parámetro</th>
                <th className="text-right py-2 text-xs text-muted-foreground font-medium w-14">%</th>
                <th className="w-28 py-2" />
              </tr>
            </thead>
            <tbody>
              {pctRows.map((row) => {
                const val = analysis[row.key];
                return (
                  <tr key={row.key} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-foreground">{row.label}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{val != null ? `${val}%` : "—"}</td>
                    <td className="py-2 pl-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${row.bar}`} style={{ width: val != null ? `${Math.min(val, 100)}%` : "0%" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {hasScores && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Puntuación</th>
                <th className="text-right py-2 text-xs text-muted-foreground font-medium w-14">/ 10</th>
                <th className="w-28 py-2" />
              </tr>
            </thead>
            <tbody>
              {scoreRows.map((row) => {
                const val = analysis[row.key];
                return (
                  <tr key={row.key} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-foreground">{row.label}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{val != null ? val.toFixed(1) : "—"}</td>
                    <td className="py-2 pl-3"><ScoreBar value={val} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}