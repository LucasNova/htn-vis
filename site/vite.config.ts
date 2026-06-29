import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/htn-vis/" : "/",
  plugins: [solid()],
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
