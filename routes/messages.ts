import db from "../db.ts";

export async function handleMessagesRequest(request: Request, url: URL): Promise<Response> {
  const pathname = url.pathname;

  // GET MESSAGES
  if (pathname === "/api/messages" && request.method === "GET") {
    try {
      const conversationId = url.searchParams.get("conversationId");
      const messages = [...db.prepare("SELECT * FROM messages WHERE conversation_id = ?").all(conversationId)];
      return new Response(JSON.stringify(messages), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to fetch messages" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // ADD MESSAGE
  if (pathname === "/api/messages" && request.method === "POST") {
    try {
      const { conversationId, role, content } = await request.json();
      db.exec("INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)", [conversationId, role, content]);
      return new Response(JSON.stringify({ message: "Message added" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error adding message:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to add message" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  return new Response("Not Found", { status: 404 });
}