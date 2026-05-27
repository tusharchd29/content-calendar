import { getSOW, saveSOWRow, deleteSOWRow, setupSheets } from "../../lib/sheets";

const SOW_PIN = process.env.SOW_PIN || "11111";

export default async function handler(req, res) {
  try {
    await setupSheets();

    if (req.method === "GET") {
      const rows = await getSOW();
      return res.json({ ok: true, rows });
    }

    // All write operations require SOW PIN
    const { sowPin } = req.body || {};
    if (sowPin !== SOW_PIN) {
      return res.status(403).json({ ok: false, error: "Invalid SOW PIN" });
    }

    if (req.method === "POST") {
      await saveSOWRow(req.body.row);
      return res.json({ ok: true });
    }

    if (req.method === "DELETE") {
      await deleteSOWRow(req.body.id);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
