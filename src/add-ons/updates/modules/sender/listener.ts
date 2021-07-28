import EventEmitter from "events";

import { API } from "../api";

import * as APITypes from "../../types/api";
import { IDataBase } from "../../types/db";
import * as ReSender from "../../types/resender";

export default class UpdatesClient extends EventEmitter implements ReSender.Client {
  DB: IDataBase;

  constructor(db: IDataBase) {
    super();

    this.DB = db;
  }

  start(): void {
    if (process.env.ONLY_ONE_POST === "ONLY_ONE_POST") this.getLastUpdate();
    else if (process.env.NODE_ENV === "LOCAL" || process.env.NODE_ENV === "DEBUG")
      this.checkUpdates();
    else this.shedule();
  }

  private async getLastUpdate(): Promise<void> {
    const u = await API.getUpdate(1);
    if (u) {
      this.emit("update", u);
    }
  }

  private shedule() {
    let timeout = new Date(0).setUTCHours(0, 10) - (Date.now() % new Date(0).setUTCHours(0, 15));

    if (timeout < 0) {
      timeout = new Date(0).setUTCHours(0, 5) + timeout;

      console.log("Start at ", new Date(new Date().getTime() + timeout));

      setTimeout(() => {
        setTimeout(() => this.checkUpdates(), 30 * 1000); // Задержка для избежания проверки до релиза

        setInterval(() => {
          setTimeout(() => this.checkUpdates(), 30 * 1000); // Задержка для избежания проверки до релиза
        }, 5 * 60 * 1000);
      }, timeout);
    } else {
      console.log("Start at ", new Date(new Date().getTime() + timeout));

      setTimeout(() => {
        return setInterval(() => {
          setTimeout(() => this.checkUpdates(), 30 * 1000); // Задержка для избежания проверки до релиза
        }, 5 * 60 * 1000);
      }, timeout);
    }
  }

  private async checkUpdates() {
    let updates = await this.getAllUpdates();

    if (updates.length === 0) {
      console.log("No Updates");
      return;
    }

    const titles: Map<string, APITypes.VolumeUpdates.Content> = new Map();

    for (const u of updates) titles.set(`${u.projectId}_${u.volumeId}`, u);

    updates = [...titles.values()].sort(
      (t1, t2) => new Date(t1.showTime).getTime() - new Date(t2.showTime).getTime()
    );

    for (const u of updates) {
      this.emit("update", u);
    }
  }

  private async getAllUpdates(number = 1): Promise<APITypes.VolumeUpdates.Content[]> {
    const updates: APITypes.VolumeUpdates.Content[] = [];
    let relevance = false;
    do {
      const update = await API.getUpdate(number++);

      if (!update) throw new Error("INDEX_UPDATES_ERROR: Empty Update");

      relevance = await this.DB.checkRelevance(update);

      if (relevance) updates.push(update);
    } while (relevance);

    return updates;
  }
}
