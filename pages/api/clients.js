import { getClients, saveClients, setupSheets } from "../../lib/sheets";

export default async function handler(req, res) {
  try {
    await setupSheets();
    if (req.method === "GET") {
      const clients = await getClients();
      return res.json({ ok: true, clients });
    }
    if (req.method === "POST") {
      await saveClients(req.body.clients);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
