import { Pool } from "pg";
import "./types";
import {DBTypes as Types} from "./types";

const _: Types.DataBaseInfoObject = {
  pool: undefined,
  setPool: function (pool: Pool) {
    return (this.pool = pool);
  },
  getPool: function () {
    if (this.pool) return this.pool;
    throw new Error("SL: No Pool");
  },

  time: 0,
  setTime: function (time) {
    return (this.time = time);
  },
  getTime: function () {
    return this.time;
  },
};

export function init(type: "default" | "no-db", options?: Types.TimeOptions) {
  switch (type) {
    case "default":
      _.setPool(
        new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false,
          },
        })
      );

      break;
    case "no-db":
      if (options?.defaultTime) _.setTime(options.defaultTime);
      else if (options?.timeRange) _.setTime(Date.now() - options.timeRange.getTime());
      else throw new Error("SL: No default time for no-db init");

      break;
    default:
      break;
  }
}

export async function getSavedTime(): Promise<Types.DBTime> {
  const time = _.getTime();
  if (time) {
    return time;
  } else {
    try {
      const pool = _.getPool();
      const client = await pool.connect();
      const result = await client.query("SELECT * FROM time");
      client.release();
      return result ? _.setTime(parseInt(result.rows[0].date, 10)) : null;
    } catch (err) {
      console.error(err);
    }
  }
  throw new Error("SL: No Saved Time to Return");
}

export async function saveTime(newTime: number) {
  try {
    const pool = _.getPool();
    const time = _.getTime();

    const client = await pool.connect();
    console.log(`UPDATE time SET date = ${newTime} WHERE date = ${time};`);
    await client.query("UPDATE time SET date = $1 WHERE date = $2;", [newTime, time]);

    client.release();
    _.setTime(newTime);
  } catch (err) {
    console.error(err);
  }
}
