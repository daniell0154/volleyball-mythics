import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
const envDir = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  // Only public URL/key are bridged to the browser. Never expose server secrets.
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  return { envDir, server: { port: 5173, strictPort: true }, define: {
    ...(url ? { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(url) } : {}),
    ...(key ? { "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(key) } : {}),
  } };
});
