import * as fs from "fs/promises";
import path from "path";

import needle from "needle";

import * as APITypes from "../../types/api";

export async function getProject(id: number): Promise<APITypes.Project> {
  console.log(`PROJECT REQUEST`);
  console.log(`ID: ${id}`);

  if (!id) throw new Error("NO PROJECT ID");

  const responce = await needle(
    "post",
    `${process.env.HOST_VOLUME}/api/site/v2/graphql`,
    {
      operationName: "Project",
      variables: { id },
      query: await getQuery("project"),
    },
    {
      content_type: "application/json",
    }
  );

  console.log(`PROJECT STATUS: ${responce.statusCode}`);
  return responce.body.data.project;
}

export async function getUpdate(
  offset = 1
): Promise<APITypes.VolumeUpdates.Content | undefined> {

  if (process.env.API_LOOPING !== "ALLOW_API_LOOPING" && offset && offset > 50) {
    throw new Error("Too may requests");
  }

  console.log(`UPDATE OFFSET: ${offset}`);

  const responce = await needle(
    "post",
    `${process.env.HOST_VOLUME}/api/site/v2/graphql`,
    {
      operationName: "VolumeUpdates",
      variables: { number: offset },
      query: await getQuery("volumeUpdates"),
    },
    {
      content_type: "application/json",
    }
  );

  console.log(`VOLUME UPDATES STATUS: ${responce.statusCode}`);

  return responce.body.data.volumeUpdates?.content?.shift();
}

export async function getVolume(id: number): Promise<APITypes.Volume> {
  console.log(`VOLUME REQUEST`);
  console.log(`ID: ${id}`);

  if (!id) throw new Error("NO VOLUME ID");

  const responce = await needle(
    "post",
    `${process.env.HOST_VOLUME}/api/site/v2/graphql`,
    {
      operationName: "Volume",
      variables: { id },
      query: await getQuery("volume"),
    },
    {
      content_type: "application/json",
    }
  );

  console.log(`VOLUME STATUS: ${responce.statusCode}`);

  return responce.body.data.volume;
}

export async function getCoverStream(path: string): Promise<Buffer> {
  if (!path) throw new Error("SL API GET COVER ERROR: NO PATH");

  console.log("IMG_PATH: ", path);

  const responce = await needle("get", `${process.env.HOST_IMAGE}${path}`);

  console.log(`STATUS_IMG: ${responce.statusCode} AT ${path}`);

  return responce.body;
}

async function getQuery(type: string): Promise<string> {
  const filename = path.join(__dirname, "querys", `${type}.txt`);

  const querys = await fs.readdir(path.join(__dirname, "querys"));

  if (querys.some((f) => f === `${type}.txt`))
    return fs.readFile(filename, {
      encoding: "utf-8",
    });

  throw new Error(`SL: No such type: ${type}`);
}
