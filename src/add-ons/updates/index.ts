import * as stream from "stream";

import * as Discord from "discord.js";
import { Pool } from "pg";

import * as Types from "./types";

import * as Updates from "./functions";
import * as DB from "./db";

// подключение к БД

const hook: Discord.WebhookClient = new Discord.WebhookClient(
  process.env.HOOK_CAPTAINHOOK_ID as string,
  process.env.HOOK_CAPTAINHOOK_TOKEN as string
);

let noDB: boolean = false;

let options: Types.TimeOptions = {};

process.argv.forEach((value) => {
  let noDBArg;
  if ((noDBArg = value.match(/--no-db=(\d+days|\d+)/))) {
    noDB = true;
    if (noDBArg[1].match(/(\d+)days/)) {
      const days = parseInt((noDBArg[1].match(/(\d+)days/) as RegExpMatchArray)[1], 10);
      (options.timeRange = new Date(0)).setHours(24 * days);
    } else options.defaultTime = parseInt(noDBArg[1], 10);
  }
});

if (noDB) {
  DB.init("no-db", options);
  runUpdates();
} else {
  DB.init("default");
  setTimeout(() => {
    setInterval(() => {
      setTimeout(runUpdates, 30 * 1000);
    }, 5 * 60 * 1000);
  }, new Date(0).setUTCHours(0, 55) - (Date.now() % new Date(0).setUTCHours(1)));
}

async function runUpdates() {
  let updates = await getAllUpdates();
  updates = Updates.reduceUpdates(updates);

  updates.forEach((e) => {
    console.log(e.url, ": ", e.shortUpdated.split("\n").join("-"), "   ", e.volume.status);
  });

  for (const update of updates) {
    const post = await parseUpdate(update);
    const attachment = new Discord.MessageAttachment(post[1]);
    await hook.send(post[0], attachment).catch((e) => console.log(e, "\nSL: Sending Error"));
  }

  if (!noDB) Updates.updateTime(updates.map((e) => e.showTime));
}

async function getAllUpdates(length: number = 1): Promise<Types.UpdatesContent[]> {
  // чтение времени последнего обновления из БД

  let updates = await Updates.getUpdates(length);
  let relevance = await Updates.checkRelevance(updates[updates.length - 1]);
  if (relevance) updates = await getAllUpdates(++length);

  return Promise.resolve(updates);
}

async function parseUpdate(update: Types.UpdatesContent): Promise<[string, stream.Readable]> {
  let annotationText: string = "";
  if (update.volume.annotation.text) {
    let anRegArray = update.volume.annotation.text.match(/<p id="p\d">(.+)<\/p>/g);

    if (anRegArray != null) {
      let i = 0;

      for (let p of anRegArray) {
        const str = p.match(/<p id="p\d">(.+)<\/p>/);

        if (str && annotationText.length < 800) {
          console.log("ANNOTATION #", ++i, ": ", str[1]);
          console.log("LENGTH: ", str[1].length);

          annotationText += "\n" + str[1];
        } else break;
      }
    } else annotationText = "";
  } else annotationText = "";

  if(!annotationText) annotationText = await Updates.getProjectDesc(update.projectId)

  let staff = "";
  for (let member of update.volume.staff) {
    staff += `${member.activityName}: *${member.nickname}*\n`;
  }

  return Promise.all([
    Promise.resolve(
      `**${update.title}**
${
  update.volume.status === "done" || update.volume.status === "decor"
    ? "\n**ЗАВЕРШЕНО**\n<@&467086240135512064>\n"
    : ""
}
${update.updated}

:link: [Страница тайтла](https://ruranobe.ru/${update.url})
${annotationText} 

{
  project(project: {fullUrl: "https://ruranobe.ru/r/ho"}) {
    shortDescription
  }
}

${staff}`
    ),
    Updates.getCoverStream(update.volume.covers.shift()?.url as string),
  ]);
}
