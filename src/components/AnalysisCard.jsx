import { Link } from "react-router-dom";
import useSignedImageUrl from "../hooks/useSignedImageUrl";
import { Card } from "@/components/ui/card";
import QualityBadge from "./QualityBadge";
import { Calendar, Ruler, Droplets } from "lucide-react";
import moment from "moment";

export default function AnalysisCard({ analysis }) {
  const imageUrl = useSignedImageUrl(analysis);
  const score = analysis.quality_score || 0;
  const scoreColor = score >= 8 ? "text-emerald-600" : score >= 5 ? "text-yellow-600" : "text-red-600";

  return (
    <Link to={`/analysis/${analysis.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 cursor-pointer">
        <div className="flex gap-4 p-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Caja de limones"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">🍋</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {analysis.batch_label || "Sin etiqueta"}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {moment(analysis.created_date).format("DD MMM YYYY, HH:mm")}
                </div>
              </div>
              <div className={`text-2xl font-bold ${scoreColor}`}>
                {score.toFixed(1)}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <QualityBadge grade={analysis.quality_grade} size="sm" />
              {analysis.size_category && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Ruler className="w-3 h-3" />
                  {analysis.size_category}
                </span>
              )}
              {analysis.defect_percentage != null && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Droplets className="w-3 h-3" />
                  {analysis.defect_percentage}% defectos
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}