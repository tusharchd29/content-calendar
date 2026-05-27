import { getSOW, saveSOWRow, saveSOWTracker, deleteSOWRow, setupSheets } from "../../lib/sheets";

const SOW_PIN = process.env.SOW_PIN || "11111";

export default async function handler(req, res) {
  try {
    await setupSheets();

    if (req.method === "GET") {
      const rows = await getSOW();
      return res.json({ ok: true, rows });
    }

    if (req.method === "POST") {
      const { sowPin, row, tracker } = req.body || {};
      if (sowPin !== SOW_PIN) return res.status(403).json({ ok: false, error: "Invalid SOW PIN" });
      if (tracker) {
        await saveSOWTracker(tracker.clientId, tracker.month, tracker.made);
      } else {
        await saveSOWRow(row);
      }
      return res.json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { sowPin, id } = req.body || {};
      if (sowPin !== SOW_PIN) return res.status(403).json({ ok: false, error: "Invalid SOW PIN" });
      await deleteSOWRow(id);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
