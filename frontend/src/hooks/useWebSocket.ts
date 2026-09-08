import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch } from '../app/hooks';
import { baseApi } from '../api/baseApi';
import { logout } from '../features/auth/authSlice';
import type { WebSocketEventMessage } from '../types';

interface UseWebSocketOptions {
  organizationId?: string;
  autoConnect?: boolean;
  onMessage?: (message: WebSocketEventMessage) => void;
}

export function useWebSocket({
  organizationId,
  autoConnect = true,
  onMessage,
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketEventMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const dispatch = useAppDispatch();

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem('token');
    const orgId = organizationId || localStorage.getItem('selectedOrgId');

    if (!token || !orgId) {
      setIsConnected(false);
      return;
    }

    const wsBase = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';
    // Match spec: ws://localhost:8000/ws/organizations/{organization_id}?token={jwt}
    const wsUrl = `${wsBase.replace(/\/ws\/?$/, '')}/ws/organizations/${orgId}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Refetch REST queries upon connection/reconnection to sync missed events
        dispatch(baseApi.util.invalidateTags([{ type: 'Incident', id: 'LIST' }, { type: 'Service', id: 'LIST' }]));
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketEventMessage = JSON.parse(event.data);
          setLastMessage(parsed);

          // Handle WebSocket event envelope
          switch (parsed.type) {
            case 'incident.created':
            case 'incident.status_changed':
            case 'incident.assigned':
              dispatch(baseApi.util.invalidateTags([{ type: 'Incident', id: 'LIST' }]));
              if (parsed.incident_id) {
                dispatch(baseApi.util.invalidateTags([{ type: 'Incident', id: parsed.incident_id }]));
              }
              break;

            case 'incident.comment_added':
              if (parsed.incident_id) {
                dispatch(baseApi.util.invalidateTags([{ type: 'Incident', id: parsed.incident_id }]));
              }
              break;

            case 'service.health_check':
            case 'service.status_changed':
              dispatch(baseApi.util.invalidateTags([{ type: 'Service', id: 'LIST' }]));
              if (parsed.service_id) {
                dispatch(baseApi.util.invalidateTags([{ type: 'Service', id: parsed.service_id }]));
              }
              break;

            default:
              break;
          }

          if (onMessage) {
            onMessage(parsed);
          }
        } catch {
          // Ignore unparseable raw events
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);

        // Handle specific server close codes per spec
        if (event.code === 4401) {
          // Token expired or invalid
          dispatch(logout());
          return;
        }

        if (event.code === 4403) {
          // Not a member of this org
          return;
        }

        // Automatic reconnection with exponential/fixed backoff
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 4000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      setIsConnected(false);
    }
  }, [organizationId, onMessage, dispatch]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect && organizationId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, organizationId, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
  };
}

export default useWebSocket;
