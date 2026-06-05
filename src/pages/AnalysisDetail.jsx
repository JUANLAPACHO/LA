import { useParams, useNavigate } from "react-router-dom";
import { useState as useStateLD } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Loader2, Bug, Ruler, MessageSquare, Droplets, ZoomIn, X } from "lucide-react";
import QualityBadge from "../components/QualityBadge";
import QualityBreakdownTable from "../components/QualityBreakdownTable";
import ColorTable from "../components/ColorTable";
import SummaryTable from "../components/SummaryTable";
import moment from "moment";
import useSignedImageUrl from "../hooks/useSignedImageUrl";
import { toast } from "sonner";

const uniformityLabels = { uniforme: "Uniforme", variable: "Variable", muy_variable: "Muy variable" };
const sizeLabels = { pequeño: "Pequeño", mediano: "Mediano", grande: "Grande", extra_grande: "Extra grande" };

export default function AnalysisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lightboxOpen, setLightboxOpen] = useStateLD(false);

  const { data: analysis, isLoading } = useQuery({
    queryKey: ["lemonAnalysis", id],
    queryFn: () => base44.entities.LemonAnalysis.get(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.LemonAnalysis.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lemonAnalyses"] });
      toast.success("Análisis eliminado");
      navigate("/");
    },
  });

  // Hook must be called unconditionally — before any early returns
  const imageUrl = useSignedImageUrl(analysis);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Análisis no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/")}>Volver</Button>
      </div>
    );
  }

  const score = analysis.quality_score || 0;
  const scoreColor = score >= 8 ? "text-emerald-600" : score >= 5 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar análisis?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Lightbox nativo — compatible con pinch-zoom en móvil */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            style={{ touchAction: "pinch-zoom" }}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 rounded-full p-2"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img
              src={imageUrl || analysis.image_url}
              alt="Caja"
              className="max-w-full max-h-screen object-contain"
              style={{ touchAction: "pinch-zoom" }}
            />
          </div>
        )}

        {/* Image + Score */}
        <div className="relative rounded-xl overflow-hidden cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
          <img src={imageUrl || analysis.image_url} alt="Caja" className="w-full h-56 sm:h-72 object-cover" />
          <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <h1 className="text-white font-bold text-xl drop-shadow-lg">{analysis.batch_label || "Sin etiqueta"}</h1>
              <p className="text-white/70 text-sm drop-shadow">{moment(analysis.created_date).format("DD MMMM YYYY, HH:mm")}</p>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 text-center">
              <p className={`text-3xl font-bold ${scoreColor}`}>{score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">/ 10</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <QualityBadge grade={analysis.quality_grade} />
          {analysis.size_category && (
            <span className="text-sm text-muted-foreground">{sizeLabels[analysis.size_category]}</span>
          )}
        </div>

        <SummaryTable analysis={analysis} />
        <QualityBreakdownTable analysis={analysis} />
        <ColorTable analysis={analysis} />

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailCard icon={Ruler} title="Tamaño" color="text-blue-600">
            <p className="text-sm text-foreground">{analysis.avg_size || "—"}</p>
            {analysis.size_category && (
              <p className="text-xs text-muted-foreground mt-1">Categoría: {sizeLabels[analysis.size_category]}</p>
            )}
            {(analysis.frutas_visibles != null || analysis.frutas_grandes != null || analysis.frutas_chicas != null) && (
              <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
                {analysis.frutas_visibles != null && (
                  <div>
                    <p className="text-base font-bold text-foreground">{analysis.frutas_visibles}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                )}
                {analysis.frutas_grandes != null && (
                  <div>
                    <p className="text-base font-bold text-blue-600">{analysis.frutas_grandes}</p>
                    <p className="text-[10px] text-muted-foreground">Grandes</p>
                  </div>
                )}
                {analysis.frutas_chicas != null && (
                  <div>
                    <p className="text-base font-bold text-orange-500">{analysis.frutas_chicas}</p>
                    <p className="text-[10px] text-muted-foreground">Chicas</p>
                  </div>
                )}
              </div>
            )}
          </DetailCard>

          <DetailCard icon={Droplets} title="Detalle de Manchas" color="text-yellow-600">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-orange-500">{analysis.manchas_grandes ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Manchas grandes</p>
                <p className="text-[10px] text-muted-foreground">(mancha &gt;1cm)</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-yellow-500">{analysis.manchas_chicas ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Manchas chicas</p>
                <p className="text-[10px] text-muted-foreground">(mancha &lt;1cm)</p>
              </div>
            </div>
          </DetailCard>

          <DetailCard icon={Bug} title="Defectos detectados" color="text-red-600">
            {analysis.defects?.length > 0 ? (
              <ul className="space-y-1">
                {analysis.defects.map((d, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-600">Sin defectos detectados ✓</p>
            )}
            {analysis.defect_percentage != null && (
              <p className="text-xs text-muted-foreground mt-2">{analysis.defect_percentage}% de limones afectados</p>
            )}
          </DetailCard>

          <DetailCard icon={MessageSquare} title="Observaciones" color="text-purple-600">
            <p className="text-sm text-foreground">{analysis.observations || "Sin observaciones adicionales"}</p>
          </DetailCard>
        </div>
      </main>
    </div>
  );
}

function DetailCard({ icon: Icon, title, color, children }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}