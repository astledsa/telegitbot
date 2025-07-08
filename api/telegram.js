export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = "astledsa/readings";
  const WORKFLOW_ID = "update-link.yml";

  const message = req.body?.message?.text || "";
  const chat_id = req.body?.message?.chat?.id;

  if (!message.startsWith("/add")) return res.status(200).send("Not /add");

  const match = message.match(/^\/add (\w+)\s+"(.+?)"\s+(https?:\/\/\S+)/);
  if (!match) return sendTelegram(chat_id, TELEGRAM_TOKEN, "❌ Invalid format. Use: /add blog \"Title\" https://...");

  const [_, category, title, url] = match;

  const ghRes = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify({ ref: "main", inputs: { category, title, url } })
  });

  const success = ghRes.status === 204;
  await sendTelegram(chat_id, TELEGRAM_TOKEN,
    success ? `✅ Added "${title}" to ${category}` : `❌ GitHub error: ${await ghRes.text()}`
  );

  res.status(200).send("OK");
}

async function sendTelegram(chat_id, token, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text }),
  });
}

