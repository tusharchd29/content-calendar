import { google } from "googleapis";

const SHEET_NAME = "Posts";
const CLIENTS_SHEET_NAME = "Clients";
const LOG_SHEET_NAME = "Activity Log";

const COL = {
  ID: 1, CLIENT: 2, TYPE: 3, DATE: 4, TIME: 5, TITLE: 6,
  CAPTION: 7, ASSET: 8, REMARKS: 9, CREATED_BY: 10, CREATED_AT: 11,
  FB_POSTED: 12, FB_BY: 13, FB_AT: 14,
  IG_POSTED: 15, IG_BY: 16, IG_AT: 17,
  LI_POSTED: 18, LI_BY: 19, LI_AT: 20,
  YT_POSTED: 21, YT_BY: 22, YT_AT: 23,
  TT_POSTED: 24, TT_BY: 25, TT_AT: 26,
  TW_POSTED: 27, TW_BY: 28, TW_AT: 29,
  PLATFORMS_LIST: 30,
};

const PLAT_COL = {
  Facebook:    { posted: COL.FB_POSTED, by: COL.FB_BY, at: COL.FB_AT },
  Instagram:   { posted: COL.IG_POSTED, by: COL.IG_BY, at: COL.IG_AT },
  LinkedIn:    { posted: COL.LI_POSTED, by: COL.LI_BY, at: COL.LI_AT },
  YouTube:     { posted: COL.YT_POSTED, by: COL.YT_BY, at: COL.YT_AT },
  TikTok:      { posted: COL.TT_POSTED, by: COL.TT_BY, at: COL.TT_AT },
  "X / Twitter": { posted: COL.TW_POSTED, by: COL.TW_BY, at: COL.TW_AT },
};

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

function colLetter(n) {
  let s = "";
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function formatDateForApp(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d)) return String(val);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch { return String(val); }
}

function formatTimeForApp(val) {
  if (!val) return "";
  try {
    if (typeof val === "string" && val.includes(":")) return val.substring(0, 5);
    const d = new Date(val);
    if (isNaN(d)) return String(val);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  } catch { return String(val); }
}

// ── ENSURE SHEETS EXIST ──────────────────────────────────────
export async function setupSheets() {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingNames = meta.data.sheets.map(s => s.properties.title);

  const toCreate = [];
  if (!existingNames.includes(SHEET_NAME)) toCreate.push({ addSheet: { properties: { title: SHEET_NAME } } });
  if (!existingNames.includes(CLIENTS_SHEET_NAME)) toCreate.push({ addSheet: { properties: { title: CLIENTS_SHEET_NAME } } });
  if (!existingNames.includes(LOG_SHEET_NAME)) toCreate.push({ addSheet: { properties: { title: LOG_SHEET_NAME } } });

  if (toCreate.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests: toCreate } });
  }

  // Set headers for Posts sheet if empty
  const postsCheck = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A1` });
  if (!postsCheck.data.values) {
    const headers = [
      "ID","Client","Type","Date","Time","Title","Caption","Asset Link","Remarks",
      "Created By","Created At",
      "Facebook Posted?","Facebook By","Facebook At",
      "Instagram Posted?","Instagram By","Instagram At",
      "LinkedIn Posted?","LinkedIn By","LinkedIn At",
      "YouTube Posted?","YouTube By","YouTube At",
      "TikTok Posted?","TikTok By","TikTok At",
      "X/Twitter Posted?","X/Twitter By","X/Twitter At",
      "Platforms List"
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }

  const clientsCheck = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${CLIENTS_SHEET_NAME}!A1` });
  if (!clientsCheck.data.values) {
    const defaultClients = [
      ["Client Name","Platforms"],
      ["Softradix","LinkedIn,Facebook,Instagram,YouTube"],
      ["PyaraBaby","Facebook,Instagram"],
      ["LMK Finance","Facebook,Instagram,LinkedIn"],
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CLIENTS_SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: defaultClients },
    });
  }
}

// ── AUTH ─────────────────────────────────────────────────────
export function verifyPin(pin) {
  const PM_PIN = process.env.PM_PIN || "1234";
  const POSTING_PIN = process.env.POSTING_PIN || "5678";
  if (pin === PM_PIN) return { ok: true, role: "pm" };
  if (pin === POSTING_PIN) return { ok: true, role: "posting" };
  return { ok: false, role: null };
}

// ── CLIENTS ──────────────────────────────────────────────────
export async function getClients() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${CLIENTS_SHEET_NAME}!A:B`,
  });
  const rows = res.data.values || [];
  const result = {};
  for (let i = 1; i < rows.length; i++) {
    const name = rows[i][0];
    const plats = rows[i][1];
    if (name) result[name] = plats ? plats.split(",").map(p => p.trim()) : [];
  }
  return result;
}

export async function saveClients(clientsObj) {
  const sheets = getSheets();
  // Clear existing
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${CLIENTS_SHEET_NAME}!A2:B1000`,
  });
  const rows = Object.entries(clientsObj).map(([name, plats]) => [name, plats.join(",")]);
  if (rows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CLIENTS_SHEET_NAME}!A2`,
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });
  }
  await logActivity("Clients Updated", "", "Client list updated by PM", "PM");
}

// ── POSTS ────────────────────────────────────────────────────
export async function getPosts() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:AD2000`,
  });
  const rows = res.data.values || [];
  const posts = rows
    .filter(r => r[COL.ID - 1])
    .map(r => {
      const platformsList = r[COL.PLATFORMS_LIST - 1]
        ? r[COL.PLATFORMS_LIST - 1].split(",").map(p => p.trim())
        : [];
      const platforms = platformsList.map(pname => {
        const cols = PLAT_COL[pname];
        if (!cols) return { name: pname, posted: false, postedBy: "", postedAt: "" };
        return {
          name: pname,
          posted: r[cols.posted - 1] === "Yes",
          postedBy: r[cols.by - 1] || "",
          postedAt: r[cols.at - 1] || "",
        };
      });
      return {
        id: String(r[COL.ID - 1]),
        client: r[COL.CLIENT - 1] || "",
        type: r[COL.TYPE - 1] || "",
        date: formatDateForApp(r[COL.DATE - 1]),
        time: formatTimeForApp(r[COL.TIME - 1]),
        title: r[COL.TITLE - 1] || "",
        caption: r[COL.CAPTION - 1] || "",
        asset: r[COL.ASSET - 1] || "",
        remarks: r[COL.REMARKS - 1] || "",
        createdBy: r[COL.CREATED_BY - 1] || "",
        createdAt: r[COL.CREATED_AT - 1] || "",
        platforms,
      };
    });
  return posts;
}

export async function createPost(postData) {
  const sheets = getSheets();
  const id = Date.now().toString();
  const now = new Date().toLocaleString("en-IN");
  const row = new Array(30).fill("");
  row[COL.ID - 1] = id;
  row[COL.CLIENT - 1] = postData.client;
  row[COL.TYPE - 1] = postData.type;
  row[COL.DATE - 1] = postData.date;
  row[COL.TIME - 1] = postData.time;
  row[COL.TITLE - 1] = postData.title;
  row[COL.CAPTION - 1] = postData.caption;
  row[COL.ASSET - 1] = postData.asset;
  row[COL.REMARKS - 1] = postData.remarks;
  row[COL.CREATED_BY - 1] = "PM";
  row[COL.CREATED_AT - 1] = now;
  row[COL.PLATFORMS_LIST - 1] = postData.platforms.join(",");
  postData.platforms.forEach(pname => {
    const cols = PLAT_COL[pname];
    if (cols) row[cols.posted - 1] = "No";
  });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
  await logActivity("Post Created", id, `"${postData.title}" for ${postData.client}`, "PM");
  return id;
}

export async function markPlatformPosted(postId, platformName, postedBy) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:A2000`,
  });
  const ids = (res.data.values || []).map(r => String(r[0]));
  const rowIndex = ids.findIndex(id => id === String(postId));
  if (rowIndex === -1) throw new Error("Post not found");
  const sheetRow = rowIndex + 2;
  const cols = PLAT_COL[platformName];
  if (!cols) throw new Error("Unknown platform");
  const now = new Date().toLocaleString("en-IN");
  const range = `${SHEET_NAME}!${colLetter(cols.posted)}${sheetRow}:${colLetter(cols.at)}${sheetRow}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [["Yes", postedBy, now]] },
  });
  await logActivity("Platform Posted", postId, `${platformName} posted by ${postedBy}`, postedBy);
}

export async function updatePost(postData) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:AD2000`,
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => String(r[COL.ID - 1]) === String(postData.id));
  if (rowIndex === -1) throw new Error("Post not found");
  const sheetRow = rowIndex + 2;

  // Get existing platforms list
  const existingPlatsList = rows[rowIndex][COL.PLATFORMS_LIST - 1] || "";
  const existingPlats = existingPlatsList.split(",").map(p => p.trim()).filter(Boolean);

  // Build update range for columns B:I (CLIENT..REMARKS) and PLATFORMS_LIST
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B${sheetRow}:I${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[postData.client, postData.type, postData.date, postData.time, postData.title, postData.caption, postData.asset, postData.remarks]] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!${colLetter(COL.PLATFORMS_LIST)}${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[postData.platforms.join(",")]] },
  });

  // Init new platforms as "No"
  for (const pname of postData.platforms) {
    if (!existingPlats.includes(pname)) {
      const cols = PLAT_COL[pname];
      if (cols) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${colLetter(cols.posted)}${sheetRow}`,
          valueInputOption: "RAW",
          requestBody: { values: [["No"]] },
        });
      }
    }
  }
  await logActivity("Post Updated", postData.id, `"${postData.title}" updated by PM`, "PM");
}

export async function deletePost(postId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:A2000`,
  });
  const ids = (res.data.values || []).map(r => String(r[0]));
  const rowIndex = ids.findIndex(id => id === String(postId));
  if (rowIndex === -1) throw new Error("Post not found");
  const sheetRow = rowIndex + 2;

  // Get sheet ID for batchUpdate
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetMeta = meta.data.sheets.find(s => s.properties.title === SHEET_NAME);
  const sheetId = sheetMeta.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: sheetRow - 1, endIndex: sheetRow },
        },
      }],
    },
  });
  await logActivity("Post Deleted", postId, `Post ${postId} deleted by PM`, "PM");
}

async function logActivity(action, postId, details, user) {
  try {
    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${LOG_SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[new Date().toLocaleString("en-IN"), action, postId, details, user]] },
    });
  } catch {}
}
