import "url";

import Parser from "rss-parser";
import * as Discord from "discord.js";

import { Pool } from "pg";

import "./types";
import {
  reduceItemsToMap,
  getVolumeInfo,
  compareChapters,
  getCoverImageStream,
  writeTimeInfo,
} from "./functions";

// подключение к БД
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const parser: Parser = new Parser();

const hook: Discord.WebhookClient = new Discord.WebhookClient(
  process.env.HOOK_CAPTAINHOOK_ID as string,
  process.env.HOOK_CAPTAINHOOK_TOKEN as string
);

function startRSS() {
  // чтение времени последнего обновления из БД
  new Promise(async (resolve) => {
    try {
      const client = await pool.connect();
      const result = await client.query("SELECT * FROM time");
      resolve({ results: result ? result.rows : null });
      client.release();
    } catch (err) {
      console.error(err);
    }
  }).then(async (feedInfoTable: any) => {
    // время последнего обновления
    let lastFeedTime: number = feedInfoTable.results[0].date;

    // получение RSS-ленты
    let feed: Parser.Output = await parser.parseURL(
      "https://ruranobe.ru/updates.rss"
    );

    let items: Parser.Item[] | undefined = feed.items?.filter((v) => {
      return new Date(v.pubDate as string).getTime() > lastFeedTime;
    });

    if (items == undefined) throw "news error";
    if (items?.length === 0) {
      console.log("no news");
      return;
    }

    let lastItem = items?.sort((a, b) => {
      if (
        new Date(a.pubDate as string).getTime() <
        new Date(b.pubDate as string).getTime()
      )
        return 1;
      return -1;
    })[0];

    let lastTime: number = new Date(lastItem?.pubDate as string).getTime();

    // запись последнего обновления в ДБ
    writeTimeInfo(pool, lastTime, lastFeedTime);

    // преобразование содержимого RSS-поста в информацию для запроса к API
    let rssNews: Map<string, ItemInfo> = reduceItemsToMap(
      items.map(parseRSSItem)
    );

    // стек запросов к API
    let postStack: Promise<RequestData>[] = [];

    for (let rN of rssNews.values()) {
      postStack.push(getVolumeInfo(rN.requestInfo));
    }

    Promise.all(postStack).then((volumeInfos: RequestData[]) => {
      const ProjectsInfo: ProjInfo[] = volumeInfos.map(parseVolInfo);

      let lastTime: number = 0;
      for (let pI of ProjectsInfo) {
        console.log(
          `pI: ${pI.project}:: ch: ${pI.chapters
            .map(
              (e) =>
                "<title: " +
                e.title +
                " date: " +
                new Date(e.publishDate).getTime() +
                ">\n"
            )
            .join("\n")}`
        );

        pI.chapters.forEach((ch) => {
          const t: number = new Date(ch.publishDate).getTime();
          if (t > lastTime) lastTime = t;
        });

        // отсеивание старых глав
        pI.chapters = compareChapters(pI.chapters, lastFeedTime);

        sendDiscordMessage(pI);
      }
    });
  });
}

startRSS();
setInterval(startRSS, 5 * 60 * 1000);

// hook.destroy();

//разбор элемента ленты для запроса
function parseRSSItem(item: Parser.Item): ItemInfo {
  let time: Date = new Date(item.pubDate as string);
  let link: URL = new URL(item.link as string);

  let path: string = link.pathname;

  const RegTitle = /r\/([A-Za-z_0-9]*)\/([A-Za-z]*[0-9]*\.?[0-9]*)\/?([A-Za-z]*[0-9]*\.?[0-9]*)/; // /раздел/проект/том/глава
  const RegVolume = /([A-Za-z]*)([0-9]*\.?[0-9]*)/;
  const RegChapter = /([A-Za-z]*)([0-9]*\.?[0-9]*)?/;

  let titleInfo = path.match(RegTitle);

  if (titleInfo == null) throw "no path match";

  let project = titleInfo[1];
  let volume = titleInfo[2].match(RegVolume);

  if (volume == null) throw "no volume match";

  let chapter: RegExpMatchArray | null;

  if (titleInfo[3] != undefined) chapter = titleInfo[3].match(RegChapter);
  else chapter = null;

  const i = {
    project,
    updated: [
      {
        time,
        volume: volume[0],
        VolumeId: +volume[2],
        chapter: chapter ? chapter[0] : null,
        chapterId: !isNaN(+(chapter as RegExpMatchArray)[2])
          ? +(chapter as RegExpMatchArray)[2]
          : null,
      },
    ],

    requestInfo: {
      hostname: link.hostname,
      url: link.hostname + link.pathname,
      project: project,
      volume: volume[0],
    },
  };

  console.log(i);

  return i;
}

function parseVolInfo(VolumeInfo: RequestData): ProjInfo {
  //получение информации о тайтле

  let annotation = VolumeInfo.volume.annotation;
  let annotationText: string = "";

  if (annotation != null) {
    let anArray = annotation.text.match(/<p id="p\d">(.+)<\/p>/g);
    //   console.log(anArray);

    if (anArray != null) {
      let i = 0;

      for (let p of anArray) {
        const str = p.match(/<p id="p\d">(.+)<\/p>/);

        if (str && annotationText.length < 800) {
          console.log("ANNOTATION #", ++i, ": ", str[1]);
          console.log("LENGTH: ", str[1].length);

          annotationText += "\n" + str[1];
        } else break;
      }
    } else annotationText = "";
  } else annotationText = "";

  let staff = "";
  for (let member of VolumeInfo.volume.staff) {
    staff += `${member.activityName}: *${member.nickname}*\n`;
  }

  console.log("ParseURL", VolumeInfo.volume.covers[0].url);
  let thumbnail = VolumeInfo.volume.covers[0].url.match(/\/images\/.+/);

  return {
    project: VolumeInfo.project.url,
    title: VolumeInfo.volume.title,
    url: `https://ruranobe.ru/r/${VolumeInfo.project.url}/${VolumeInfo.volume.url}`,
    annotation: annotationText,
    staff,
    chapters: VolumeInfo.volume.chapters,
    thumbnail: (thumbnail as RegExpMatchArray)[0],
  };
}

function sendDiscordMessage({
  title,
  annotation,
  thumbnail,
  staff,
  url,
  chapters,
}: ProjInfo): void {
  let content = `**${title}**

${chapters.join("\n")}

:link: [Страница тайтла](${url})
${annotation != "" ? `${annotation}` : ""}

${staff}`;
  //${thumbnail}

  getCoverImageStream(thumbnail).then((stream) => {
    const attachment = new Discord.MessageAttachment(stream);
    hook
      .send(content, attachment)
      .catch((e) => console.log(e, "\n Sending Error"));
  });
}

// наименование глав и частей
// аннотации
