import type EventEmitter from "events";

import { IDataBase } from "../db";
import { VolumeUpdates } from "../api";

export declare interface Client extends EventEmitter {
  DB: IDataBase;
  on(eventName: "update", callback: (update: VolumeUpdates.Content) => void): this;
}
