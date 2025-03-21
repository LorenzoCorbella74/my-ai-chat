import ollama from "npm:ollama";

export async function handleOllamaRequest(
  request: Request,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;

  // GET CURRENT MODEL
  if (pathname === "/api/ollama/model" && request.method === "GET") {
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
  if (pathname === "/api/ollama/models" && request.method === "GET") {
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
  if (pathname === "/api/ollama/chat" && request.method === "POST") {
    try {
      const { model, messages, temperature = 0.7, system } = await request.json();
      console.log({ model, messages, temperature, system });
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

  // DOWNLOAD MARKDOWN FILE
  if (pathname === "/api/ollama/download" && request.method === "POST") {
    try {
      const { content } = await request.json();
      const markdownContent = content;
      const headers = new Headers();
      headers.set("Content-Type", "text/markdown");
      headers.set("Content-Disposition", "attachment; filename=\"content.md\"");
      return new Response(markdownContent, { status: 200, headers });
    } catch (error) {
      console.error("Error generating markdown file:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to generate markdown file" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  return new Response("Not Found", { status: 404 });
}
