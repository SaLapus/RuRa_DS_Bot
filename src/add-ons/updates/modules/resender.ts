import * as stream from "stream";

import * as Discord from "discord.js";

import * as Updates from "../functions";
import { ReSenderInfo } from "../types";

export default function ReSender(update: ReSenderInfo.Data) {
  return Promise.all([ToDiscord(update)]);
}

async function ToDiscord(update: ReSenderInfo.Data) {
  if (update.type !== "rura-update") return;

  let hook: Discord.WebhookClient;

  update.debug
    ? (hook = new Discord.WebhookClient(
        process.env.HOOK_CAPTAINHOOK_ID as string,
        process.env.HOOK_CAPTAINHOOK_TOKEN as string
      ))
    : (hook = new Discord.WebhookClient(
        process.env.HOOK_RURA_ID as string,
        process.env.HOOK_RURA_TOKEN as string
      ));

  const { extended: up } = update;

  const parseChapters = up.chapters
    .map((ch) => ch.title)
    .filter((_, index, array) => index === 0 || index === array.length - 1)
    .join(" - ");
  const staff = Object.entries(up.staff)
    .map(([role, workers]) => `${role}: *${workers}*`)
    .join("\n");
  const cover = Updates.getCoverStream(up.coverURL);

  const text = `**${up.title}** - ${parseChapters}
${
  up.doneStatus
    ? `
**ЗАВЕРШЕНО**
<@&${process.env.ROLE_TO_PING_ID}>
`
    : ""
}
:link: [Читать](${up.updateURL})

${up.annotation}

${staff}`;
  await hook.send(text, new Discord.MessageAttachment((await cover) as stream.Readable));
}
