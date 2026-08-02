import React from 'react';
import { HelpCircle } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function GuidedTour() {
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Finalizar Tour!',
      steps: [
        {
          element: '#tour-dashboard-stats',
          popover: {
            title: '1. Resumen Financiero en Tiempo Real',
            description: 'Monitorea tus métricas clave: Saldo Pendiente total por cobrar, Total Recaudado en caja neto, número de Deudores Activos y Préstamos pendientes.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-nav-menu',
          popover: {
            title: '2. Navegación entre Módulos',
            description: 'Accede rápidamente a las secciones principales: Dashboard, Gestión de Clientes, Préstamos y Fiados, Inventario de Productos y Categorías.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#tour-new-loan-btn',
          popover: {
            title: '3. Registro de Préstamos y Fiados',
            description: 'Registra un nuevo préstamo seleccionando un cliente, agregando uno o varios productos, definiendo notas y abonos iniciales si aplica.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#tour-recent-activity',
          popover: {
            title: '4. Recaudación y Movimientos Diarios',
            description: 'Visualiza la gráfica de ingresos de los últimos 7 días y la lista cronológica de abonos, fiados registrados y devoluciones procesadas.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#tour-theme-toggle',
          popover: {
            title: '5. Personalización de Interfaz (Modo Claro / Oscuro)',
            description: 'Alterna en cualquier momento entre el modo oscuro de alta fidelidad y el modo claro según tus preferencias visuales.',
            side: 'left',
            align: 'center'
          }
        }
      ]
    });

    driverObj.drive();
  };

  return (
    <button
      onClick={startTour}
      aria-label="Ayuda y Tour guiado"
      title="Ver Tour Guiado / Ayuda"
      className="fixed bottom-5 right-5 z-40 w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-violet-600/30 hover:scale-110 active:scale-95 transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-violet-500/40"
    >
      <HelpCircle size={24} className="group-hover:rotate-12 transition-transform duration-200" />
      <span className="absolute right-full mr-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        ¿Necesitas ayuda? Haz clic aquí
      </span>
    </button>
  );
}
