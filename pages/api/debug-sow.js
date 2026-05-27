import { getPosts, getSOW, getClients, setupSheets } from "../../lib/sheets";

export default async function handler(req, res) {
  await setupSheets();
  const [posts, sowRows, clients] = await Promise.all([getPosts(), getSOW(), getClients()]);

  const postClientNames = [...new Set(posts.map(p => p.client).filter(Boolean))].sort();
  const clientSheetNames = Object.keys(clients).sort();
  const sowClients = sowRows.map(r => ({ id: r.id, name: r.clientName }));

  res.json({ postClientNames, clientSheetNames, sowClients });
}
