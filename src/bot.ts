import * as Discord from "discord.js";

import Manager, { AppOptions } from "./add-ons/manager";

const manager = new Manager(
  "all",
  ["activity"] /*названия модулей, которые не планируются включать*/
);

const Bot = new Discord.Client();

Bot.on("ready", () => {
  console.log(`Test Logged in as ${Bot.user?.tag}!`);
  console.log("NODE_ENV: ", process.env.NODE_ENV);
});

Bot.on("message", async (message: Discord.Message) => {
  if (message.author.id !== process.env.AUTHOR_ID) return;

  if (!message.content.startsWith("!")) return;

  const args: string[] = message.content
    .split(" ")
    .filter((arg) => arg && arg !== " ".repeat(arg.length));

  if (args.length < 2) {
    message.reply("No args");
    return;
  }

  const command = {
    worker: args.shift(),
    action: args.shift(),
    name: args.length && !args[0].startsWith("--") ? args.shift() : "",
    args,
  };

  switch (command.worker) {
    case "!app":
      break;
    case "!test":
      command.args.push("--debug");
      break;
    case "!local":
      if (process.env.NODE_ENV !== "local") return;
      break;
    default:
      return;
  }

  const parsedArgs = {};

  command.args.forEach((a) => {
    if (a.match(/(?<=--)[\w-]+/)) {
      const name = a.match(/(?<=--)[\w-]+/)?.shift() as string;
      const value = a.match(/(?<==).+/) ? a.match(/(?<==).+/)?.shift() : true;

      if (!Object.getOwnPropertyDescriptor(parsedArgs, name))
        Object.assign(parsedArgs, {
          [name]: value,
        });
    }
  });

  console.log(args);

  switch (command.action) {
    case "start":
      if (!command.name) {
        message.reply("No args");
        return;
      }

      const app: AppOptions = {
        name: command.name,
        args: command.args,
      };

      const started = await manager.startApp(app);
      if (started) message.reply(`${app.name.toUpperCase()}: start`);
      break;

    case "stop":
      const id = parseInt(Object.getOwnPropertyDescriptor(parsedArgs, "id")?.value);
      const stopedApp = await manager.stopApp(id);

      if (stopedApp) message.reply(`${stopedApp.type.toUpperCase()}: stop`);
      else
        console.log(
          `${command.name?.toUpperCase()}: Unknown name of app or this app is not running.`
        );
      break;

    case "show":
      message.reply(manager.showApps());
      break;
  }
});

Bot.login(process.env.BOT_BORIS_TOKEN);

const RuRaColor = new Discord.Client();

RuRaColor.on("message", async (message: Discord.Message) => {
  if (message.channel.id !== "800044270370684958") return;

  const emojis = [message.guild?.emojis.cache.get("248177959192494080"), "❤", "🔥"];

  if (message.content.includes("arknarok"))
    emojis.splice(1, 0, message.guild?.emojis.cache.get("324253416870117386"));

  const emojisPromises = emojis
    .filter((e) => e !== undefined)
    .map((e) => message.react(e as string | Discord.GuildEmoji));
  Promise.all(emojisPromises)
    .then((es) => {
      console.log(es.map((e) => e.emoji.name).join("  "));
    })
    .catch(console.error);
});

RuRaColor.on("message", (message) => {
  console.log(
    `${(message.channel as Discord.TextChannel).name}: ${message.author.username} ${
      message.channel.id
    } ${message.createdAt}`
  );
});

RuRaColor.login(process.env.BOT_RURACOLOR_TOKEN);
