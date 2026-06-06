import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import AnalysisDetail from './pages/AnalysisDetail';
import AppLayout from './components/AppLayout';
import Settings from './pages/Settings';
import { useEffect } from 'react';

const AuthenticatedApp = () => {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  // ELIMINAMOS TODOS LOS CHEQUEOS DE LOGIN Y ERRORES PARA PASAR DIRECTO
  return (
    <Routes>
      {/* Envolvemos las páginas directo en el diseño general sin ProtectedRoute */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/analysis/:id" element={<AnalysisDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename="/LA/">
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
