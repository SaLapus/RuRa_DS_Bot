import * as fs from "fs/promises";
import http from "http";
import * as stream from "stream";

import * as DB from "./db";
import { APITypes } from "./types";

export const APIRequestsOptions = {
  noLoop: true,
};

export async function getUpdates(
  length: number
): Promise<APITypes.VolumeUpdate.Content | undefined> {
  const { volumeUpdates: update } = (await requestAPI("volumeUpdates", { number: length })) as {
    volumeUpdates: APITypes.VolumeUpdate.Data;
  };
  return Promise.resolve(update.content?.shift());
}

export async function getProjectDesc(projectId: number) {
  const { project } = (await requestAPI("project", { id: projectId })) as {
    project: APITypes.Project;
  };
  return Promise.resolve(project.shortDescription);
}

function getQuery(type: string): Promise<string> {
  switch (type) {
    case "volumeUpdates":
      return fs.readFile(process.cwd() + "/querys/volumeUpdates.txt", {
        encoding: "utf-8",
      });

    case "project":
      return fs.readFile(process.cwd() + "/querys/project.txt", {
        encoding: "utf-8",
      });

    case "chapter":
      return fs.readFile(process.cwd() + "/querys/chapter.txt", {
        encoding: "utf-8",
      });

    case "volume":
      return fs.readFile(process.cwd() + "/querys/volume.txt", {
        encoding: "utf-8",
      });

    default:
      throw new Error(`SL: No such type: ${type}`);
  }
}

export async function requestAPI(type: string, vars: any) {
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
      console.error(`problem with APIRequest: ${e.message}`);
    });

    // write data to request body
    req.write(postData);
    req.end();
  });
}

export function getCoverStream(path: string | undefined): Promise<stream.Readable | undefined> {
  if (!path) return Promise.resolve(undefined);
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

export async function checkRelevance(update: APITypes.VolumeUpdate.Content): Promise<boolean> {
  const date = await DB.getSavedTime();

  if (date && update.showTime) {
    if (new Date(update.showTime) > new Date(date)) return Promise.resolve(true);
    else return Promise.resolve(false);
  }

  throw new Error("SL: Date Comparation Error");
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
