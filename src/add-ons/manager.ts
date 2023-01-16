import * as fs from "fs/promises";
import * as child_process from "child_process";
import path from "path";

import { Action as UpdatesAction } from "./updates/types";

export interface AppOptions {
  name: string;
  id?: number;
  args?: AppAction;
}

interface Application {
  id: number;
  type: string;
  app: child_process.ChildProcess;
}

export interface AppAction {
  type: UpdatesAction | "stop";
}

class Manager {
  Apps: Map<number, Application> = new Map();
  private running = 0;

  constructor() {
    // if (app === "nothing") {
    //   console.log("No AddOns was on");
    //   return;
    // }

    // fs.readdir("./add-ons", { withFileTypes: true })
    //   .then((f) => {
    //     const files = f
    //       .filter((e) => e.isDirectory())
    //       .filter((e) => !exeption.some((name) => name === e.name));

    //     console.log(files);

    //     files.forEach((file) => {
    //       this.startApp({ name: file.name });
    //     });
    //   })
    //   .catch((e) => {
    //     console.error(e);
    //   });
  }

  async startApp({ name: type, args }: AppOptions): Promise<boolean> {
    try {
      const files = await fs.readdir(path.resolve(__dirname), { withFileTypes: true });
      if (!files.some((e) => e.name === type)) {
        console.log("No such file");
        return false;
      }

      const childConfigPath = path.resolve(
        process.cwd(),
        "./config/.env-" + process.env.NODE_ENV?.toLowerCase()
      );

      const App = child_process.fork(`./index`, {
        cwd: path.resolve(__dirname, type),
        env: Object.assign(Object.create(process.env), { CHILD_ENV_PATH: childConfigPath }),
      });
      const id = this.running++;

      App.stdout?.on("data", (data) => {
        console.log(`OUT in ${type.toUpperCase()}: ${data}`);
      });

      App.stderr?.on("data", (data) => {
        console.error(`ERROR in ${type.toUpperCase()}: ${data}`);
      });

      App.on("close", (code) => {
        console.log(`child process ${type.toUpperCase()}_${id} exited with code ${code}.`);

        this.Apps.delete(id);
      });

      if (args) App.send(args);

      this.Apps.set(id, { id, type, app: App });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async stopApp(id: number | undefined): Promise<{ type: string; id: number } | undefined> {
    if (typeof id !== "number") return Promise.resolve(undefined);

    if (this.Apps.has(id)) {
      try {
        if (!this.Apps.get(id)?.app.kill()) throw new Error("SL: Error app killing");
      } catch (e) {
        console.error(e);
        return Promise.resolve(undefined);
      }

      const info = this.Apps.get(id) as Application;

      this.running--;
      this.Apps.delete(id);

      return Promise.resolve({ type: info.type, id: info.id });
    }
    return Promise.resolve(undefined);
  }

  getAppByID(id: number): Application | undefined {
    return this.Apps.get(id);
  }

  showApps(): string {
    let text = "";
    for (const [id, value] of this.Apps.entries()) {
      text += `[${id}]: ${value.type.toUpperCase()}\n`;
    }

    console.log(text.trim());

    return text.trim();
  }
}

export default Manager;
