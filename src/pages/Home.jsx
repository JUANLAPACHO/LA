import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

const Home = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_apikey') || '');
  const [currentBase64Image, setCurrentBase64Image] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [records, setRecords] = useState([]);

  // Campos manuales obligatorios basados en tu planilla de control
  const [manualData, setManualData] = useState({
    lote: '',
    marca: '',
    calibre: '',
    destino: '',
    codigo: ''
  });

  // Campos calculados automáticamente por la IA
  const [aiData, setAiData] = useState(null);

  // 1. CARGAR REGISTROS COLABORATIVOS AL ENTRAR A LA WEB
  useEffect(() => {
    fetchGlobalRecords();
  }, []);

  const fetchGlobalRecords = async () => {
    try {
      // Reemplaza esta URL por la ruta de tu API/Backend real donde se guardan los análisis
      const response = await fetch('/api/analysis'); 
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error("Error al conectar con el historial global:", error);
    }
  };

  const handleInputChange = (e) => {
    setManualData({ ...manualData, [e.target.id]: e.target.value });
  };

  // Compresor óptico para subir fotos velozmente desde el celular
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        setCurrentBase64Image(canvas.toDataURL('image/jpeg', 0.75));
        setAiData(null); 
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Análisis de Visión de Inteligencia Artificial
  const analyzeWithIA = async () => {
    if (!apiKey.trim()) {
      toast({ title: "🔑 Llave requerida", description: "Introduce una API Key de OpenAI en la barra superior.", variant: "destructive" });
      return;
    }
    if (!currentBase64Image) {
      toast({ title: "📸 Falta fotografía", description: "Por favor captura o selecciona una muestra de fruta.", variant: "destructive" });
      return;
    }

    localStorage.setItem('openai_apikey', apiKey.trim());
    setIsAnalyzing(true);
    const base64Pure = currentBase64Image.split(',')[1];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analiza la fruta de la muestra. Responde estrictamente con un JSON plano con estas llaves exactas y valores porcentuales de 0 a 100:
                  {
                    "frutas_visibles": (número entero),
                    "fruta_limpia_pct": (número),
                    "manchas_pct": (número),
                    "cicatrices_pct": (número),
                    "oleocelosis_pct": (número),
                    "dano_mecanico_pct": (número),
                    "amarillo_pct": (número),
                    "verde_claro_pct": (número),
                    "verde_oscuro_pct": (número),
                    "uniformidad_color": (texto),
                    "puntaje": (número entero del 1 al 10),
                    "clasificacion": (texto),
                    "tamano": (texto)
                  }
                  Nota: La suma de amarillo_pct + verde_claro_pct + verde_oscuro_pct debe ser exactamente 100.`
                },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Pure}` } }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const parsedResult = JSON.parse(data.choices[0].message.content);
      setAiData(parsedResult);
      toast({ title: "📊 Análisis completo", description: "Métricas de IA calculadas exitosamente." });
    } catch (err) {
      toast({ title: "❌ Error de análisis", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. ENVIAR REGISTRO COMPARTIDO AL SERVIDOR GLOBAL
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!aiData) return;

    setIsSaving(true);
    const nuevoRegistro = {
      ...manualData,
      ...aiData,
      image_base64: currentBase64Image
    };

    try {
      // Petición POST para guardar de manera centralizada en la base de datos de la web
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRegistro)
      });

      if (response.ok) {
        toast({ title: "💾 Guardado exitoso", description: "El registro ya es visible para todo el equipo." });
        setManualData({ lote: '', marca: '', calibre: '', destino: '', codigo: '' });
        setAiData(null);
        setCurrentBase64Image('');
        fetchGlobalRecords(); // Recargar historial de la red
      } else {
        throw new Error("No se pudo sincronizar con el servidor central.");
      }
    } catch (error) {
      toast({ title: "⚠️ Error de red", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Módulo de Configuración API Key */}
      <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs">
          <span className="font-bold block text-primary">⚙️ Módulo de Visión por Inteligencia Artificial</span>
          <p className="text-muted-foreground">Llave personal para ejecutar el reconocimiento visual de fruta.</p>
        </div>
        <input 
          type="password" 
          placeholder="Pegar API Key de OpenAI (sk-...)" 
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full sm:w-72 p-2 text-xs border rounded-lg bg-background outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulario Lateral de Captura */}
        <div className="lg:col-span-1 bg-card p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Nueva Inspección</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">Lote</label>
                <input type="text" id="lote" required value={manualData.lote} onChange={handleInputChange} placeholder="Ej: 6444" className="w-full px-3 py-2 border rounded-xl text-sm bg-background" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">Marca</label>
                <input type="text" id="marca" required value={manualData.marca} onChange={handleInputChange} placeholder="Ej: MARIAS" className="w-full px-3 py-2 border rounded-xl text-sm bg-background" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">Calibre</label>
                <input type="text" id="calibre" required value={manualData.calibre} onChange={handleInputChange} placeholder="Ej: 150" className="w-full px-3 py-2 border rounded-xl text-sm bg-background" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">Destino</label>
                <input type="text" id="destino" required value={manualData.destino} onChange={handleInputChange} placeholder="Ej: UE" className="w-full px-3 py-2 border rounded-xl text-sm bg-background" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">Código de Muestra</label>
              <input type="text" id="codigo" required value={manualData.codigo} onChange={handleInputChange} placeholder="Ej: 102-1A" className="w-full px-3 py-2 border rounded-xl text-sm bg-background" />
            </div>

            {/* Input de Cámara/Archivo */}
            <div className="border-2 border-dashed border-muted rounded-2xl p-4 bg-muted/30 text-center relative hover:bg-muted/50 transition">
              <label htmlFor="photoInput" className="cursor-pointer block space-y-1">
                <div className="text-xl">📸</div>
                <div className="text-xs font-bold text-primary uppercase">Capturar Muestra de Fruta</div>
                <div className="text-[10px] text-muted-foreground">Cámara o galería de imágenes</div>
              </label>
              <input type="file" id="photoInput" accept="image/*" onChange={handlePhotoChange} className="hidden"/>
              
              {currentBase64Image && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <img src={currentBase64Image} alt="Muestra" className="w-full h-32 object-cover rounded-xl border" />
                  <button 
                    type="button" 
                    disabled={isAnalyzing}
                    onClick={analyzeWithIA} 
                    className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-xl text-xs uppercase tracking-wider shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isAnalyzing ? "🧠 Analizando muestra..." : "🧠 Analizar Calidad con IA"}
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={!aiData || isSaving} className="w-full bg-foreground text-background font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition hover:opacity-90 disabled:opacity-30">
              {isSaving ? "💾 Sincronizando..." : "Guardar Registro Compartido"}
            </button>
          </form>
        </div>

        {/* Historial Central en la Nube */}
        <div className="lg:col-span-2 bg-card p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 overflow-hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight">Historial de Control Global ({records.length})</h2>
            <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase">☁️ Servidor Conectado</span>
          </div>
          
          {records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs italic">📭 No hay registros cargados en la red central todavía.</div>
          ) : (
            <div className="overflow-x-auto border rounded-xl bg-background">
              <table className="w-full text-left border-collapse text-[11px] min-w-[1250px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground uppercase text-[9px] font-bold tracking-wider">
                    <th className="p-2.5">Lote</th>
                    <th className="p-2.5">Marca</th>
                    <th className="p-2.5">Calibre</th>
                    <th className="p-2.5">Destino</th>
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5 text-center">Frutas Visibles</th>
                    <th className="p-2.5 text-center">Fruta Limpia (%)</th>
                    <th className="p-2.5 text-center">Manchas (%)</th>
                    <th className="p-2.5 text-center">Cicatrices (%)</th>
                    <th className="p-2.5 text-center">Oleocelosis (%)</th>
                    <th className="p-2.5 text-center">Daño Mecánico (%)</th>
                    <th className="p-2.5 text-center">Amarillo (%)</th>
                    <th className="p-2.5 text-center">Verde Claro (%)</th>
                    <th className="p-2.5 text-center">Verde Oscuro (%)</th>
                    <th className="p-2.5">Uniformidad Col.</th>
                    <th className="p-2.5 text-center">Puntaje</th>
                    <th className="p-2.5">Clasificación</th>
                    <th className="p-2.5">Tamaño</th>
                    <th className="p-2.5">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-card-foreground font-medium">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 font-mono text-primary">{rec.lote}</td>
                      <td className="p-2.5 font-bold">{rec.marca}</td>
                      <td className="p-2.5">{rec.calibre}</td>
                      <td className="p-2.5">{rec.destino}</td>
                      <td className="p-2.5 font-mono">{rec.codigo}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">{rec.frutas_visibles}</td>
                      <td className="p-2.5 text-center bg-green-50/50 text-green-700 font-bold">{rec.fruta_limpia_pct}%</td>
                      <td className="p-2.5 text-center text-amber-700">{rec.manchas_pct}%</td>
                      <td className="p-2.5 text-center text-orange-700">{rec.cicatrices_pct}%</td>
                      <td className="p-2.5 text-center text-purple-700">{rec.oleocelosis_pct}%</td>
                      <td className="p-2.5 text-center text-red-600">{rec.dano_mecanico_pct}%</td>
                      <td className="p-2.5 text-center bg-yellow-50 text-amber-600">{rec.amarillo_pct}%</td>
                      <td className="p-2.5 text-center bg-lime-50 text-lime-700">{rec.verde_claro_pct}%</td>
                      <td className="p-2.5 text-center bg-emerald-50 text-emerald-800">{rec.verde_oscuro_pct}%</td>
                      <td className="p-2.5 italic text-muted-foreground">{rec.uniformidad_color}</td>
                      <td className="p-2.5 text-center"><span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">{rec.puntaje}</span></td>
                      <td className="p-2.5 uppercase text-[10px]"><span className="border px-2 py-0.5 rounded bg-white shadow-sm">{rec.clasificacion}</span></td>
                      <td className="p-2.5 text-muted-foreground">{rec.tamano}</td>
                      <td className="p-2.5 text-muted-foreground font-normal whitespace-nowrap">
                        {rec.fecha ? new Date(rec.fecha).toLocaleDateString('es-ES') : rec.date || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;