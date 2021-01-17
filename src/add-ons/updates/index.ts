import * as stream from "stream";

import * as Discord from "discord.js";

import { IndexOptions, APITypes } from "./types";

import * as Updates from "./functions";
import * as DB from "./db";

let hook: Discord.WebhookClient;

let options: IndexOptions = {
  noDB: false,

  debug: false,

  noLoop: true,

  DBTime: {},
};

setSettings();

//noDB
if (options.noDB) DB.init("no-db", options.DBTime);
else DB.init("default");

//Debug
if (options.debug) {
  hook = new Discord.WebhookClient(
    process.env.HOOK_CAPTAINHOOK_ID as string,
    process.env.HOOK_CAPTAINHOOK_TOKEN as string
  );
  runUpdates().then(() => hook.destroy());
} else {
  hook = new Discord.WebhookClient(
    process.env.HOOK_RURA_ID as string,
    process.env.HOOK_RURA_TOKEN as string
  );
  shedule(runUpdates);
}

//noLoop
Updates.APIRequestsOptions.noLoop = options.noLoop;

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

  for (let arg of new Set(args).values()) {
    switch (arg.name) {
      case "no-db":
        if (!arg.value) throw new Error("There are no args for NoDB call");

        let time: number = new Date(0).getTime();

        let days = arg.value.match(/(\d+)days/);
        let hours = arg.value.match(/(\d+)hours/);

        if (days || hours) {
          if (days) {
            time += new Date(0).setUTCHours(parseInt(days[1], 10) * 24);
          }

          if (hours) {
            time += new Date(0).setUTCHours(parseInt(hours[1], 10));
          }

          options.DBTime.timeRange = new Date(time);
        } else {
          time = parseInt(arg.value, 10);
          options.DBTime.defaultTime = time;
        }

        options.noDB = true;

        break;
      case "debug":
        options.debug = true;
        break;
      case "loop-trust":
        options.noLoop = false;
        break;
    }
  }
}

/*
Правильная настройка времени
*/
function shedule(func: () => Promise<void>) {
  let timeout = new Date(0).setUTCHours(0, 10) - (Date.now() % new Date(0).setUTCHours(0, 15));

  if (timeout < 0) {
    timeout = new Date(0).setUTCHours(0, 5) + timeout;

    console.log("Start at ", new Date(new Date().getTime() + timeout));

    setTimeout(() => {
      setTimeout(func, 30 * 1000); // Задержка для избежания проверки до релиза

      setInterval(() => {
        setTimeout(func, 30 * 1000); // Задержка для избежания проверки до релиза
      }, 5 * 60 * 1000);
    }, timeout);
    return;
  }

  console.log("Start at ", new Date(new Date().getTime() + timeout));

  setTimeout(() => {
    setInterval(() => {
      setTimeout(runUpdates, 30 * 1000); // Задержка для избежания проверки до релиза
    }, 5 * 60 * 1000);
  }, timeout);
}

async function runUpdates() {
  let updates = await getAllUpdates();
  if (updates.length === 0) {
    console.log("No Updates");
    return;
  }
  updates = await Updates.reduceUpdates(updates);
  for (const update of updates) {
    const post = await parseUpdate(update);
    const attachment = new Discord.MessageAttachment(post[1]);
    await hook.send(post[0], attachment).catch((e) => console.log(e, "\nSL: Sending Error"));
  }

  if (!options.noDB) Updates.updateTime(updates.map((e) => e.showTime));
}

async function getAllUpdates(length: number = 1): Promise<APITypes.UpdatesContent[]> {
  let updates = await Updates.getUpdates(length);
  let relevance = await Updates.checkRelevance(updates[updates.length - 1]);
  if (relevance) return Promise.resolve(getAllUpdates(++length));
  else return updates.slice(0, updates.length - 1);
}

async function parseUpdate(update: APITypes.UpdatesContent): Promise<[string, stream.Readable]> {
  let annotationText: string = "";
  if (update.volume.annotation.text) {
    let anRegArray = update.volume.annotation.text.match(/<p id="p\d">(.+)<\/p>/g);

    if (anRegArray != null) {
      let i = 0;

      for (let p of anRegArray) {
        const str = p.match(/<p id="p\d">(.+)<\/p>/);

        if (str && annotationText.length < 800) {
          // console.log("ANNOTATION #", ++i, ": ", str[1]);
          console.log("ANNOTATION#", ++i, " LENGTH: ", str[1].length);

          annotationText += "\n" + str[1].trim();
        } else break;
      }
    } else annotationText = "";
  } else annotationText = "";

  if (!annotationText)
    annotationText = "\n" + (await Updates.getProjectDesc(update.projectId)).trim();

  let staff = "";
  for (let member of update.volume.staff) {
    staff += `${member.activityName}: *${member.nickname}*\n`;
  }

  return Promise.all([
    Promise.resolve(
      `**${update.title}** - ${parseChapters(update.chapters as APITypes.ParentChapter[])}
${
  update.volume.status === "done" || update.volume.status === "decor"
    ? `\n**ЗАВЕРШЕНО**\n<@&${process.env.ROLE_TO_PING_ID}>\n`
    : ""
}
:link: [Читать](https://ruranobe.ru/r/${update.url})
${annotationText} 

${staff}`
    ),
    Updates.getCoverStream(update.volume.covers.shift()?.url as string),
  ]);
}

function parseChapters(chapters: APITypes.ParentChapter[]) {
  let updates = `${chapters.shift()?.title.trim()}`;

  if (chapters.length !== 0) {
    updates += ` - ${chapters.pop()?.title.trim()}`;
  }

  return updates;
}
