import { IndexOptions, APITypes, ReSenderInfo } from "./types";

import * as Updates from "./functions";
import * as DB from "./db";

import Update from "./modules/update";
import ReSender from "./modules/resender";

const options: IndexOptions = {
  noDB: false,

  debug: false,

  noLoop: true,

  DBTime: {},
};

setSettings();
//noDB
DB.init(options.noDB ? { type: "no-db", options: options.DBTime } : undefined);
shedule();

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

  for (const arg of new Set(args).values()) {
    switch (arg.name) {
      case "no-db":
        if (!arg.value) throw new Error("There are no args for NoDB call");

        let time: number = new Date(0).getTime();

        const days = arg.value.match(/(\d+)days/);
        const hours = arg.value.match(/(\d+)hours/);

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
      case "long":
        options.noLoop = false;
        break;
      case "last":
        Updates.getUpdates(1)
          .then(async (u) => {
            if (!u) throw new Error("NO FAST UPDATE");

            const update = new Update(u);
            const a: ReSenderInfo.Data = {
              type: "rura-update",
              debug: options.debug,
              extended: await update.createUpdate(),
            };
            return ReSender(a);
          })
          .then(() => {
            process.exit();
          });
    }
  }
}

/*
Правильная настройка времени
*/
function shedule() {
  let timeout = new Date(0).setUTCHours(0, 10) - (Date.now() % new Date(0).setUTCHours(0, 15));

  if (timeout < 0) {
    timeout = new Date(0).setUTCHours(0, 5) + timeout;

    console.log("Start at ", new Date(new Date().getTime() + timeout));

    setTimeout(() => {
      setTimeout(checkUpdates, 30 * 1000); // Задержка для избежания проверки до релиза

      setInterval(() => {
        setTimeout(checkUpdates, 30 * 1000); // Задержка для избежания проверки до релиза
      }, 5 * 60 * 1000);
    }, timeout);
    return;
  }

  console.log("Start at ", new Date(new Date().getTime() + timeout));

  setTimeout(() => {
    setInterval(() => {
      setTimeout(checkUpdates, 30 * 1000); // Задержка для избежания проверки до релиза
    }, 5 * 60 * 1000);
  }, timeout);
}

async function checkUpdates() {
  const updates = await getAllUpdates();

  if (updates.length === 0) {
    console.log("No Updates");
    return;
  }

  const titles: Map<string, APITypes.VolumeUpdate.Content> = new Map();

  for (const u of updates) titles.set(`${u.projectId}_${u.volumeId}`, u);

  for (const u of titles.values()) {
    const update = new Update(u);
    const a: ReSenderInfo.Data = {
      type: "rura-update",
      debug: options.debug,
      extended: await update.createUpdate(),
    };
    ReSender(a);
    // if (process.send) process.send({ type: "rura-update", debug: options.debug, extended: await update.createUpdate() });
  }

  Updates.updateTime(updates.map((e) => e.showTime));
}

async function getAllUpdates(number = 1): Promise<APITypes.VolumeUpdate.Content[]> {
  const updates: APITypes.VolumeUpdate.Content[] = [];
  let relevance = false;
  do {
    const update = await Updates.getUpdates(number++);

    if (!update) throw new Error("INDEX_UPDATES_ERROR: Empty Update");

    relevance = await Updates.checkRelevance(update);

    if (relevance) updates.push(update);
  } while (relevance);

  return updates;
}
