import * as Discord from "discord.js";

import Manager, { AppOptions } from "./add-ons/manager";

const manager = new Manager(
  "all",
  ["activity", "rss_hook", "updates"] /*названия модулей, которые не планируются включать*/
);

/*
Правильная натсройка времени
*/

const Bot = new Discord.Client();

Bot.on("ready", () => {
  console.log(`Test Logged in as ${Bot.user?.tag}!`);
});

Bot.on("message", (message: Discord.Message) => {
  if (message.author.id !== process.env.AUTHOR_ID) return;

  if (message.content.startsWith("!app")) {
    let args = message.content.split(" ");

    console.log(args);
    args.shift();

    if (args.length < 1) {
      message.reply("No args");
      return;
    }

    switch (args.shift()) {
      case "start":
        let app: AppOptions = {
          name: args.shift() as string,
          args: args.length ? args : [""],
        };

        manager.startApp(app.name, app.args).then((setted) => {
          if (setted) message.reply(`${app.name.toUpperCase()}: start`);
        });
        break;

      case "stop":
        const name = args.shift() as string;
        if (manager.stopApp(name)) message.reply(`${name.toUpperCase()}: stop`);
        else console.log(`${name.toUpperCase()}: Unknown name of app or this app is not running.`);
        break;
    }
  }
});

Bot.login(process.env.BOT_BORIS_TOKEN);
