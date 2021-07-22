import type { Pool } from "pg";

import { DBTime } from "./DBTime";

import { VolumeUpdates } from "../api";

export interface IDataBase {
  offline: boolean;

  pool?: Pool;
  time?: Date;

  saveTime(newTime: number): Promise<void>;
  getSavedTime(): Promise<DBTime>;
  checkRelevance(update: VolumeUpdates.Content): Promise<boolean>;
  updateTime(dates: string[]): void;
}
