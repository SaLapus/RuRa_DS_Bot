import * as http from "http";
import * as stream from "stream";
import { Pool } from "pg";

import "./types";

export function reduceItemsToMap(Items: ItemInfo[]): Map<string, ItemInfo> {
  let items: Map<string, ItemInfo> = new Map();

  Items.forEach((I) => {
    const i = items.get(I.project);
    if (i) i.updated.push(...I.updated);
    else items.set(I.project, I);
  });

  return items;
}

//Убрать запрос в файл
export function getVolumeInfo(variables: Request_Info): Promise<RequestData> {
  const postData = JSON.stringify({
    operationName: "Volume",
    variables,
    query: ``,
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

  let message = "";

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);

      res.setEncoding("utf8");

      res.on("data", (chunk: string) => {
        if (chunk != undefined) message += chunk; //переделать под поток
      });

      res.on("end", () => {
        resolve(JSON.parse(message).data);
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

export function getCoverImageStream(path: string): Promise<stream.Readable> {
  console.log("IMG_PATH", path);

  const options = {
    hostname: `${process.env.HOST_IMAGE}`,
    port: 80,
    path: path,
    method: "GET",
  };

  return new Promise((resolve) => {
    let n: number = 0;
    const req = http.request(options, (res) => {
      console.log(`STATUS_IMG: ${res.statusCode} AT ${options.path}`);

      resolve(res);
    });

    req.on("error", (e) => {
      console.error(`problem with CoverRequest: ${e.message}`);
    });
    req.end();
  });
}

export function compareChapters(volumeChapters: Chapter[], time: number): ParentChapter[] {
  let chapters = volumeChapters.filter((v) => new Date(v.publishDate).getTime() >= time);
  let parentChapters: ParentChapter[] = [];

  for (let ch of chapters) {
    if (ch.parentChapterId === null) parentChapters.push(ch as ParentChapter);
  }
  for (let child of chapters) {
    if (child.parentChapterId !== null) {
      for (let parent of parentChapters)
        if (parent.id === child.parentChapterId) parent.chapters?.push(child);
    }
  }

  return parentChapters.map((v) => {
    v.toString = function () {
      return this.title;
    };
    return v;
  });
}

export async function writeTimeInfo(pool: Pool, newDate: number, pastDate: number) {
  try {
    const client = await pool.connect();
    console.log(`UPDATE time SET date = ${newDate} WHERE date = ${pastDate};`);
    await client.query("UPDATE time SET date = $1 WHERE date = $2;", [newDate, pastDate]);
    client.release();
  } catch (err) {
    console.error(err);
  }
}
