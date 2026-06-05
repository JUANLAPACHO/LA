import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, PlusCircle, Settings } from "lucide-react";
import { useState } from "react";
import NewAnalysisDialog from "./NewAnalysisDialog";

const navItems = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: null, icon: PlusCircle, label: "Analizar", isAction: true },
  { path: "/settings", icon: Settings, label: "Ajustes" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        <div className="page-enter">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = !item.isAction && location.pathname === item.path;
            if (item.isAction) {
              return (
                <div key="action" className="flex flex-col items-center">
                  <NewAnalysisDialog open={dialogOpen} onOpenChange={setDialogOpen} />
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px]"
                  >
                    <item.icon className="w-6 h-6 text-primary" />
                    <span className="text-[10px] text-primary font-medium">{item.label}</span>
                  </button>
                </div>
              );
            }
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-4"
              >
                <item.icon
                  className={`w-6 h-6 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}