import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured, updateSupabaseCredentials } from '../supabaseClient';

const AppContext = createContext();

const MOCK_CLIENTES = [
  { id: 'c1', nombre: 'Carlos Mario Pérez', cedula: '10234567', telefono: '3124567890', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c2', nombre: 'María Fernanda Restrepo', cedula: '10445678', telefono: '3157894512', created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c3', nombre: 'Roberto Gómez', cedula: '71234567', telefono: '3004561230', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c4', nombre: 'Diana Carolina Ruiz', cedula: '10334567', telefono: '3104567890', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

const MOCK_PRESTAMOS = [
  { id: 'p1', cliente_id: 'c1', producto: 'Camisa Polo y Jeans', precio_total: 180000, fecha_prestamo: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), estado: 'pagado', dias_pago_sugeridos: 'Sábados', notas: 'Cliente muy cumplido con los pagos', created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'p2', cliente_id: 'c2', producto: 'Zapatos Deportivos', precio_total: 250000, fecha_prestamo: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), estado: 'pendiente', dias_pago_sugeridos: 'Quincenal (15 y 30)', notas: 'Fio con saldo inicial de 50.000', created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'p3', cliente_id: 'c3', producto: 'Herramientas de Carpintería', precio_total: 450000, fecha_prestamo: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), estado: 'pendiente', dias_pago_sugeridos: 'Mensual', notas: 'Préstamo para taller', created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'p4', cliente_id: 'c4', producto: 'Vestido de Fiesta', precio_total: 300000, fecha_prestamo: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), estado: 'pendiente', dias_pago_sugeridos: 'Semanal (Viernes)', notas: 'Sin abono inicial', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
];

const MOCK_ABONOS = [
  { id: 'a1', prestamo_id: 'p1', monto: 100000, fecha_abono: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), notas: 'Primer abono en efectivo', created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a2', prestamo_id: 'p1', monto: 80000, fecha_abono: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), notas: 'Pago final por transferencia', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a3', prestamo_id: 'p2', monto: 50000, fecha_abono: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), notas: 'Abono inicial en tienda', created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a4', prestamo_id: 'p2', monto: 100000, fecha_abono: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), notas: 'Abono quincenal', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a5', prestamo_id: 'p3', monto: 150000, fecha_abono: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), notas: 'Abono en efectivo en el taller', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

export const AppProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('app_mode');
    if (savedMode === 'supabase' && isSupabaseConfigured()) {
      return 'supabase';
    }
    return 'demo';
  });

  const [clientes, setClientes] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  
  // Estado de Usuario Autenticado en Supabase
  const [user, setUser] = useState(null);

  // Escuchar estado de autenticación en Supabase
  useEffect(() => {
    let subscription = null;

    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });

        // Escuchar cambios
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
        subscription = data.subscription;
      }
    } else {
      setUser(null);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [mode]);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setMode('demo');
        setLoading(false);
        return;
      }

      try {
        const { data: dbClientes, error: errC } = await supabase
          .from('clientes')
          .select('*')
          .order('nombre', { ascending: true });

        const { data: dbPrestamos, error: errP } = await supabase
          .from('prestamos')
          .select('*')
          .order('fecha_prestamo', { ascending: false });

        const { data: dbAbonos, error: errA } = await supabase
          .from('abonos')
          .select('*')
          .order('fecha_abono', { ascending: false });

        if (errC || errP || errA) {
          console.error('Error al cargar datos de Supabase. Cayendo a modo demo.', { errC, errP, errA });
          fallbackToDemo();
        } else {
          setClientes(dbClientes || []);
          setPrestamos(dbPrestamos || []);
          setAbonos(dbAbonos || []);
        }
      } catch (error) {
        console.error('Excepción al cargar datos de Supabase. Cayendo a modo demo.', error);
        fallbackToDemo();
      }
    } else {
      const localClientes = localStorage.getItem('demo_clientes');
      const localPrestamos = localStorage.getItem('demo_prestamos');
      const localAbonos = localStorage.getItem('demo_abonos');

      if (localClientes && localPrestamos && localAbonos) {
        setClientes(JSON.parse(localClientes));
        setPrestamos(JSON.parse(localPrestamos));
        setAbonos(JSON.parse(localAbonos));
      } else {
        setClientes(MOCK_CLIENTES);
        setPrestamos(MOCK_PRESTAMOS);
        setAbonos(MOCK_ABONOS);
        
        localStorage.setItem('demo_clientes', JSON.stringify(MOCK_CLIENTES));
        localStorage.setItem('demo_prestamos', JSON.stringify(MOCK_PRESTAMOS));
        localStorage.setItem('demo_abonos', JSON.stringify(MOCK_ABONOS));
      }
    }
    setLoading(false);
  };

  const fallbackToDemo = () => {
    setMode('demo');
    const localClientes = localStorage.getItem('demo_clientes') || JSON.stringify(MOCK_CLIENTES);
    const localPrestamos = localStorage.getItem('demo_prestamos') || JSON.stringify(MOCK_PRESTAMOS);
    const localAbonos = localStorage.getItem('demo_abonos') || JSON.stringify(MOCK_ABONOS);
    
    setClientes(JSON.parse(localClientes));
    setPrestamos(JSON.parse(localPrestamos));
    setAbonos(JSON.parse(localAbonos));
  };

  useEffect(() => {
    loadData();
  }, [mode]);

  useEffect(() => {
    if (mode === 'demo' && !loading) {
      localStorage.setItem('demo_clientes', JSON.stringify(clientes));
      localStorage.setItem('demo_prestamos', JSON.stringify(prestamos));
      localStorage.setItem('demo_abonos', JSON.stringify(abonos));
    }
  }, [clientes, prestamos, abonos, mode, loading]);

  const toggleMode = () => {
    if (mode === 'demo') {
      if (isSupabaseConfigured()) {
        setMode('supabase');
        localStorage.setItem('app_mode', 'supabase');
      } else {
        alert('Supabase no está configurado. Por favor, configúralo primero.');
      }
    } else {
      setMode('demo');
      localStorage.setItem('app_mode', 'demo');
    }
  };

  const saveCredentials = (url, key) => {
    const success = updateSupabaseCredentials(url, key);
    if (success) {
      setIsConfigured(true);
      setMode('supabase');
      localStorage.setItem('app_mode', 'supabase');
      return true;
    }
    return false;
  };

  const clearCredentials = () => {
    updateSupabaseCredentials('', '');
    setIsConfigured(false);
    setMode('demo');
    localStorage.setItem('app_mode', 'demo');
  };

  // AUTENTICACIÓN GOOGLE DE SUPABASE
  const loginWithGoogle = async () => {
    if (mode !== 'supabase') return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    setUser(null);
  };

  // ACCIONES: CLIENTES
  const addCliente = async ({ nombre, cedula, telefono }) => {
    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('clientes')
        .insert([{ nombre, cedula, telefono }])
        .select();

      if (error) throw error;
      setClientes(prev => [...prev, data[0]].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return data[0];
    } else {
      const nuevoCliente = {
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        nombre,
        cedula,
        telefono,
        created_at: new Date().toISOString()
      };
      setClientes(prev => [...prev, nuevoCliente].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return nuevoCliente;
    }
  };

  const updateCliente = async (id, { nombre, cedula, telefono }) => {
    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('clientes')
        .update({ nombre, cedula, telefono })
        .eq('id', id)
        .select();

      if (error) throw error;
      setClientes(prev => prev.map(c => c.id === id ? data[0] : c).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return data[0];
    } else {
      setClientes(prev => prev.map(c => c.id === id ? { ...c, nombre, cedula, telefono } : c).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return { id, nombre, cedula, telefono };
    }
  };

  const deleteCliente = async (id) => {
    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setClientes(prev => prev.filter(c => c.id !== id));
      setPrestamos(prev => prev.filter(p => p.cliente_id !== id));
      const prestamosDeCliente = prestamos.filter(p => p.cliente_id === id).map(p => p.id);
      setAbonos(prev => prev.filter(a => !prestamosDeCliente.includes(a.prestamo_id)));
    } else {
      setClientes(prev => prev.filter(c => c.id !== id));
      setPrestamos(prev => prev.filter(p => p.cliente_id !== id));
      const prestamosDeCliente = prestamos.filter(p => p.cliente_id === id).map(p => p.id);
      setAbonos(prev => prev.filter(a => !prestamosDeCliente.includes(a.prestamo_id)));
    }
  };

  // ACCIONES: PRÉSTAMOS
  const addPrestamo = async ({ cliente_id, producto, precio_total, dias_pago_sugeridos, notas, fecha_prestamo, abono_inicial }) => {
    const totalAmount = parseFloat(precio_total);
    const initialAbonoAmount = abono_inicial ? parseFloat(abono_inicial) : 0;
    const estado = initialAbonoAmount >= totalAmount ? 'pagado' : 'pendiente';
    const fecha = fecha_prestamo ? new Date(fecha_prestamo).toISOString() : new Date().toISOString();

    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { data: prestamoData, error: pError } = await supabase
        .from('prestamos')
        .insert([{
          cliente_id,
          producto,
          precio_total: totalAmount,
          fecha_prestamo: fecha,
          estado,
          dias_pago_sugeridos,
          notes: notas // Nota: en la BD es notas
        }])
        .select();

      if (pError) {
        // Reintentamos con 'notas' por si el campo es notas
        const { data: prestamoDataRetry, error: pRetryError } = await supabase
          .from('prestamos')
          .insert([{
            cliente_id,
            producto,
            precio_total: totalAmount,
            fecha_prestamo: fecha,
            estado,
            dias_pago_sugeridos,
            notas
          }])
          .select();
        
        if (pRetryError) throw pRetryError;
        return finishCreatePrestamo(prestamoDataRetry[0]);
      }

      return finishCreatePrestamo(prestamoData[0]);

      async function finishCreatePrestamo(nuevoPrestamo) {
        if (initialAbonoAmount > 0) {
          const { data: abonoData, error: aError } = await supabase
            .from('abonos')
            .insert([{
              prestamo_id: nuevoPrestamo.id,
              monto: initialAbonoAmount,
              fecha_abono: fecha,
              notas: 'Abono inicial registrado al fiar'
            }])
            .select();

          if (aError) {
            console.error("Error al registrar abono inicial:", aError);
          } else {
            const { data: updatedP } = await supabase
              .from('prestamos')
              .select('*')
              .eq('id', nuevoPrestamo.id)
              .single();
              
            setPrestamos(prev => [updatedP || nuevoPrestamo, ...prev]);
            setAbonos(prev => [abonoData[0], ...prev]);
            return updatedP || nuevoPrestamo;
          }
        }

        setPrestamos(prev => [nuevoPrestamo, ...prev]);
        return nuevoPrestamo;
      }
    } else {
      const nuevoPrestamoId = 'p_' + Math.random().toString(36).substr(2, 9);
      
      const nuevoPrestamo = {
        id: nuevoPrestamoId,
        cliente_id,
        producto,
        precio_total: totalAmount,
        fecha_prestamo: fecha,
        estado,
        dias_pago_sugeridos,
        notas,
        created_at: new Date().toISOString()
      };

      if (initialAbonoAmount > 0) {
        const nuevoAbono = {
          id: 'a_' + Math.random().toString(36).substr(2, 9),
          prestamo_id: nuevoPrestamoId,
          monto: initialAbonoAmount,
          fecha_abono: fecha,
          notas: 'Abono inicial registrado al fiar',
          created_at: new Date().toISOString()
        };

        setAbonos(prev => [nuevoAbono, ...prev]);
      }

      setPrestamos(prev => [nuevoPrestamo, ...prev]);
      return nuevoPrestamo;
    }
  };

  const updatePrestamo = async (id, { producto, precio_total, dias_pago_sugeridos, notas, fecha_prestamo }) => {
    const totalAmount = parseFloat(precio_total);
    const fecha = new Date(fecha_prestamo).toISOString();

    // Calcular el estado del préstamo
    const abonosDelPrestamo = abonos.filter(a => a.prestamo_id === id);
    const totalAbonado = abonosDelPrestamo.reduce((sum, a) => sum + a.monto, 0);
    const estado = totalAbonado >= totalAmount ? 'pagado' : 'pendiente';

    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('prestamos')
        .update({
          producto,
          precio_total: totalAmount,
          fecha_prestamo: fecha,
          estado,
          dias_pago_sugeridos,
          notas
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      setPrestamos(prev => prev.map(p => p.id === id ? data[0] : p));
      return data[0];
    } else {
      const updated = {
        producto,
        precio_total: totalAmount,
        fecha_prestamo: fecha,
        estado,
        dias_pago_sugeridos,
        notas
      };
      setPrestamos(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      return { id, ...updated };
    }
  };

  const deletePrestamo = async (id) => {
    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('prestamos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPrestamos(prev => prev.filter(p => p.id !== id));
      setAbonos(prev => prev.filter(a => a.prestamo_id !== id));
    } else {
      setPrestamos(prev => prev.filter(p => p.id !== id));
      setAbonos(prev => prev.filter(a => a.prestamo_id !== id));
    }
  };

  // ACCIONES: ABONOS
  const addAbono = async ({ prestamo_id, monto, notas, fecha_abono }) => {
    const abonoMonto = parseFloat(monto);
    const fecha = fecha_abono ? new Date(fecha_abono).toISOString() : new Date().toISOString();

    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('abonos')
        .insert([{
          prestamo_id,
          monto: abonoMonto,
          fecha_abono: fecha,
          notas
        }])
        .select();

      if (error) throw error;
      const nuevoAbono = data[0];

      const { data: updatedP } = await supabase
        .from('prestamos')
        .select('*')
        .eq('id', prestamo_id)
        .single();

      if (updatedP) {
        setPrestamos(prev => prev.map(p => p.id === prestamo_id ? updatedP : p));
      }
      
      setAbonos(prev => [nuevoAbono, ...prev]);
      return { abono: nuevoAbono, prestamo: updatedP };
    } else {
      const nuevoAbono = {
        id: 'a_' + Math.random().toString(36).substr(2, 9),
        prestamo_id,
        monto: abonoMonto,
        fecha_abono: fecha,
        notas,
        created_at: new Date().toISOString()
      };

      const prestamo = prestamos.find(p => p.id === prestamo_id);
      const abonosDelPrestamo = [...abonos.filter(a => a.prestamo_id === prestamo_id), nuevoAbono];
      const totalAbonado = abonosDelPrestamo.reduce((sum, a) => sum + a.monto, 0);
      const nuevoEstado = totalAbonado >= prestamo.precio_total ? 'pagado' : 'pendiente';
      
      setAbonos(prev => [nuevoAbono, ...prev]);
      setPrestamos(prev => prev.map(p => {
        if (p.id === prestamo_id) {
          return { ...p, estado: nuevoEstado };
        }
        return p;
      }));

      return { 
        abono: nuevoAbono, 
        prestamo: { ...prestamo, estado: nuevoEstado } 
      };
    }
  };

  const deleteAbono = async (id) => {
    const abonoToDelete = abonos.find(a => a.id === id);
    if (!abonoToDelete) return;
    
    const prestamo_id = abonoToDelete.prestamo_id;

    if (mode === 'supabase') {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('abonos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const { data: updatedP } = await supabase
        .from('prestamos')
        .select('*')
        .eq('id', prestamo_id)
        .single();

      if (updatedP) {
        setPrestamos(prev => prev.map(p => p.id === prestamo_id ? updatedP : p));
      }
      setAbonos(prev => prev.filter(a => a.id !== id));
    } else {
      const prestamo = prestamos.find(p => p.id === prestamo_id);
      const abonosRestantes = abonos.filter(a => a.prestamo_id === prestamo_id && a.id !== id);
      const totalAbonado = abonosRestantes.reduce((sum, a) => sum + a.monto, 0);
      const nuevoEstado = totalAbonado >= prestamo.precio_total ? 'pagado' : 'pendiente';

      setAbonos(prev => prev.filter(a => a.id !== id));
      setPrestamos(prev => prev.map(p => {
        if (p.id === prestamo_id) {
          return { ...p, estado: nuevoEstado };
        }
        return p;
      }));
    }
  };

  return (
    <AppContext.Provider value={{
      mode,
      toggleMode,
      clientes,
      prestamos,
      abonos,
      loading,
      isConfigured,
      saveCredentials,
      clearCredentials,
      addCliente,
      updateCliente,
      deleteCliente,
      addPrestamo,
      updatePrestamo,
      deletePrestamo,
      addAbono,
      deleteAbono,
      loadData,
      user,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
