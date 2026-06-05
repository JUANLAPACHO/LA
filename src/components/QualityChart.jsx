import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import moment from "moment";

export default function QualityChart({ analyses }) {
  const data = [...analyses]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-20)
    .map((a) => ({
      date: moment(a.created_date).format("DD/MM"),
      calidad: a.quality_score || 0,
      defectos: a.defect_percentage || 0,
      label: a.batch_label || "Sin etiqueta",
    }));

  if (data.length < 2) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Tendencia de Calidad</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(82, 55%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(82, 55%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(48, 20%, 88%)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(150, 5%, 45%)" />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(150, 5%, 45%)" />
            <Tooltip
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid hsl(48, 20%, 88%)",
                fontSize: "0.875rem"
              }}
              formatter={(value, name) => [
                name === "calidad" ? `${value}/10` : `${value}%`,
                name === "calidad" ? "Calidad" : "Defectos"
              ]}
            />
            <Area
              type="monotone"
              dataKey="calidad"
              stroke="hsl(82, 55%, 40%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorQuality)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}