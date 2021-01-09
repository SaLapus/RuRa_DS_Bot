import * as Discord from "discord.js";

import Manager, { AppOptions } from "./add-ons/manager";
import "./env";

Manager(
  "default",
  "all",
  [
    "activity",
    "rss_hook",
    "updates",
  ] /*названия модулей, которые не планируются включать*/
);

const Bot = new Discord.Client();

Bot.on("ready", () => {
  console.log(`Test Logged in as ${Bot.user?.tag}!`);
});

Bot.on("message", (message: Discord.Message) => {
  if (message.author.id !== process.env.AUTHOR_ID) return;

  if (message.content.startsWith("!app-start")) {
    let args = message.content.split(" ");

    console.log(args);
    args.shift();

    if (args.length < 1) {
      message.reply("No args");
      return;
    }

    let app: AppOptions = {
      name: args.shift() as string,
      args: args.length ? args : [""],
    };

    Manager("one", app);
  }
});

Bot.login(process.env.BOT_BORIS_TOKEN);
