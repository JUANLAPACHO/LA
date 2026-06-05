import { Card } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Ruler, BarChart3 } from "lucide-react";

export default function StatsRow({ analyses }) {
  if (!analyses.length) return null;

  const avgScore = (analyses.reduce((s, a) => s + (a.quality_score || 0), 0) / analyses.length).toFixed(1);
  const avgDefects = (analyses.reduce((s, a) => s + (a.defect_percentage || 0), 0) / analyses.length).toFixed(1);
  const premiumCount = analyses.filter(a => a.quality_grade === "premium" || a.quality_grade === "primera").length;
  const premiumPct = ((premiumCount / analyses.length) * 100).toFixed(0);

  const stats = [
    { label: "Calidad Promedio", value: `${avgScore}/10`, icon: BarChart3, color: "text-emerald-600" },
    { label: "Defectos Promedio", value: `${avgDefects}%`, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Premium + Primera", value: `${premiumPct}%`, icon: TrendingUp, color: "text-green-600" },
    { label: "Total Análisis", value: analyses.length, icon: Ruler, color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}