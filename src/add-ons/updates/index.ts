import * as Discord from "discord.js";
import needle from "needle";
import * as dotenv from "dotenv";

dotenv.config({ path: process.env.CHILD_ENV_PATH });

import { AppAction } from "../manager";
import * as APITypes from "./types/api";
import { IJSONStorage } from "./types/db";

import getDB from "./modules/db";

import Listener from "./modules/sender/listener";
import Update from "./modules/sender/update";

const hook: Discord.WebhookClient = new Discord.WebhookClient(
  process.env.HOOK_ID as string,
  process.env.HOOK_TOKEN as string
);

const DB: IJSONStorage = getDB();
const UpdatesListener = new Listener();

UpdatesListener.on("update", updateHandler);

process.on("message", async (message: AppAction) => {
  const { type: action } = message;
  switch (action) {
    case "shedule":
      UpdatesListener.shedule();
      break;
    case "all":
      UpdatesListener.checkUpdates();
      break;
    case "one":
      UpdatesListener.getLastUpdate();
      break;
    case "stop":
      UpdatesListener.stop();
      break;
  }
});

async function updateHandler(
  updates: APITypes.VolumeUpdates.Content | APITypes.VolumeUpdates.Content[]
) {
  updates = updates instanceof Array ? updates : [updates];

  for (const u of updates) {
    if (!u) continue;

    try {
      const time = DB.getTime();

      if (!time) throw new Error("SL ERROR: BAD TIME --- DROP UPDATE");

      const title = new Update(u, time);

      const message = await sendUpdate(title);

      editMessage(message.id, title);

      DB.setTime(new Date(u.showTime));
    } catch (e) {
      console.error(e);
    }
  }
}

async function sendUpdate(title: Update): Promise<Discord.Message> {
  const update = await title.createUpdate();
  const text = update.toString();
  const imgBuffer = await update.getCover();

  return await hook.send(text, new Discord.MessageAttachment(imgBuffer));
}

function editMessage(messageID: string, title: Update) {
  const interval = setInterval(async () => {
    const update = await title.createUpdate();

    const data = {
      content: update.toString(),
      allowed_mentions: {
        roles: [process.env.ROLE_TO_PING_ID],
      },
    };

    needle.patch(
      `https://discord.com/api/webhooks/${hook.id}/${hook.token}/messages/${messageID}`,
      data,
      (err, res) => {
        console.log(`EDIT WEBHOOK MESSAGE STATUS: ${res.statusCode}`);
      }
    );
  }, 15 * 60 * 1000);

  setTimeout(() => clearInterval(interval), new Date(0).setHours(4, 1));
}
