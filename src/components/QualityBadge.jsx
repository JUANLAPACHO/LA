import { cn } from "@/lib/utils";

const gradeConfig = {
  premium: { label: "Premium", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  primera: { label: "Primera", className: "bg-green-100 text-green-800 border-green-200" },
  segunda: { label: "Segunda", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  descarte: { label: "Descarte", className: "bg-red-100 text-red-800 border-red-200" },
};

export default function QualityBadge({ grade, size = "default" }) {
  const config = gradeConfig[grade] || gradeConfig.segunda;
  return (
    <span className={cn(
      "inline-flex items-center font-semibold border rounded-full",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      config.className
    )}>
      {config.label}
    </span>
  );
}