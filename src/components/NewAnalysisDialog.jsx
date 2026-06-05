import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Loader2, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const initialMeta = { batch_label: "", marca: "", calibre: "", destino: "", codigo: "", tipo_envase: "" };


export default function NewAnalysisDialog({ open: openProp, onOpenChange: onOpenChangeProp } = {}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp !== undefined ? openProp : openInternal;
  const setOpen = onOpenChangeProp !== undefined ? onOpenChangeProp : setOpenInternal;
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState(initialMeta);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const set = (key) => (e) => setMeta((m) => ({ ...m, [key]: e.target.value }));
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    }
  };

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      // Convertir imagen a base64 para enviar directamente a OpenAI sin usar créditos Base44
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result); // data:image/...;base64,...
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await base44.functions.invoke('analyzeLemon', { image_url: base64 });
      const result = response.data;

      const analysis = await base44.entities.LemonAnalysis.create({
        image_url: base64,
        image_uri: "",
        batch_label: meta.batch_label || `Lote ${new Date().toLocaleDateString("es")}`,
        marca: meta.marca,
        calibre: meta.calibre,
        destino: meta.destino,
        codigo: meta.codigo,
        tipo_envase: meta.tipo_envase,
        ...result
      });

      return analysis;
    },
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ["lemonAnalyses"] });
      toast.success("Análisis completado — calidad evaluada");
      if (onOpenChangeProp) onOpenChangeProp(false); else setOpenInternal(false);
      setFile(null);
      setPreview(null);
      setMeta(initialMeta);
      navigate(`/analysis/${analysis.id}`);
    },
    onError: () => {
      toast.error("Error al analizar la imagen. Intenta de nuevo.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {openProp === undefined && (
        <DialogTrigger asChild>
          <Button className="gap-2 shadow-md">
            <Plus className="w-4 h-4" />
            Analizar Caja
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Análisis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" placeholder="Ej: Citrus SA" value={meta.marca} onChange={set("marca")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="calibre">Calibre</Label>
              <Input id="calibre" placeholder="Ej: 48" value={meta.calibre} onChange={set("calibre")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="destino">Destino</Label>
              <Input id="destino" placeholder="Ej: USA" value={meta.destino} onChange={set("destino")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" placeholder="Ej: C-2024-01" value={meta.codigo} onChange={set("codigo")} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="tipo_envase">Tipo de Envase</Label>
              <Input id="tipo_envase" placeholder="Ej: Cartón, Madera, Plástico" value={meta.tipo_envase} onChange={set("tipo_envase")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="batch">Etiqueta del lote (opcional)</Label>
            <Input id="batch" placeholder="Ej: Lote A - Tucumán" value={meta.batch_label} onChange={set("batch_label")} className="mt-1" />
          </div>
          <div>
            <Label>Foto de la caja</Label>
            {preview ? (
              <div className="relative mt-2 rounded-lg overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Camera className="w-7 h-7 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground font-medium">Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-7 h-7 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground font-medium">Galería</span>
                </button>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            )}
          </div>
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={!file || analyzeMutation.isPending}
            className="w-full gap-2"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Analizar Caja
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}