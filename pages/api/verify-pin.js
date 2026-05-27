import { verifyPin } from "../../lib/sheets";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { pin } = req.body;
  return res.json(verifyPin(pin));
}
