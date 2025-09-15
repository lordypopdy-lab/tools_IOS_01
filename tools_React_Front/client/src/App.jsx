// src/App.jsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Navbar,
  Nav,
  Button,
  Badge,
} from "react-bootstrap";
import { FaServer, FaWifi, FaBell, FaTerminal } from "react-icons/fa";
import MatrixBackground from "./components/MatrixBackground";
import useWebSocket from "./utils/useWebSocket";
import "./index.css";

const WS_URL =
  import.meta.env.VITE_WS_URL || "wss://tools-ios-01.onrender.com/ws"; // set via .env

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

export default function App() {
  const { connected, lastMessage, logs, send, clearLogs } = useWebSocket(
    WS_URL,
    { reconnectIntervalMs: 2000, maxLogs: 800 }
  );

  const [counters, setCounters] = useState({
    notifications: 0,
    switches: 0,
    typings: 0,
  });
  const logEndRef = useRef(null);

  const prettyLogs = useMemo(
    () =>
      logs.map((l) => {
        const text =
          typeof l.text === "string"
            ? l.text
            : typeof l.text === "object"
            ? JSON.stringify(l.text)
            : String(l.text);
        return { ...l, text };
      }),
    [logs]
  );

  useEffect(() => {
    if (logEndRef.current)
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [prettyLogs.length]);

  useEffect(() => {
    if (!lastMessage) return;
    if (typeof lastMessage === "object") {
      if (lastMessage.type === "notification") {
        setCounters((s) => ({ ...s, notifications: s.notifications + 1 }));
      } else if (lastMessage.type === "switch") {
        setCounters((s) => ({ ...s, switches: s.switches + 1 }));
      } else if (lastMessage.type === "typing") {
        setCounters((s) => ({ ...s, typings: s.typings + 1 }));
      }
    }
  }, [lastMessage]);

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", marginBottom: "40px" }}>
      <MatrixBackground />

      <Navbar expand="lg" variant="dark">
        <Container fluid>
          <Navbar.Brand style={{ color: "#00ff00", fontFamily: "monospace" }}>
            🟢 HACKMODE — PhoneActivity
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link style={{ color: "#00ff00" }}>Live</Nav.Link>
              <Nav.Link style={{ color: "#00ff00" }}>Metrics</Nav.Link>
            </Nav>
            <div style={{ marginTop: 10 }}>
              <Badge
                bg={connected ? "success" : "secondary"}
                style={{ fontFamily: "monospace" }}
              >
                {connected ? "WS CONNECTED" : "WS DISCONNECTED"}
              </Badge>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="mt-3" style={{ paddingBottom: "80px" }}>
        <Row>
          {/* Metrics Panel */}
          <Col xs={12} md={3} className="mb-3">
            <Card className="mb-3">
              <Card.Body>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FaServer size={30} />
                  <div>
                    <h6 style={{ margin: 0 }}>Notifications</h6>
                    <div style={{ fontSize: 18 }}>{counters.notifications}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Body>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FaBell size={30} />
                  <div>
                    <h6 style={{ margin: 0 }}>App Switches</h6>
                    <div style={{ fontSize: 18 }}>{counters.switches}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Body>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FaWifi size={30} />
                  <div>
                    <h6 style={{ margin: 0 }}>Typing Events</h6>
                    <div style={{ fontSize: 18 }}>{counters.typings}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <Button
                  variant="outline-success"
                  className="mb-2 w-100"
                  onClick={() => send({ type: "ping" })}
                >
                  Ping Server
                </Button>
                <Button
                  variant="outline-danger"
                  className="w-100"
                  onClick={() => clearLogs()}
                >
                  Clear Logs
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Terminal Feed */}
          <Col xs={12} md={9}>
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
              <Card.Body
                style={{
                  height: "60vh",
                  overflowY: "auto",
                  overflowX: "hidden",
                  background: "rgba(0,0,0,0.7)",
                }}
              >
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    margin: 0,
                    fontFamily: "Courier New, monospace",
                    color: "#00ff00",
                    fontSize: 13,
                  }}
                >
                  {prettyLogs.length === 0 && (
                    <div style={{ opacity: 0.6 }}>Waiting for data...</div>
                  )}
                  {prettyLogs.map((l, idx) => (
                    <div key={idx} style={{ marginBottom: 6 }}>
                      <span style={{ color: "#66ff66", fontWeight: 700 }}>
                        {formatTime(l.ts)}
                      </span>{" "}
                      <span style={{ color: "#99ff99" }}>{l.text}</span>
                    </div>
                  ))}
                </pre>
                <div ref={logEndRef}></div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
