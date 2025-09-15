// src/App.jsx
import React, { useMemo, useRef, useEffect } from "react";
import { Container, Row, Col, Card, Navbar, Nav, Button, Badge } from "react-bootstrap";
import { FaWifi, FaBell, FaTerminal, FaExchangeAlt } from "react-icons/fa";
import MatrixBackground from "./components/MatrixBackground";
import useWebSocket from "./utils/useWebSocket";
import "./index.css";

const WS_URL = import.meta.env.VITE_WS_URL || "wss://tools-ios-01.onrender.com/ws"; // or your ws url

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}
function normalizeLogItem(raw) {
  const candidate = raw && typeof raw === "object" ? raw : { text: String(raw) };

  const maybePayload =
    candidate.text && typeof candidate.text === "object" ? candidate.text : candidate;

  const type = candidate.type || maybePayload.type || "message";
  const app = candidate.app || maybePayload.app || candidate.app || "unknown.app";
  const text =
    (typeof candidate.text === "string" && candidate.text) ||
    (typeof maybePayload.text === "string" && maybePayload.text) ||
    (typeof maybePayload.msg === "string" && maybePayload.msg) ||
    (typeof maybePayload.message === "string" && maybePayload.message) ||
    JSON.stringify(maybePayload).slice(0, 200); // fallback
  const icon = candidate.icon || maybePayload.icon || null;
  const ts = candidate.ts || maybePayload.ts || candidate.ts || Date.now();

  return { ts, type, app, text, icon };
}

export default function App() {
  const { connected, lastMessage, logs, send, clearLogs } = useWebSocket(WS_URL, {
    reconnectIntervalMs: 2000,
    maxLogs: 1200,
  });

  const logEndRef = useRef(null);

  // normalize all incoming logs into predictable objects
  const normalizedLogs = useMemo(() => {
    return logs.map((l) => normalizeLogItem(l));
  }, [logs]);


  const counters = useMemo(() => {
    let notifications = 0;
    let switches = 0;
    let typings = 0;

    const typingDebounceMs = 3000;
    const lastTypingTsByApp = new Map();
    let lastSwitchApp = null;

    // iterate oldest → newest
    for (const entry of normalizedLogs) {
      const { type, app, ts } = entry;

      if (type === "notification") {
        notifications += 1;
      } else if (type === "switch") {
        // only count if different from last counted switch app
        if (app !== lastSwitchApp) {
          switches += 1;
          lastSwitchApp = app;
        }
      } else if (type === "typing") {
        const prev = lastTypingTsByApp.get(app) || 0;
        if (ts - prev > typingDebounceMs) {
          typings += 1;
          lastTypingTsByApp.set(app, ts);
        }
      }
      // other types ignored for counters
    }

    return { notifications, switches, typings };
  }, [normalizedLogs]);

  // auto-scroll the feed when new logs arrive
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [normalizedLogs.length]);

  // Helper: render app label from package (last token) and an initials fallback
  function renderAppIcon(app, iconBase64) {
    if (iconBase64) {
      // display base64 image
      return (
        <img
          src={`data:image/png;base64,${iconBase64}`}
          alt={app}
          style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover", border: "1px solid #153" }}
        />
      );
    }
    // fallback: small rounded badge with last part of package
    const parts = (app || "unknown.app").split(".");
    const label = parts[parts.length - 1] || app;
    const initials = label.slice(0, 2).toUpperCase();

    return (
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#001a00",
          color: "#88ff88",
          fontSize: 11,
          border: "1px solid #154",
          fontFamily: "monospace",
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div>
      <MatrixBackground />

      {/* Navbar */}
      <Navbar expand="lg" variant="dark">
        <Container>
          <Navbar.Brand style={{ color: "#00ff00", fontFamily: "monospace" }}>
            🟢 HACKMODE — PhoneActivity
          </Navbar.Brand>
          <Nav>
            <Nav.Link style={{ color: "#00ff00" }}>Live</Nav.Link>
            <Nav.Link style={{ color: "#00ff00" }}>Metrics</Nav.Link>
          </Nav>
          <div style={{ marginLeft: 12 }}>
            <Badge bg={connected ? "success" : "secondary"} style={{ fontFamily: "monospace" }}>
              {connected ? "WS CONNECTED" : "WS DISCONNECTED"}
            </Badge>
          </div>
        </Container>
      </Navbar>

      {/* Content */}
      <Container fluid className="mt-3" style={{ maxWidth: 1200 }}>
        <Row>
          {/* Metrics Panel */}
          <Col md={3}>
            <Card className="mb-3">
              <Card.Body>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {renderAppIcon("notifications", null)}
                  <div>
                    <h6 style={{ margin: 0 }}>Notifications</h6>
                    <div style={{ fontSize: 20 }}>{counters.notifications}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Body>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {renderAppIcon("switches", null)}
                  <div>
                    <h6 style={{ margin: 0 }}>App Switches</h6>
                    <div style={{ fontSize: 20 }}>{counters.switches}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {renderAppIcon("typing", null)}
                  <div>
                    <h6 style={{ margin: 0 }}>Typing Events</h6>
                    <div style={{ fontSize: 20 }}>{counters.typings}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="mt-3">
              <Card.Body>
                <Button variant="outline-success" onClick={() => send({ type: "ping" })}>
                  Ping Server
                </Button>{" "}
                <Button variant="outline-danger" onClick={() => clearLogs()}>
                  Clear Logs
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Live Logs */}
          <Col md={9}>
            <Card>
              <Card.Header
                style={{
                  fontFamily: "monospace",
                  color: "#00ff00",
                  background: "transparent",
                  borderBottom: "1px solid #00ff00",
                }}
              >
                <FaTerminal /> Live Activity Feed
              </Card.Header>

              <Card.Body style={{ height: "60vh", overflowY: "auto", background: "rgba(0,0,0,0.85)" }}>
                {normalizedLogs.length === 0 && (
                  <div style={{ opacity: 0.6, color: "#00ff00", fontFamily: "monospace" }}>Waiting for data...</div>
                )}

                {normalizedLogs.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "#00ff00",
                      fontFamily: "Courier New, monospace",
                      fontSize: 13,
                    }}
                  >
                    {/* icon or fallback */}
                    {renderAppIcon(entry.app, entry.icon)}

                    <span style={{ color: "#66ff66", fontWeight: 700 }}>{formatTime(entry.ts)}</span>

                    <span style={{ color: "#99ff99" }}>
                      [{entry.app || "unknown"}] {entry.text}
                    </span>
                  </div>
                ))}

                <div ref={logEndRef} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
