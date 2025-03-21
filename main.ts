import { serveDir } from "jsr:@std/http/file-server";
// routes
import { handleConversationsRequest } from "./routes/conversations.ts";
import { handleMessagesRequest } from "./routes/messages.ts";
import { handleOllamaRequest } from "./routes/ollama.ts";

const PORT = 3000;

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log(`Handling request for ${pathname} - ${request.method}`);

  // Handle conversations routes
  if (pathname.startsWith("/api/conversations")) {
    return handleConversationsRequest(request, url);
  }

  // Handle messages routes
  if (pathname.startsWith("/api/messages")) {
    return handleMessagesRequest(request, url);
  }

  if(pathname.startsWith("/api/ollama")) {
    return handleOllamaRequest(request, url);
  }

  // Serve static files from the "public" directory
  console.log(`Serving static file for ${pathname}`);
  return serveDir(request, {
    fsRoot: "public",
  });
}

console.log(`Server running at http://localhost:${PORT}`);

Deno.serve({ port: PORT }, handleRequest);
