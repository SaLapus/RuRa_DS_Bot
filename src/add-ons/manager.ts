import * as fs from "fs";
import { spawn } from "child_process";

export interface AppOptions {
  name: string;
  args: string[];
}
type StartOptions = AppOptions | "all" | "nothing";

function Start(mode: "default", app: "all" | "nothing", exeption: string[]): void;
function Start(mode: "one", app: AppOptions, exeption?: string[]): void;
function Start(mode: "default" | "one", app: StartOptions, exeption: string[] = [""]) {
  switch (mode) {
    case "default":
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
          startAddOnn(file);
        });
      });
      break;
    case "one":
      fs.readdir("./add-ons", { withFileTypes: true }, (err, f) => {
        if (err) {
          console.error("SL: Read Dir Fail");
          throw err;
        }
        let file = f
          .filter((e) => e.isDirectory())
          .filter((e) => e.name === (app as AppOptions).name);
        console.log(file);

        if (file.length > 1) throw new Error("SL: More file then expected");
        else if (file.length === 0) throw new Error("SL: No such file");

        startAddOnn(file.pop() as fs.Dirent, (app as AppOptions).args);
      });
      break;
  }
}

function startAddOnn(file: fs.Dirent, args: string[] = [""]) {
  const App = spawn("node", [`./index`, ...args], {
    cwd: `./add-ons/${file.name}`,
  });

  App.stdout.on("data", (data) => {
    console.log(`stdout${file.name.toUpperCase()}: ${data}`);
  });

  App.stderr.on("data", (data) => {
    console.error(`stderr${file.name.toUpperCase()}: ${data}`);
  });

  App.on("close", (code) => {
    console.log(`child process ${file.name.toUpperCase()} exited with code ${code}`);
  });
}

export default Start;
