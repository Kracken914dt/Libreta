import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Database, Info, Copy, Check, AlertTriangle } from 'lucide-react';
import { getSupabaseConfig } from '../supabaseClient';

export default function SupabaseConfigModal({ isOpen, onClose }) {
  const { mode, saveCredentials, clearCredentials, isConfigured, showConfirm } = useApp();
  const currentConfig = getSupabaseConfig();
  
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleConnect = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!url.trim() || !anonKey.trim()) {
      setErrorMsg('Por favor rellena ambos campos para conectar.');
      return;
    }

    try {
      const success = saveCredentials(url, anonKey);
      if (success) {
        setSuccessMsg('¡Conectado exitosamente! Cargando base de datos...');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg('Error al conectar. Verifica que los datos sean correctos.');
      }
    } catch (err) {
      setErrorMsg('Error de configuración: ' + err.message);
    }
  };

  const handleDisconnect = () => {
    showConfirm(
      '¿Estás seguro de desconectar Supabase? Volverás al Modo Demo (datos locales).',
      'Desconectar Supabase',
      () => {
        clearCredentials();
        setUrl('');
        setAnonKey('');
        setSuccessMsg('Desconectado. Has vuelto al modo de demostración.');
        setTimeout(() => {
          setSuccessMsg('');
        }, 3000);
      }
    );
  };

  const sqlScript = `-- Ejecuta este código en la sección "SQL Editor" de tu proyecto en Supabase:

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cedula TEXT,
    telefono TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    producto TEXT NOT NULL,
    precio_total NUMERIC NOT NULL CHECK (precio_total >= 0),
    fecha_prestamo TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
    dias_pago_sugeridos TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS abonos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID REFERENCES prestamos(id) ON DELETE CASCADE,
    monto NUMERIC NOT NULL CHECK (monto > 0),
    fecha_abono TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger de recalculación de estado automático
CREATE OR REPLACE FUNCTION recalcular_estado_prestamo()
RETURNS TRIGGER AS $$
DECLARE
    v_prestamo_id UUID;
    v_precio_total NUMERIC;
    v_total_abonado NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_prestamo_id := OLD.prestamo_id;
    ELSE
        v_prestamo_id := NEW.prestamo_id;
    END IF;
    SELECT precio_total INTO v_precio_total FROM prestamos WHERE id = v_prestamo_id;
    SELECT COALESCE(SUM(monto), 0) INTO v_total_abonado FROM abonos WHERE prestamo_id = v_prestamo_id;
    IF v_total_abonado >= v_precio_total THEN
        UPDATE prestamos SET estado = 'pagado' WHERE id = v_prestamo_id;
    ELSE
        UPDATE prestamos SET estado = 'pendiente' WHERE id = v_prestamo_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalcular_estado_prestamo ON abonos;
CREATE TRIGGER trigger_recalcular_estado_prestamo
AFTER INSERT OR UPDATE OR DELETE ON abonos
FOR EACH ROW
EXECUTE FUNCTION recalcular_estado_prestamo();
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-slide-up max-h-[90vh]">
        {/* Encabezado */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/20">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configuración de Base de Datos</h2>
              <p className="text-xs text-slate-400">Conecta tu propia base de datos Supabase</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Alerta de Modo de Uso */}
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            isConfigured 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
              : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
          }`}>
            <Info size={20} className="shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">
                {isConfigured 
                  ? 'Conectado a tu Supabase en la nube.' 
                  : 'Actualmente ejecutándose en MODO DEMO.'}
              </p>
              <p className="text-slate-400 leading-relaxed">
                {isConfigured
                  ? 'Todos los datos se guardan y leen directamente en tu servidor de Supabase. Si deseas volver al modo demo local, presiona Desconectar.'
                  : 'Los datos que registres ahora se guardarán en la memoria del navegador (localStorage). Para sincronizar y usar tu propia base de datos permanente, introduce tus credenciales de Supabase abajo.'}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Supabase Project URL</label>
              <input 
                type="text" 
                placeholder="https://xxxxxx.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isConfigured}
                className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Supabase API Anon Key</label>
              <input 
                type="password" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                disabled={isConfigured}
                className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-emerald-400 font-semibold">{successMsg}</p>}

            <div className="flex gap-3 pt-2">
              {!isConfigured ? (
                <button 
                  type="submit"
                  className="flex-1 py-2 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Guardar y Conectar
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleDisconnect}
                  className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Desconectar Supabase
                </button>
              )}
            </div>
          </form>

          {/* Sección de Script SQL de la Base de Datos */}
          <div className="border-t border-slate-800/80 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Instrucciones de la Base de Datos</span>
              <button 
                onClick={() => setShowSql(!showSql)}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
              >
                {showSql ? 'Ocultar Código SQL' : 'Ver Código SQL'}
              </button>
            </div>

            {showSql && (
              <div className="space-y-2 animate-fade-in">
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-300/80 text-[11px] rounded-lg leading-relaxed flex gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Antes de conectar, debes ejecutar el siguiente código en el <strong>SQL Editor</strong> de Supabase para crear las tablas y triggers requeridos, o de lo contrario el sistema fallará.
                  </span>
                </div>

                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl text-[10px] text-slate-300 overflow-x-auto font-mono max-h-48 border border-slate-850">
                    {sqlScript}
                  </pre>
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                    title="Copiar Código"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
