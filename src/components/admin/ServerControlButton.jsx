import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  ServerIcon, 
  PlayIcon, 
  StopIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const SERVER_FUNCTION_URL = 'https://crxtzmykprgbgkdbqccd.functions.supabase.co/server-control';

const ServerControlButton = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  const fetchStatus = useCallback(async (isAutoPolling = false) => {
    if (!isAutoPolling) setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No lanzamos error si es auto-polling, simplemente salimos
        if (isAutoPolling) return;
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(SERVER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'status' })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Respuesta inesperada del servidor: ${text || response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error del servidor: ${response.status}`);
      }

      if (isMounted.current) {
        setStatus(data.status);
      }
    } catch (err) {
      if (isMounted.current && !isAutoPolling) {
        setError(err.message || "Error al consultar el estado");
      }
    } finally {
      if (isMounted.current && !isAutoPolling) {
        setLoading(false);
      }
    }
  }, []);

  const handleAction = async (action) => {
    if (actionLoading) return;
    
    setActionLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa para realizar esta acción");

      const response = await fetch(SERVER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(`Error de red: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error al ejecutar ${action}: ${response.status}`);
      }

      if (isMounted.current) {
        setStatus(data.status);
        fetchStatus(true);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || `Error al ejecutar la acción: ${action}`);
      }
    } finally {
      if (isMounted.current) {
        setActionLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    // 1. Escuchar cambios de sesión para disparar la carga cuando esté lista
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && isMounted.current) {
        fetchStatus();
      } else if (event === 'SIGNED_OUT' && isMounted.current) {
        setLoading(false);
        setStatus(null);
      }
    });

    // 2. Intento de carga inicial
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted.current) {
        fetchStatus();
      } else {
        // Margen para inicialización de Supabase
        setTimeout(() => {
          if (isMounted.current && loading && !status) {
            setLoading(false);
          }
        }, 2500);
      }
    };

    checkInitialSession();

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (!status || status === 'running' || status === 'stopped') return;

    const interval = setInterval(() => {
      fetchStatus(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'running':
        return {
          label: 'Encendido',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          dotColor: 'bg-green-500',
          icon: <PlayIcon className="h-5 w-5 mr-2" />
        };
      case 'stopped':
        return {
          label: 'Apagado',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          dotColor: 'bg-red-500',
          icon: <StopIcon className="h-5 w-5 mr-2" />
        };
      case 'pending':
        return {
          label: 'Encendiendo...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          dotColor: 'bg-yellow-500',
          icon: <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
        };
      case 'stopping':
        return {
          label: 'Deteniéndose...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          dotColor: 'bg-yellow-500',
          icon: <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
        };
      default:
        return {
          label: 'Desconocido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          dotColor: 'bg-gray-500',
          icon: <ServerIcon className="h-5 w-5 mr-2" />
        };
    }
  };

  if (loading && !status) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="bg-[#25c6e3]/10 p-3 rounded-full animate-pulse">
            <ServerIcon className="h-7 w-7 text-[#25c6e3]" />
          </div>
          <div>
            <p className="text-sm font-black text-[#1a2f4e] leading-tight">Control del servidor<br />EC2</p>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusDisplay();

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-[#25c6e3]/10 p-3 rounded-full">
            <ServerIcon className="h-7 w-7 text-[#25c6e3]" />
          </div>
          <div>
            <p className="text-sm font-black text-[#1a2f4e] leading-tight">Control del servidor<br />EC2</p>
            <div className="flex items-center mt-2">
              <span className={`inline-block w-3 h-3 rounded-full ${statusInfo.dotColor} mr-2`}></span>
              <span className={`text-xs font-black tracking-wider uppercase ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-2">
            {status === 'stopped' && (
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black tracking-widest text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}
                ENCENDER
              </button>
            )}
            {status === 'running' && (
              <button
                onClick={() => handleAction('stop')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black tracking-widest text-white bg-[#e80554] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <StopIcon className="h-4 w-4" />}
                APAGAR
              </button>
            )}
            <button
              onClick={() => fetchStatus()}
              disabled={actionLoading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#1a2f4e] focus:outline-none disabled:opacity-50 transition-colors"
              title="Actualizar estado"
            >
              <ArrowPathIcon className={`h-5 w-5 ${actionLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {(status === 'pending' || status === 'stopping') && (
            <p className="text-xs text-gray-400 italic">Actualizando automáticamente...</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ServerControlButton;
