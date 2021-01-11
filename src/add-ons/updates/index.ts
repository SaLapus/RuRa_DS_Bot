import * as stream from "stream";

import * as Discord from "discord.js";
import { Pool } from "pg";

import { IndexOptions, APITypes } from "./types";

import * as Updates from "./functions";
import * as DB from "./db";

// подключение к БД

const hook: Discord.WebhookClient = new Discord.WebhookClient(
  process.env.HOOK_CAPTAINHOOK_ID as string,
  process.env.HOOK_CAPTAINHOOK_TOKEN as string
);

let options: IndexOptions = {
  noDB: false,

  debug: false,

  DBTime: {},
};

checkARGS();

if (options.noDB) {
  DB.init("no-db", options.DBTime);
} else {
  DB.init("default");
}

if (options.debug) {
  runUpdates().then(hook.destroy);
} else {
  shedule(runUpdates);
}

function checkARGS() {
  const args = process.argv
    .filter((e) => {
      e.startsWith("--");
    })
    .map((value) => {
      return {
        name: value.match(/(?<=--).+(?==)/)?.shift(),
        value: value.match(/(?<==).+/)?.shift(),
      };
    });

  for (let arg of args) {
    switch (arg.name) {
      case "no-db":
        if (!arg.value) throw new Error("There are no args for NoDB call");

        let o = arg.value.match(/(?<days>\d+days)(?<hours>\d+hours)|\d+/);

        if (!o) throw new Error("Matching args value error");

        let time: number = new Date(0).getTime();

        if (o.groups?.days || o.groups?.hours) {
          if (o.groups?.days) {
            const days = parseInt(o.groups.days.match(/\d+(?=days)/)?.shift() as string, 10);
            time += new Date(0).setUTCHours(days * 24);
          }

          if (o.groups?.hours) {
            const hours = parseInt(o.groups.days.match(/\d+(?=hours)/)?.shift() as string, 10);
            time += new Date(0).setUTCHours(hours);
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
    }
  }
}

function shedule(func: () => Promise<void>) {
  let timeout = new Date(0).setUTCHours(0, 10) - (Date.now() % new Date(0).setUTCHours(0, 15));

  if (timeout < 0) {
    timeout = new Date(0).setUTCHours(0, 5) + timeout;

    console.log("Start at ", new Date(timeout));

    setTimeout(() => {
      setTimeout(func, 30 * 1000); // Задержка для избежания проверки до релиза

      setInterval(() => {
        setTimeout(func, 30 * 1000); // Задержка для избежания проверки до релиза
      }, 5 * 60 * 1000);
    }, timeout);
    return;
  }

  console.log("Start at ", new Date(timeout));

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
  updates = Updates.reduceUpdates(updates);

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

          annotationText += "\n" + str[1];
        } else break;
      }
    } else annotationText = "";
  } else annotationText = "";

  if (!annotationText) annotationText = "\n" + (await Updates.getProjectDesc(update.projectId));

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

${staff}`
    ),
    Updates.getCoverStream(update.volume.covers.shift()?.url as string),
  ]);
}
