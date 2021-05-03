import { APITypes, ReSenderInfo } from "../types";
import * as Updates from "../functions";

import { requestAPI } from "../functions";

import Chapters from "./chapters";

export default class UpdateInfoLoader {
  info: {
    projectId: number;
    volumeId: number;
    showTime: string;
  } = { projectId: 0, volumeId: 0, showTime: new Date(0).toISOString() }; //заглушка

  constructor(update: APITypes.VolumeUpdate.Content) {
    this.info = {
      projectId: update.projectId,
      volumeId: update.volumeId,
      showTime: update.showTime,
    };
  }

  async createUpdate(): Promise<ReSenderInfo.Update> {
    const update = new Update();

    const volume = await this.loadVolumeInfo();

    update.setTitle(volume.title);
    await update.setAnnotation(volume.annotation, this.info.projectId);

    update.setStaff(volume.staff);
    update.setStatus(volume.status);

    update.setUpdateURL(volume.url);
    update.setCoverURL(volume.covers?.shift()?.url);

    update.chapters = new Chapters(volume.chapters).filter(this.info.showTime);
    return update.toObject();
  }

  async loadVolumeInfo() {
    const { volume } = (await requestAPI("volume", { id: this.info.volumeId })) as {
      volume: APITypes.Volume;
    };
    return volume;
  }
}

class Update {
  title = "";
  chapters?: APITypes.ParentChapter[] = undefined;
  annotation = "";
  staff = {};
  doneStatus = false;

  description = "";

  updateURL = "";
  coverURL = "";

  constructor() {}

  setTitle(t: string | undefined) {
    this.title = t ? t.trim() : "";
  }

  async setAnnotation(annotation: APITypes.Annotation | string | undefined, projectId: number) {
    if (typeof annotation === "string") this.annotation = annotation;
    else if (annotation?.text) {
      const text = annotation.text.replace(/<\/?.+?>/g, "").trim();
      this.annotation = text || (await Updates.getProjectDesc(projectId));
    }
  }

  setStaff(staff: APITypes.Worker[] | undefined) {
    if (staff) {
      const staffMap: Map<string, string[]> = new Map();

      for (let member of staff) {
        if (!member.activityName) continue;

        if (staffMap.has(member.activityName))
          staffMap.set(
            member.activityName,
            (staffMap.get(member.activityName) as string[]).concat(`, ${member.nickname}`)
          );
        else staffMap.set(member.activityName, [member.nickname]);
      }

      for (let [activity, members] of staffMap) Object.assign(this.staff, { [activity]: members });
    }
  }

  setStatus(status: string | undefined) {
    if (status) status.search(/done|decor/) >= 0 && (this.doneStatus = true);
  }

  setUpdateURL(url: string) {
    this.updateURL = `https://ruranobe.ru/r/${url}`;
  }

  setCoverURL(url: string | undefined) {
    if (url) this.coverURL = url;
  }

  toObject(): ReSenderInfo.Update {
    let o = {};
    for (const [key, value] of Object.entries(this)) {
      Object.assign(o, { [key]: value });
    }
    return o as ReSenderInfo.Update;
  }
}
