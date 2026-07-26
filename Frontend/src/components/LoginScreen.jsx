import React from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { BookOpen, LayoutGrid, Database, AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

export default function LoginScreen({ onSkip }) {
  const { loginWithGoogle, isConfigured } = useApp();
  const { showToast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error de autenticación',
        message: 'Error en Google Login: ' + err.message + '\nAsegúrate de habilitar Google Auth Provider en tu panel de Supabase.',
        duration: 8000,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center animate-slide-up">
        {/* Adornos de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>

        {/* Logo */}
        <div className="p-4 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20 mb-6">
          <BookOpen size={36} />
        </div>

        <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">La Libreta Digital</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
          Registra tus préstamos, fiados a cuotas y abonos de clientes sin complicaciones.
        </p>

        {/* Controles de autenticación */}
        <div className="mt-8 w-full space-y-3.5 z-10">
          {isConfigured ? (
            <>
              {/* Login con Google de Supabase */}
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold rounded-2xl shadow-lg border border-slate-800 dark:border-slate-200 transition-all duration-300 transform active:scale-98"
              >
                <GoogleIcon />
                Iniciar Sesión con Google
              </button>

              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed text-left">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  Requiere tener activado Google Auth Provider en tu panel de control de Supabase.
                </span>
              </div>
            </>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                <Database size={14} />
                <span>Base de Datos no Configurada</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Supabase no está enlazado en este dispositivo. Puedes usar el <strong>Modo Demo</strong> con datos locales o conectarla mediante el panel de configuración de base de datos dentro de la aplicación.
              </p>
            </div>
          )}

          {/* Botón de Modo Demo */}
          <button 
            onClick={onSkip}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-900/10 dark:shadow-violet-950/30 transition-all duration-300 transform active:scale-98"
          >
            <LayoutGrid size={18} />
            {isConfigured ? 'Usar en Modo Demo (Local)' : 'Ingresar en Modo Demo'}
          </button>
        </div>

        <div className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          Libreta de control
        </div>
      </div>
    </div>
  );
}
