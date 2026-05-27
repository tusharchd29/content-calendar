import { getPosts, createPost, updatePost, deletePost, setupSheets } from "../../lib/sheets";

export default async function handler(req, res) {
  try {
    await setupSheets();
    if (req.method === "GET") {
      const posts = await getPosts();
      return res.json({ ok: true, posts });
    }
    if (req.method === "POST") {
      const id = await createPost(req.body);
      return res.json({ ok: true, id });
    }
    if (req.method === "PUT") {
      await updatePost(req.body);
      return res.json({ ok: true });
    }
    if (req.method === "DELETE") {
      await deletePost(req.query.id);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
