import type { IncomingMessage, ServerResponse } from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const mime: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".glb": "model/gltf-binary" };
export function createStaticHandler(directory: string) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const text = (status: number, body: string) => { response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" }); response.end(request.method === "HEAD" ? undefined : body); };
    if (request.method !== "GET" && request.method !== "HEAD") { response.setHeader("Allow", "GET, HEAD"); text(405, "Method not allowed"); return; }
    let pathname: string;
    try { pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname); }
    catch { text(400, "Bad request"); return; }
    if (pathname === "/healthz") { text(200, "ok"); return; }
    if (pathname.includes("\0") || pathname.includes("\\") || pathname.split("/").some((part) => part.startsWith("."))) { text(404, "Not found"); return; }
    let base: string;
    try { base = await realpath(directory); } catch { text(503, "Frontend não compilado. Execute npm run build."); return; }
    let file = resolve(base, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(base + sep)) { text(404, "Not found"); return; }
    try {
      try { file = await realpath(file); }
      catch {
        if (extname(pathname) || pathname.startsWith("/assets/")) { text(404, "Not found"); return; }
        file = await realpath(resolve(base, "index.html"));
      }
      if (!file.startsWith(base + sep)) { text(404, "Not found"); return; }
      const info = await stat(file);
      if (!info.isFile()) { text(404, "Not found"); return; }
      const extension = extname(file);
      response.writeHead(200, { "Content-Type": mime[extension] ?? "application/octet-stream", "Content-Length": info.size,
        "Cache-Control": extension === ".html" ? "no-cache" : pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache", "X-Content-Type-Options": "nosniff" });
      if (request.method === "HEAD") { response.end(); return; }
      const stream = createReadStream(file); stream.on("error", () => response.destroy()); stream.pipe(response);
    } catch { text(503, "Frontend indisponível. Execute npm run build."); }
  };
}
