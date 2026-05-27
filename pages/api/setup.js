import { google } from "googleapis";

// One-time setup route — visits /api/setup to seed the sheet
// Protected by a setup key so it can't be triggered by anyone else

export default async function handler(req, res) {
  if (req.query.key !== (process.env.SETUP_KEY || "meraki2024")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const sheets = google.sheets({ version: "v4", auth });
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const log = [];

    // ── 1. Check existing sheets
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existing = meta.data.sheets.map(s => s.properties.title);
    log.push(`Existing sheets: ${existing.join(", ")}`);

    // ── 2. Create missing sheets
    const needed = ["Posts", "Clients", "SOW", "Activity Log", "SOW Tracker"];
    const toCreate = needed.filter(n => !existing.includes(n));
    if (toCreate.length) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: toCreate.map(title => ({ addSheet: { properties: { title } } })) }
      });
      log.push(`Created sheets: ${toCreate.join(", ")}`);
    }

    const u = async (range, values) => {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID, range, valueInputOption: "RAW", requestBody: { values }
      });
    };
    const clr = async (range) => {
      await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range });
    };

    // ── 3. Posts — headers
    await u("Posts!A1", [["ID","Client","Type","Date","Time","Title","Caption","Asset Link","Remarks","Created By","Created At","Facebook Posted?","Facebook By","Facebook At","Instagram Posted?","Instagram By","Instagram At","LinkedIn Posted?","LinkedIn By","LinkedIn At","YouTube Posted?","YouTube By","YouTube At","TikTok Posted?","TikTok By","TikTok At","X/Twitter Posted?","X/Twitter By","X/Twitter At","Platforms List"]]);
    log.push("✓ Posts headers set");

    // ── 4. Clients — 20 clients with platforms
    const CLIENTS = [
      ["Softradix",           "LinkedIn,Facebook,Instagram,YouTube"],
      ["PyaraBaby",           "Facebook,Instagram"],
      ["LMK Finance",         "Facebook,Instagram,LinkedIn"],
      ["Asia Cosmetic",       "TikTok,Facebook,Instagram,YouTube"],
      ["VeriSeek",            "Facebook,Instagram,LinkedIn,YouTube,TikTok"],
      ["Manthan Work Spaces", "Facebook,Instagram"],
      ["Courtesy Honda",      "Facebook,Instagram,LinkedIn,YouTube"],
      ["Faith Diagnostic",    "Facebook,Instagram"],
      ["SSW",                 "Facebook,Instagram"],
      ["Volvo",               "Facebook,Instagram"],
      ["Pratha Pre School",   "Facebook,Instagram"],
      ["SheCare",             "Facebook,Instagram,YouTube"],
      ["Kia",                 "Facebook,Instagram"],
      ["Honda",               "Facebook,Instagram,LinkedIn,YouTube"],
      ["OUTLANDER",           "Facebook,Instagram"],
      ["North International", "Facebook,Instagram"],
      ["Tress Lounge",        "Facebook,Instagram"],
      ["Social Magnet",       "Facebook,Instagram"],
      ["Body Temple",         "Facebook,Instagram"],
      ["SummarizeX",          "Facebook,Instagram,LinkedIn"],
    ];
    await clr("Clients!A1:Z1000");
    await u("Clients!A1", [["Client Name","Platforms"], ...CLIENTS]);
    log.push(`✓ Clients: ${CLIENTS.length} rows`);

    // ── 5. SOW — 20 PPC/Organic clients
    const SOW = [
      ["1",  "SummarizeX",          "PPC",                     "-",  "A", "Active"],
      ["2",  "Pyarababy",           "PPC + Organic",           "17", "B", "Active"],
      ["3",  "Courtesy Honda",      "Organic + PPC",           "25", "C", "Active"],
      ["4",  "Shecare",             "Organic + PPC",           "5",  "D", "Inactive"],
      ["5",  "SSW",                 "PPC + Organic",           "25", "A", "Active"],
      ["6",  "VOLVO",               "PPC + Organic",           "5",  "A", "Active"],
      ["7",  "VERISEEK",            "PPC + Organic",           "20", "A", "Active"],
      ["8",  "ASIA",                "PPC + Organic",           "15", "A", "Active"],
      ["9",  "LMK",                 "Organic",                 "15", "B", "Active"],
      ["10", "HONDA",               "PPC + Organic",           "25", "C", "Active"],
      ["11", "FAITH",               "PPC + Organic",           "10", "D", "Active"],
      ["12", "PRATHA",              "PPC + Organic",           "17", "B", "Active"],
      ["13", "Tress Lounge",        "Organic",                 "5",  "B", "Inactive"],
      ["14", "North International", "PPC",                     "4",  "C", "Active"],
      ["15", "MANTHAN",             "PPC + Organic",           "12", "B", "Active"],
      ["16", "Softradix",           "PPC + Organic + 4 BLOGS", "10", "B", "Active"],
      ["17", "OUTLANDER",           "PPC",                     "15", "B", "Active"],
      ["18", "KIA",                 "Organic",                 "4",  "B", "Active"],
      ["19", "Social Magnet",       "Organic",                 "5",  "B", "Active"],
      ["20", "BODY TEMPLE",         "PPC + GMB + Organic",     "15", "B", "Active"],
    ];
    await clr("SOW!A1:Z1000");
    await u("SOW!A1", [["ID","Client Name","Service Type","Creatives Required","Priority","Status"], ...SOW]);
    const total = SOW.reduce((s, r) => { const n = parseInt(r[3]); return s + (isNaN(n) ? 0 : n); }, 0);
    log.push(`✓ SOW: ${SOW.length} clients, ${total} total creatives`);

    // ── 6. SOW Tracker headers
    await u("SOW Tracker!A1", [["Client ID","Month","Made"]]);
    log.push("✓ SOW Tracker headers set");

    // ── 7. Activity Log headers
    await u("Activity Log!A1", [["Timestamp","Action","Post ID","Details","User"]]);
    log.push("✓ Activity Log headers set");

    return res.status(200).json({
      success: true,
      message: "Sheet seeded successfully!",
      log,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`
    });

  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
