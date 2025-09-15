import { Container, Row, Col, Card, Navbar, Nav } from "react-bootstrap";
import { FaUserSecret, FaServer, FaBitcoin, FaCode } from "react-icons/fa";
import MatrixBackground from "./components/MatrixBackground";

export default function App() {
  return (
    <div>
      <MatrixBackground />

      <Navbar expand="lg" variant="dark">
        <Container>
          <Navbar.Brand href="#">🟢 Hacker Dashboard</Navbar.Brand>
          <Nav>
            <Nav.Link href="#" style={{ color: "#00ff00" }}>
              Logs
            </Nav.Link>
            <Nav.Link href="#" style={{ color: "#00ff00" }}>
              Systems
            </Nav.Link>
            <Nav.Link href="#" style={{ color: "#00ff00" }}>
              Control
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row>
          <Col md={4}>
            <Card>
              <Card.Body>
                <FaUserSecret size={40} />
                <h4>Intrusion Attempts</h4>
                <p>547 detected today</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <FaServer size={40} />
                <h4>Server Status</h4>
                <p>All systems operational ✅</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <FaBitcoin size={40} />
                <h4>Crypto Wallet</h4>
                <p>Balance: 3.25 BTC</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Body>
                <FaCode size={40} />
                <h4>Live Logs</h4>
                <pre>
                  {`[09:15:24] AUTH attempt from 192.168.0.45
[09:15:30] SQL Injection blocked
[09:15:45] Mining rig connected
[09:16:10] Secure channel established`}
                </pre>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
