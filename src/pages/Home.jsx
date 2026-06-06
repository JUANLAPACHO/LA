import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx'; // Importamos la librería para generar el archivo Excel

const Home = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_apikey') || '');
  const [currentBase64Image, setCurrentBase64Image] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [records, setRecords] = useState([]);

  // Tu API vinculada a SheetDB
  const SHEETDB_URL = "https://sheetdb.io/api/v1/syqttrsthga83";

  const [manualData, setManualData] = useState({ lote: '', marca: '', calibre: '', destino: '', codigo: '' });
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    fetchGlobalRecords();
  }, []);

  const fetchGlobalRecords = async () => {
    try {
      const response = await fetch(SHEETDB_URL);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.reverse());
      }
    } catch (error) {
      console.error("Error al conectar con la base de datos cloud:", error);
    }
  };

  // NUEVA FUNCIÓN: Genera y descarga el archivo Excel localmente
  const downloadExcel = () => {
    if (records.length === 0) {
      toast({ title: "⚠️ Tabla vacía", description: "No hay registros en el historial para exportar." });
      return;
    }

    // Estructuramos y limpiamos los encabezados de las columnas para el Excel de salida
    const datosFormateados = records.map(rec => ({
      'Lote': rec.lote,
      'Marca': rec.marca,
      'Calibre': rec.calibre,
      'Destino': rec.destino,
      'Código de Muestra': rec.codigo,
      'Frutas Visibles': rec.frutas_visibles,
      'Fruta Limpia (%)': rec.fruta_limpia_pct ? `${rec.fruta_limpia_pct}%` : '',
      'Manchas (%)': rec.manchas_pct ? `${rec.manchas_pct}%` : '',
      'Cicatrices (%)': rec.cicatrices_pct ? `${rec.cicatrices_pct}%` : '',
      'Oleocelosis (%)': rec.oleocelosis_pct ? `${rec.oleocelosis_pct}%` : '',
      'Daño Mecánico (%)': rec.dano_mecanico_pct ? `${rec.dano_mecanico_pct}%` : '',
      'Amarillo (%)': rec.amarillo_pct ? `${rec.amarillo_pct}%` : '',
      'Verde Claro (%)': rec.verde_claro_pct ? `${rec.verde_claro_pct}%` : '',
      'Verde Oscuro (%)': rec.verde_oscuro_pct ? `${rec.verde_oscuro_pct}%` : '',
      'Uniformidad de Color': rec.uniformidad_color,
      'Puntaje': rec.puntaje,
      'Clasificación': rec.clasificacion,
      'Tamaño': rec.tamano,
      'Fecha de Inspección': rec.fecha
    }));

    // Crear el libro de Excel interno
    const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Calidad");

    // Obtener la fecha actual para nombrar el archivo automáticamente
    const fechaArchivo = new Date().toISOString().slice(0,10);
    
    // Ejecuta la descarga en el navegador del usuario
    XLSX.writeFile(workbook, `Reporte_Calidad_LA_${fechaArchivo}.xlsx`);
    
    toast({ title: "📊 Exportación Exitosa", description: "El archivo Excel se ha descargado en tu dispositivo." });
  };

  const handleInputChange = (e) => {
    setManualData({ ...manualData, [e.target.id]: e.target.value });
  };

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

  const analyzeWithIA = async () => {
    if (!apiKey.trim()) {
      toast({ title: "🔑 Llave requerida", description: "Introduce tu API Key en la barra superior." });
      return;
    }
    if (!currentBase64Image) {
      toast({ title: "📸 Falta foto", description: "Por favor captura una muestra de fruta." });
      return;
    }

    localStorage.setItem('openai_apikey', apiKey.trim());
    setIsAnalyzing(true);
    const base64Pure = currentBase64Image.split(',')[1];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.trim()}` },
        body: JSON.stringify({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analiza la fruta. Responde estrictamente con un JSON plano con estas llaves exactas y valores enteros de 0 a 100:
                  {
                    "frutas_visibles": (entero),
                    "fruta_limpia_pct": (número),
                    "manchas_pct": (número),
                    "cicatrices_pct": (número),
                    "oleocelosis_pct": (número),
                    "dano_mecanico_pct": (número),
                    "amarillo_pct": (número),
                    "verde_claro_pct": (número),
                    "verde_oscuro_pct": (número),
                    "uniformidad_color": (texto),
                    "puntaje": (entero del 1 al 10),
                    "clasificacion": (texto),
                    "tamano": (texto)
                  }`
                },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Pure}` } }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const parsedResult = JSON.parse(data.choices[0].message.content);
      setAiData(parsedResult);
      toast({ title: "📊 Análisis completo", description: "Métricas calculadas por la IA." });
    } catch (err) {
      toast({ title: "❌ Error", description: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!aiData) return;

    setIsSaving(true);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const nuevoRegistro = {
      ...manualData,
      ...aiData,
      fecha: formattedDate
    };

    try {
      const response = await fetch(SHEETDB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [nuevoRegistro] })
      });

      if (response.ok) {
        toast({ title: "💾 Guardado", description: "Registro añadido exitosamente." });
        setManualData({ lote: '', marca: '', calibre: '', destino: '', codigo: '' });
        setAiData(null);
        setCurrentBase64Image('');
        fetchGlobalRecords(); 
      } else {
        throw new Error("Error en el servidor de almacenamiento.");
      }
    } catch (error) {
      toast({ title: "⚠️ Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs">
          <span className="font-bold block text-primary">⚙️ Sistema Cloud Colectivo Conectado</span>
          <p className="text-muted-foreground">La información se comparte en tiempo real en la nube corporativa.</p>
        </div>
        <input 
          type="password" 
          placeholder="Pegar API Key de OpenAI (sk-...)" 
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full sm:w-72 p-2 text-xs border rounded-lg bg-background outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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

            <div className="border-2 border-dashed border-muted rounded-2xl p-4 bg-muted/30 text-center relative hover:bg-muted/50 transition">
              <label htmlFor="photoInput" className="cursor-pointer block space-y-1">
                <div className="text-xl">📸</div>
                <div className="text-xs font-bold text-primary uppercase">Cargar Foto de Fruta</div>
              </label>
              <input type="file" id="photoInput" accept="image/*" onChange={handlePhotoChange} className="hidden"/>
              {currentBase64Image && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <img src={currentBase64Image} alt="Muestra" className="w-full h-32 object-cover rounded-xl border" />
                  <button type="button" disabled={isAnalyzing} onClick={analyzeWithIA} className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-xl text-xs uppercase">
                    {isAnalyzing ? "🧠 Analizando..." : "🧠 Analizar Calidad con IA"}
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={!aiData || isSaving} className="w-full bg-foreground text-background font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md">
              {isSaving ? "💾 Sincronizando Nube..." : "Guardar Registro Completo"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-card p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 overflow-hidden">
          {/* Cabecera del Historial con el nuevo Botón de Exportar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Historial Compartido ({records.length})</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">🟢 SISTEMA ACTIVO</span>
            </div>
            
            {/* BOTÓN VERDE DE EXPORTACIÓN DIRECTA */}
            <button 
              onClick={downloadExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl uppercase tracking-wide shadow-md transition-colors"
            >
              📥 Exportar a Excel
            </button>
          </div>
          
          <div className="overflow-x-auto border rounded-xl bg-background">
            <table className="w-full text-left border-collapse text-[11px] min-w-[1250px]">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground uppercase text-[9px] font-bold tracking-wider">
                  <th className="p-2.5">Lote</th><th className="p-2.5">Marca</th><th className="p-2.5">Calibre</th><th className="p-2.5">Destino</th><th className="p-2.5">Código</th>
                  <th className="p-2.5 text-center">Visibles</th><th className="p-2.5 text-center">Limpia (%)</th><th className="p-2.5 text-center">Manchas (%)</th>
                  <th className="p-2.5 text-center">Cicatrices (%)</th><th className="p-2.5 text-center">Oleocelosis (%)</th><th className="p-2.5 text-center">Daño (%)</th>
                  <th className="p-2.5 text-center">Amarillo (%)</th><th className="p-2.5 text-center">V.Claro (%)</th><th className="p-2.5 text-center">V.Oscuro (%)</th>
                  <th className="p-2.5">Uniformidad</th><th className="p-2.5 text-center">Puntaje</th><th className="p-2.5">Clasificación</th><th className="p-2.5">Tamaño</th><th className="p-2.5">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {records.map((rec, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 font-mono text-primary">{rec.lote}</td>
                    <td className="p-2.5 font-bold">{rec.marca}</td>
                    <td className="p-2.5">{rec.calibre}</td>
                    <td className="p-2.5">{rec.destino}</td>
                    <td className="p-2.5 font-mono">{rec.codigo}</td>
                    <td className="p-2.5 text-center">{rec.frutas_visibles}</td>
                    <td className="p-2.5 text-center bg-green-50/50 text-green-700 font-bold">{rec.fruta_limpia_pct}%</td>
                    <td className="p-2.5 text-center text-amber-700">{rec.manchas_pct}%</td>
                    <td className="p-2.5 text-center text-orange-700">{rec.cicatrices_pct}%</td>
                    <td className="p-2.5 text-center text-purple-700">{rec.oleocelosis_pct}%</td>
                    <td className="p-2.5 text-center text-red-600">{rec.dano_mecanico_pct}%</td>
                    <td className="p-2.5 text-center bg-yellow-50 text-amber-600">{rec.amarillo_pct}%</td>
                    <td className="p-2.5 text-center bg-lime-50 text-lime-700">{rec.verde_claro_pct}%</td>
                    <td className="p-2.5 text-center bg-emerald-50 text-emerald-800">{rec.verde_oscuro_pct}%</td>
                    <td className="p-2.5 italic text-muted-foreground">{rec.uniformidad_color}</td>
                    <td className="p-2.5 text-center font-black text-primary">{rec.puntaje}</td>
                    <td className="p-2.5 uppercase text-[10px]">{rec.clasificacion}</td>
                    <td className="p-2.5 text-muted-foreground">{rec.tamano}</td>
                    <td className="p-2.5 text-muted-foreground whitespace-nowrap">{rec.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
