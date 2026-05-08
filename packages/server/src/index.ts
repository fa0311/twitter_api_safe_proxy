import fs from "node:fs/promises";
import { serve } from "@hono/node-server";
import createApp from "./app.js";
import { loadSettings } from "./utils/settings.js";

const data = await fs.readFile("./../settings.json", "utf-8");
const settings = await loadSettings(JSON.parse(data));
const [app] = await createApp(settings);

serve({ fetch: app.fetch, port: settings.port });
