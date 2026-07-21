import { createClient } from '@supabase/supabase-js';

/**
 * Obtiene la configuración de Supabase desde localStorage o variables de entorno (Vite)
 */
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');
  
  return {
    url: localUrl || envUrl || '',
    anonKey: localKey || envKey || ''
  };
};

/**
 * Verifica si Supabase está configurado con credenciales válidas
 */
export const isSupabaseConfigured = () => {
  const { url, anonKey } = getSupabaseConfig();
  return !!(url && anonKey);
};

let supabaseInstance = null;

/**
 * Obtiene o inicializa la instancia única del cliente de Supabase
 */
export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey);
      return supabaseInstance;
    } catch (error) {
      console.error('Error al inicializar Supabase:', error);
      return null;
    }
  }
  return null;
};

/**
 * Actualiza las credenciales de Supabase en localStorage y recrea la instancia del cliente
 */
export const updateSupabaseCredentials = (url, anonKey) => {
  if (url && anonKey) {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', anonKey.trim());
    try {
      supabaseInstance = createClient(url.trim(), anonKey.trim());
      return true;
    } catch (error) {
      console.error('Error al actualizar e inicializar Supabase:', error);
      return false;
    }
  } else {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    supabaseInstance = null;
    return false;
  }
};
