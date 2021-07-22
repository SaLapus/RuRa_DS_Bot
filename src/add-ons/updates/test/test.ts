import Manager, { AppOptions } from "../../manager";

const manager = new Manager("nothing");
console.log("START TEST");

// const app = manager.startApp({ name: "updates", args: ["--no-db=7days", "--debug"] });
const app = manager.startApp({ name: "updates", args: ["--no-db=3days"] });

app.then((started) => {
  manager.showApps();
});

setInterval(() => {
  console.log("10 SECONDS");
}, 10 * 1000);
