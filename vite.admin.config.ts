import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "VITE_");
  for (const [name, value] of Object.entries(env)) {
    let privileged =
      value.startsWith("sb_secret_") ||
      /SERVICE_ROLE|PRIVATE_KEY|PASSWORD|SECRET/.test(name);
    try {
      privileged ||=
        JSON.parse(
          Buffer.from(value.split(".")[1] ?? "", "base64url").toString(),
        ).role === "service_role";
    } catch {
      /* Publishable keys are not JWTs. */
    }
    if (privileged)
      throw new Error(
        `Refusing to expose a privileged credential in browser environment variable ${name}.`,
      );
  }
  return {
    root: fileURLToPath(new URL("./admin", import.meta.url)),
    envDir: root,
    base: "/admin/",
    plugins: [react()],
    build: { outDir: "../dist/admin", emptyOutDir: true },
    server: { host: "127.0.0.1", port: 5001, strictPort: true },
  };
});
