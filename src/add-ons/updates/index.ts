import * as APITypes from "./types/api";

import { DataBase } from "./modules/db";

import Listener from "./modules/sender/listener";
import Update from "./modules/sender/update";

import { IDataBase } from "./types/db";

import * as Discord from "discord.js";
import needle from "needle";

let hook: Discord.WebhookClient;

setSettings();

const DB: IDataBase = new DataBase(process.env.OFFLINE_DB);
const UpdatesListener = new Listener(DB);

function setSettings() {
  const args = process.argv
    .filter((e) => {
      return e.startsWith("--");
    })
    .map((value) => {
      const o = {
        name: value.match(/(?<=--)[\w-]+/)?.shift(),
        value: value.match(/(?<==).+/)?.shift(),
      };

      return o;
    });

  for (const arg of new Set(args).values()) {
    switch (arg.name) {
      case "no-db":
        if (!arg.value) throw new Error("There are no args for NoDB call");

        let time: number = new Date().getTime();

        const days = arg.value.match(/(\d+)days/);
        const hours = arg.value.match(/(\d+)hours/);

        if (days || hours) {
          if (days) {
            time -= new Date(0).setUTCHours(parseInt(days[1], 10) * 24);
          }

          if (hours) {
            time -= new Date(0).setUTCHours(parseInt(hours[1], 10));
          }
        } else {
          time = parseInt(arg.value, 10);
        }

        process.env.OFFLINE_DB = "" + time;

        break;
      case "long":
        process.env.API_LOOPING = "ALLOW_API_LOOPING";
        break;
      case "last":
        process.env.ONLY_ONE_POST = "ONLY_ONE_POST";
        process.env.OFFLINE_DB = "" + new Date().getTime();
    }
  }
}

UpdatesListener.on("update", updateHandler);

UpdatesListener.start();

async function updateHandler(u: APITypes.VolumeUpdates.Content) {
  try {
    const time = await DB.getSavedTime();

    if (!time) throw new Error("SL ERROR: NULLABLE TIME --- DROP UPDATE");

    const title = new Update(u, time);

    const message = await sendUpdate(title);

    if (process.env.ONLY_ONE_POST === "ONLY_ONE_POST") process.exit();

    editMessage(message.id, title);

    DB.saveTime(new Date(u?.showTime).getTime());
  } catch (e) {
    console.error(e);
  }
}

async function sendUpdate(title: Update): Promise<Discord.Message> {
  if (process.env.NODE_ENV === "DEBUG" || process.env.NODE_ENV === "LOCAL")
    hook = new Discord.WebhookClient(
      process.env.HOOK_CAPTAINHOOK_ID as string,
      process.env.HOOK_CAPTAINHOOK_TOKEN as string
    );
  else
    hook = new Discord.WebhookClient(
      process.env.HOOK_RURA_ID as string,
      process.env.HOOK_RURA_TOKEN as string
    );

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
