import type EventEmitter from "events";

import { IJSONStorage } from "../db";
import { VolumeUpdates } from "../api";

export declare interface Client extends EventEmitter {
  DB: IJSONStorage;
  on(eventName: "update", callback: (update: VolumeUpdates.Content |  VolumeUpdates.Content[]) => void): this;
}
