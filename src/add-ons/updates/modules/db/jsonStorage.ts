import fs from "fs";
import path from "path";

import { IJSONStorage } from "../../types/db/IJSONStorage";

const STORAGE_PATH = path.join(__dirname, "./storage.json");
let STORAGE: JSONStorage | undefined;

export default function getDB(): JSONStorage {
  if (!STORAGE) STORAGE = new JSONStorage();

  return STORAGE;
}

// Асинхронная работа с файлами, кроме конструктора
class JSONStorage implements IJSONStorage {
  private time: Date = new Date();

  constructor() {
    let storageStr = "";
    try {
      storageStr = fs.readFileSync(STORAGE_PATH, { encoding: "utf-8" });

      const { time } = JSON.parse(storageStr);

      this.time = new Date(parseInt(time, 10));
    } catch (e) {
      this.time = new Date();

      console.log(e);
      console.log(`ERROR CREATING DATE FROM FILE. NEW COUNT AT ${this.getTime()?.toUTCString()}`);
    }
  }

  setTime(time: Date) {
    this.time = time;

    try {
      const data = JSON.stringify({ time: this.time.getTime() });
      fs.writeFileSync(STORAGE_PATH, data);
    } catch (e) {
      console.log(e);
    }
  }

  getTime(): Date {
    return this.time;
  }
}
