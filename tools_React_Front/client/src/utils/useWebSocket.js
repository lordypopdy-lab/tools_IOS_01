// src/utils/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";

export default function useWebSocket(url, options = {}) {
  const { reconnectIntervalMs = 2000, maxLogs = 1000 } = options;

  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback(
    (msg) => {
      setLogs((prev) => {
        const next = prev.concat(msg);
        if (next.length > maxLogs) return next.slice(next.length - maxLogs);
        return next;
      });
    },
    [maxLogs]
  );

  const connect = useCallback(() => {
    if (!url) return;
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        reconnectRef.current = 0;
        setConnected(true);
        addLog({ ts: Date.now(), type: "system", text: "WS connected" });
      };

      wsRef.current.onmessage = (ev) => {
        let parsed = null;
        try {
          parsed = JSON.parse(ev.data);
        } catch (err) {
          parsed = { type: "raw", text: ev.data };
        }
        setLastMessage(parsed);
        addLog({ ts: Date.now(), type: parsed.type || "message", text: parsed });
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        addLog({ ts: Date.now(), type: "system", text: "WS disconnected" });
        // reconnect with exponential backoff
        reconnectRef.current = Math.min(30000, reconnectRef.current + reconnectIntervalMs);
        setTimeout(() => connect(), reconnectRef.current || reconnectIntervalMs);
      };

      wsRef.current.onerror = (err) => {
        console.error("WS error", err);
        addLog({ ts: Date.now(), type: "system", text: "WS error" });
        wsRef.current.close();
      };
    } catch (err) {
      console.error("WS connection failed", err);
      addLog({ ts: Date.now(), type: "system", text: "WS connect exception" });
    }
  }, [url, addLog, reconnectIntervalMs]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        try { wsRef.current.close(); } catch(e) {}
      }
    };
  }, [connect]);

  const send = useCallback((obj) => {
    if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof obj === "string" ? obj : JSON.stringify(obj);
      wsRef.current.send(payload);
      addLog({ ts: Date.now(), type: "out", text: payload });
      return true;
    }
    addLog({ ts: Date.now(), type: "system", text: "WS send failed - not connected" });
    return false;
  }, [connected, addLog]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { connected, lastMessage, logs, send, clearLogs };
}
