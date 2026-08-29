/**
 * Oppenheimer E-Commerce API — main entry point
 */
import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    service: "Oppenheimer E-Commerce API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get("/api/v1/products", (_req, res) => {
  res.json({ products: [], total: 0, message: "Catalog served from seed data / database layer" });
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html><head><title>Oppenheimer Store API</title></head>
<body style="font-family:system-ui;max-width:640px;margin:2rem auto;padding:0 1rem">
  <h1>Oppenheimer E-Commerce API</h1>
  <p>Status: running</p>
  <ul>
    <li><a href="/api/health">/api/health</a></li>
    <li><a href="/api/v1/products">/api/v1/products</a></li>
  </ul>
  <p>Start the Vite client with <code>npm run dev</code> for the storefront.</p>
</body></html>`);
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Oppenheimer Server http://localhost:${PORT}`);
    console.log(`📡 API Base http://localhost:${PORT}/api/v1`);
  });
}

export default app;
