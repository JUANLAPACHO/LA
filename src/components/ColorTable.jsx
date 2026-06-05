import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

const colors = [
  { key: "color_pct_yellow", label: "Amarillo", dot: "bg-yellow-400", bar: "bg-yellow-400" },
  { key: "color_pct_light_green", label: "Verde claro", dot: "bg-lime-400", bar: "bg-lime-400" },
  { key: "color_pct_dark_green", label: "Verde oscuro", dot: "bg-green-700", bar: "bg-green-700" },
];

export default function ColorTable({ analysis }) {
  const hasData = colors.some((c) => analysis[c.key] != null);
  if (!hasData) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-500" />
          Distribución de Color
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analysis.color_assessment && (
          <p className="text-sm text-muted-foreground mb-3">{analysis.color_assessment}</p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-xs text-muted-foreground font-medium">Color</th>
              <th className="text-right py-2 text-xs text-muted-foreground font-medium w-16">%</th>
              <th className="w-28 py-2" />
            </tr>
          </thead>
          <tbody>
            {colors.map((c) => {
              const val = analysis[c.key];
              return (
                <tr key={c.key} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2 text-foreground">
                      <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                      {c.label}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">
                    {val != null ? `${val}%` : "—"}
                  </td>
                  <td className="py-2.5 pl-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.bar} transition-all`}
                        style={{ width: val != null ? `${Math.min(val, 100)}%` : "0%" }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}