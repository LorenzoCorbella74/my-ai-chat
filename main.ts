import { serveDir } from "jsr:@std/http/file-server";
import ollama from "npm:ollama";

const PORT = 3000;

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log(`Handling request for ${pathname}`);

  // GET CURRENNT MODEL
  if (url.pathname === "/api/model" && request.method === "GET") {
    try {
      const name = url.searchParams.get("name") || "";
      const currentModel = await ollama.show({ model: name });
      return new Response(JSON.stringify(currentModel), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching current model:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to fetch current model" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // GET MODEL LIST
  if (url.pathname === "/api/models" && request.method === "GET") {
    try {
      const modelList = await ollama.list();
      return new Response(JSON.stringify(modelList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching models:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to fetch models" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // CHAT
  if (url.pathname === "/api/chat" && request.method === "POST") {
    try {
      const { model, messages, temperature = 0.7, system } = await request.json();
      console.log({ model, messages });
      if (!model || !messages) {
        return new Response(
          JSON.stringify({ error: "Model and prompt are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (system) {
        messages[0] = { role: "system", content: system };
      }

      const response = await ollama.chat({
        model,
        messages: [...messages],
        options: { temperature },
        stream: true,
      });
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              // console.log("Received chunk:", chunk);
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(chunk)}\n\n`,
                ),
              );
            }
            controller.close();
          } catch (error) {
            console.error("Error in stream:", error);
            controller.error(error);
          }
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (error) {
      console.error("Error fetching models:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to chat" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Serve static files from the "public" directory
  console.log(`Serving static file for ${pathname}`);
  return serveDir(request, {
    fsRoot: "public",
  });
}

console.log(`Server running at http://localhost:${PORT}`);
Deno.serve({ port: PORT }, handleRequest);
