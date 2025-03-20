import db from "../db.ts";

export async function handleConversationsRequest(request: Request, url: URL): Promise<Response> {
  const pathname = url.pathname;

  // GET CONVERSATIONS
  if (pathname === "/api/conversations" && request.method === "GET") {
    try {
      const conversations = [...db.prepare("SELECT * FROM conversations").all()];
      return new Response(JSON.stringify(conversations), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to fetch conversations" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // ADD CONVERSATION
  if (pathname === "/api/conversations" && request.method === "POST") {
    try {
      const { title } = await request.json();
      db.exec("INSERT INTO conversations (title) VALUES (?)", [title]);
      return new Response(JSON.stringify({ id: db.lastInsertRowId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error adding conversation:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to add conversation" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // DELETE CONVERSATION
  if (pathname.startsWith("/api/conversations") && request.method === "DELETE") {
    try {
      const id = parseInt(pathname.split("/").pop() || "", 10);
      db.exec("DELETE FROM conversations WHERE id = ?", [id]);
      db.exec("DELETE FROM messages WHERE conversation_id = ?", [id]);
      return new Response(JSON.stringify({ message: "Conversation deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to delete conversation" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // EDIT CONVERSATION
  if (pathname.startsWith("/api/conversations") && request.method === "PUT") {
    try {
      const id = parseInt(pathname.split("/").pop() || "", 10);
      const { title } = await request.json();
      db.exec("UPDATE conversations SET title = ? WHERE id = ?", [title, id]);
      return new Response(JSON.stringify({ message: "Conversation updated" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating conversation:", error);
      return new Response(
        JSON.stringify({ error, message: "Failed to update conversation" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  return new Response("Not Found", { status: 404 });
}