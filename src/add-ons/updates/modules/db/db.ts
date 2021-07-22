import { Pool } from "pg";

import * as DBTypes from "../../types/db";
import * as APITypes from "../../types/api";

export default class DataBase implements DBTypes.IDataBase {
  offline = false;

  private _pool?: Pool;
  public get pool(): Pool {
    if (this._pool) return this._pool;
    throw new Error("SL: No Pool");
  }
  public set pool(pool: Pool) {
    this._pool = pool;
  }

  private _time?: Date;
  public get time(): Date | undefined {
    if (!this._time) return undefined;
    if (this._time.getTime() > 0) return this._time;
    throw new Error(`SL DB: NULLABLE TIME\ntime: ${this._time}`);
  }
  public set time(t: Date | undefined) {
    if (t) this._time = t;
  }

  /** DataBase contructor
   *
   * @param options - Options to initialize offline database. Send undefined if database is online
   */
  constructor(options?: DBTypes.TimeOptions) {
    if (!options) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      });
    } else {
      this.offline = true;
      if (typeof options === "number") this.time = new Date(options);
      else if (options instanceof Date) this.time = options;
      else if (typeof options === "string") this.time = new Date(parseInt(options, 10));
      else throw new Error(`SL ERROR: OPTIONS are not valid\ntype of OPTIONS: ${typeof options}`);
    }
  }

  async saveTime(newTime: number): Promise<void> {
    if (this.offline) {
      this.time = new Date(newTime);
      return;
    }

    try {
      const pool = this.pool;
      const time = this.time;

      const client = await pool.connect();
      console.log(`UPDATE time SET date = ${newTime} WHERE date = ${time};`);
      await client.query("UPDATE time SET date = $1 WHERE date = $2;", [newTime, time]);

      client.release();
      this.time = new Date(newTime);
    } catch (err) {
      console.error(err);
    }
  }

  async getSavedTime(): Promise<DBTypes.DBTime> {
    const time = this.time;
    if (time) {
      return time;
    } else {
      try {
        const pool = this.pool;
        const client = await pool.connect();
        const result = await client.query("SELECT * FROM time");
        client.release();

        if (result) return (this.time = new Date(parseInt(result.rows[0].date, 10)));
        throw new Error("SL ERROR: NO SAVED TIME");
      } catch (err) {
        console.error(err);
      }
    }
    return null;
  }

  async checkRelevance(update: APITypes.VolumeUpdates.Content): Promise<boolean> {
    const date = await this.getSavedTime();

    if (date && update.showTime) {
      if (new Date(update.showTime) > new Date(date)) return Promise.resolve(true);
      else return Promise.resolve(false);
    }

    throw new Error("SL: Date Comparation Error");
  }

  updateTime(dates: string[]): void {
    const times = dates.map((e) => new Date(e).getTime());
    this.saveTime(
      times.reduce((acc, cur) => {
        if (acc > cur) return acc;
        return cur;
      })
    );
  }
}
