import { createServer } from "vite";

const portArgIndex = process.argv.findIndex((arg) => arg === "--port");
const port = Number(process.env.PORT ?? (portArgIndex >= 0 ? process.argv[portArgIndex + 1] : 5173));

const server = await createServer({
  root: process.cwd(),
  clearScreen: false,
  server: {
    host: "127.0.0.1",
    port: Number.isFinite(port) ? port : 5173,
    strictPort: false
  }
});

await server.listen();
server.printUrls();

async function shutdown() {
  await server.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
