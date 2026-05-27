import { setupSheets, getSheets } from "../../lib/sheets";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const RENAMES = {
  "1": "SummarizeX",
  "2": "PyaraBaby",
  "3": "Courtesy Honda",
  "4": "SheCare",
  "5": "SSW",
  "6": "Volvo",
  "7": "VeriSeek",
  "8": "Asia Cosmetic",
  "9": "LMK Finance",
  "10": "Honda",
  "11": "Faith Diagnostic",
  "12": "Pratha Pre School",
  "13": "Tress Lounge",
  "14": "North International",
  "15": "Manthan Work Spaces",
  "16": "Softradix",
  "17": "OUTLANDER",
  "18": "Kia",
  "19": "Social Magnet",
  "20": "Body Temple",
};

export default async function handler(req, res) {
  try {
    await setupSheets();
    const sheets = getSheets();
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "SOW!A2:F1000",
    });
    const rows = existing.data.values || [];
    const updates = [];
    rows.forEach((row, i) => {
      const id = String(row[0]);
      if (RENAMES[id] && row[1] !== RENAMES[id]) {
        updates.push({ range: `SOW!B${i + 2}`, values: [[RENAMES[id]]] });
      }
    });
    if (updates.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: "RAW", data: updates },
      });
    }
    res.json({ ok: true, updated: updates.length, changes: updates.map(u => u.values[0][0]) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
