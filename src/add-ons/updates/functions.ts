import * as fs from "fs/promises";
import http from "http";
import * as stream from "stream";

import * as DB from "./db";
import { APITypes } from "./types";

export const APIRequestsOptions = {
  noLoop: true,
};

export async function getUpdates(length: number): Promise<APITypes.UpdatesContent[]> {
  const { updates } = (await requestAPI("updates", { size: length })) as {
    updates: APITypes.Updates;
  };
  return Promise.resolve(updates.content);
}

export async function getProjectDesc(projectId: number) {
  const { project } = (await requestAPI("project", { id: projectId })) as {
    project: APITypes.Project;
  };
  return Promise.resolve(project.shortDescription);
}

export async function getChapterInfo(chapterId: number) {
  const { chapter } = (await requestAPI("chapter", { id: chapterId })) as {
    chapter: APITypes.Chapter;
  };
  return Promise.resolve(chapter);
}

function getQuery(type: string): Promise<string> {
  switch (type) {
    case "updates":
      return fs.readFile(process.cwd() + "/querys/lastPosts.txt", {
        encoding: "utf-8",
      });

    case "project":
      return fs.readFile(process.cwd() + "/querys/projectDesc.txt", {
        encoding: "utf-8",
      });

    case "chapter":
      return fs.readFile(process.cwd() + "/querys/chapterInfo.txt", {
        encoding: "utf-8",
      });

    default:
      throw new Error(`SL: No such type: ${type}`);
  }
}

async function requestAPI(type: string, vars: any) {
  console.log("ARGS: ", vars);

  if (APIRequestsOptions.noLoop && vars.size && vars.size > 50) {
    throw new Error("Too may requests");
  }

  const operationName = [type.split("").shift()?.toUpperCase()]
    .concat(type.split("").slice(1))
    .join("");

  const postData = JSON.stringify({
    operationName,
    variables: vars,
    query: await getQuery(type),
  });

  const options = {
    hostname: `${process.env.HOST_VOLUME}`,
    port: 80,
    path: "/api/site/v2/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve: (value: APITypes.APIResponse) => void) => {
    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);

      res.setEncoding("utf8");

      const chunks: string[] = [];

      res.on("readable", () => {
        let chunk;
        while (null !== (chunk = res.read())) {
          chunks.push(chunk);
        }
      });

      res.on("end", () => {
        const content = JSON.parse(chunks.join("")).data;
        resolve(content);
      });
    });

    req.on("error", (e) => {
      console.error(`problem with VolumeRequest: ${e.message}`);
    });

    // write data to request body
    req.write(postData);
    req.end();
  });
}

export function getCoverStream(path: string): Promise<stream.Readable> {
  console.log("IMG_PATH", path);

  const options = {
    hostname: `${process.env.HOST_IMAGE}`,
    port: 80,
    path: path,
    method: "GET",
  };

  return new Promise((resolve) => {
    let n: number = 0;
    const req = http.request(options, (stream) => {
      console.log(`STATUS_IMG: ${stream.statusCode} AT ${options.path}`);

      resolve(stream);
    });

    req.on("error", (e) => {
      console.error(`problem with CoverRequest: ${e.message}`);
    });
    req.end();
  });
}

export async function checkRelevance(update: APITypes.UpdatesContent): Promise<boolean> {
  const date = await DB.getSavedTime();

  if (date && update.showTime) {
    if (new Date(update.showTime) > new Date(date)) return Promise.resolve(true);
    else return Promise.resolve(false);
  }

  throw new Error("SL: Date Comparation Error");
}

function reduceChapters(update: APITypes.UpdatesContent) {
  const parentChapters: Map<number, APITypes.ParentChapter> = new Map();

  if (update.chapters) {
    for (const chapter of update.chapters) {
      if (!chapter) continue;

      if (chapter?.parentChapterId == null) {
        parentChapters.set(chapter.id, Object.assign({ childs: [] }, chapter));
      } else parentChapters.get(chapter.parentChapterId)?.childs.push(chapter);
    }
  }

  return [...parentChapters.values()];
}

export async function reduceUpdates(updates: APITypes.UpdatesContent[]) {
  let updatesMap: Map<string, APITypes.UpdatesContent> = new Map();

  updates = updates.reverse();

  for (let update of updates) {
    // если апдейт уже есть, то апдейт пересоздается с расширенным описанием глав

    let chapterInfo: APITypes.Chapter;
    if (update.chapterId) {
      chapterInfo = await getChapterInfo(update.chapterId);

      if (updatesMap.has(`${update.projectId}_${update.volumeId}`)) {
        let u = updatesMap.get(`${update.projectId}_${update.volumeId}`);
        u?.chapters?.push(chapterInfo);
      } else {
        update.chapters = [chapterInfo];
        updatesMap.set(`${update.projectId}_${update.volumeId}`, update);
      }
    }
  }

  for (let update of updatesMap.values()) {
    Object.assign(update, { chapters: reduceChapters(update) });
  }

  return [...updatesMap.values()];
}

export function updateTime(dates: string[]) {
  let times = dates.map((e) => new Date(e).getTime());
  DB.saveTime(
    times.reduce((acc, cur) => {
      if (acc > cur) return acc;
      return cur;
    })
  );
}
