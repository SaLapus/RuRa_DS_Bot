import * as fs from "fs";
import * as child_process from "child_process";

export interface AppOptions {
  name: string;
  args: string[];
}

class Manager {
  Apps: Map<string, child_process.ChildProcess> = new Map();

  constructor(app: "all" | "nothing", exeption: string[] = [""]) {
    if (app === "nothing") {
      console.log("No AddOns was on");
      return;
    }

    fs.readdir("./add-ons", { withFileTypes: true }, (err, f) => {
      if (err) {
        console.error("SL: Read Dir Fail");
        throw err;
      }
      let files = f
        .filter((e) => e.isDirectory())
        .filter((e) => !exeption.some((name) => name === e.name));

      console.log(files);

      files.forEach((file) => {
        this.startApp(file.name);
      });
    });
  }

  startApp(name: string, args: string[] = [""]) {
    const App = child_process.fork(`./index`, [...args], {
      cwd: `./add-ons/${name}`,
    });

    App.stdout?.on("data", (data) => {
      console.log(`OUT in ${name.toUpperCase()}: ${data}`);
    });

    App.stderr?.on("data", (data) => {
      console.error(`ERROR in ${name.toUpperCase()}: ${data}`);
    });

    App.on("close", (code) => {
      console.log(`child process ${name.toUpperCase()} exited with code ${code}`);
    });

    this.Apps.set(name, App);
  }

  stopApp(name: string) {
    if (this.Apps.has(name)) {
      this.Apps.get(name)?.kill();
      this.Apps.delete(name);
      return true;
    }
    return false;
  }
}

export default Manager;
