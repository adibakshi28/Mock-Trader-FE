// src/context/WebSocketContext.js

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useAuthContext } from './AuthContext';
import { createRealtimeSocket } from '../api/websocketClient';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

// Reconnection constants
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000;   // 30 seconds

export const WebSocketProvider = ({ children }) => {
  const { accessToken, isAuthLoading } = useAuthContext();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [prices, setPrices] = useState({});  // { GS: { ltp: 560.13, day_change: 0.0 }, ... }
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);

  // Queue messages if socket is not open
  const messageQueue = useRef([]);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log('📤 Sent message:', message);
    } else {
      console.warn('⚠️ WebSocket not open. Queuing message:', message);
      messageQueue.current.push(message);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!accessToken) {
      console.warn('⚠️ No access token available. WebSocket not connected.');
      return;
    }

    ws.current = createRealtimeSocket(accessToken);

    ws.current.onopen = () => {
      setConnectionStatus('connected');
      setError(null);
      reconnectAttempts.current = 0;
      console.log('✅ WebSocket Connected');

      // **Send the subscription message upon connection**
      sendMessage({ type: 'subscribe_portfolio_watchlist' });

      // Flush queued messages
      messageQueue.current.forEach((msg) => {
        ws.current.send(JSON.stringify(msg));
        console.log('📤 Sent queued message:', msg);
      });
      messageQueue.current = [];
    };

    // Handle incoming messages
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // If it's an array of price updates
        if (Array.isArray(data)) {
          // data => [ { stock_ticker, ltp, day_change }, { ... }, ... ]
          setPrices((prevPrices) => {
            const updatedPrices = { ...prevPrices };
            data.forEach(({ stock_ticker, ltp, day_change }) => {
              const sym = stock_ticker.toUpperCase();
              // Store object { ltp, day_change }
              updatedPrices[sym] = {
                ltp: Number(ltp),
                day_change: Number(day_change),
              };
            });
            return updatedPrices;
          });
        }
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err);
      }
    };

    ws.current.onerror = (errEvent) => {
      console.error('❌ WebSocket Error:', errEvent);
      setError(errEvent);
      setConnectionStatus('error');
    };

    ws.current.onclose = (event) => {
      setConnectionStatus('disconnected');
      console.log('🔌 WebSocket Disconnected:', event.reason);

      // Attempt to reconnect if not a normal closure (1000)
      if (event.code !== 1000) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * 2 ** reconnectAttempts.current,
          MAX_RECONNECT_DELAY
        );
        console.log(`🔄 Attempting reconnection in ${delay / 1000}s...`);
        reconnectTimeout.current = setTimeout(connectWebSocket, delay);
        reconnectAttempts.current += 1;
      }
    };
  }, [accessToken, sendMessage]);

  // Connect WebSocket if we have an accessToken
  useEffect(() => {
    if (isAuthLoading) return;

    if (accessToken) {
      connectWebSocket();
    }

    // Cleanup
    return () => {
      // **Send the unsubscription message before closing the WebSocket**
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'unsubscribe_all' });
      }

      if (ws.current) {
        ws.current.close(1000, 'Component unmount or logout');
        console.log('🛑 WebSocket Connection Closed');
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [accessToken, isAuthLoading, connectWebSocket, sendMessage]);

  // If token changes, close & let the above effect reconnect
  useEffect(() => {
    if (!isAuthLoading && ws.current) {
      ws.current.close(1000, 'Access token changed');
      console.log('🔄 Reconnecting WebSocket due to access token change');
    }
  }, [accessToken, isAuthLoading]);

  const contextValue = useMemo(() => ({
    sendMessage,
    prices,
    connectionStatus,
    error,
  }), [sendMessage, prices, connectionStatus, error]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
