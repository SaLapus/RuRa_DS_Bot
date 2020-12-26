const fs = require("fs");
const { spawn } = require("child_process");

module.exports = function (exeption = [""]) {
  fs.readdir("./add-ons", { withFileTypes: true }, (err, f) => {
    let files = f
      .filter((e) => e.isDirectory())
      .filter((e) => !exeption.some((name) => name === e.name));
    console.log(files);
    files.forEach((file) => {
      const App = spawn("node", [`./add-ons/${file.name}/index`]);

      App.stdout.on("data", (data) => {
        console.log(`stdout${file.name.toUpperCase()}: ${data}`);
      });

      App.stderr.on("data", (data) => {
        console.error(`stderr${file.name.toUpperCase()}: ${data}`);
      });

      App.on("close", (code) => {
        console.log(
          `child process ${file.name.toUpperCase()} exited with code ${code}`
        );
      });
    });
  });
};
