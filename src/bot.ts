import * as Discord from "discord.js";
import * as dotenv from "dotenv";

import Manager, { AppAction, AppOptions } from "./add-ons/manager";

dotenv.config({ path: "./config/.env" });

const manager = new Manager();
// "all",
// ["twitter"] /*названия модулей, которые не планируются включать*/

const Bot = new Discord.Client();

Bot.on("ready", () => {
  console.log(`Test Logged in as ${Bot.user?.tag}!`);
  console.log("NODE_ENV: ", process.env.NODE_ENV);

  manager.startApp({
    name: "updates",
    args: {
      type: "shedule",
    },
  });

  manager.startApp({
    name: "activity",
  });
});

// Bot.on("message", async (message: Discord.Message) => {
//   if (message.author.id !== process.env.AUTHOR_ID) return;

//   if (!message.content.startsWith("!")) return;

//   const args: string[] = message.content.split(" ").filter((arg) => arg);

//   if (args.length < 2) {
//     message.reply("No args");
//     return;
//   }

//   const command = {
//     worker: args.shift(),
//     action: args.shift(),
//     name: args.shift(),
//     arg: args.shift()
//   };

//   switch (command.worker) {
//     case "!app":
//       break;
//     case "!test":
//       process.env.NODE_ENV = "DEBUG";
//       break;
//     case "!local":
//       if (process.env.NODE_ENV !== "LOCAL") return;
//       break;
//     default:
//       return;
//   }

//   switch (command.action) {
//     case "start":
//       if (!command.name) {
//         message.reply("No args");
//         return;
//       }

//       const app: AppOptions = {
//         name: command.name,
//         args: command.arg as unknown as AppAction, // сделать нормально
//       };

//       const started = await manager.startApp(app);
//       if (started) message.reply(`${app.name.toUpperCase()}: start`);
//       break;

//     case "stop":
//       const id = parseInt(Object.getOwnPropertyDescriptor(parsedArgs, "id")?.value);
//       const stopedApp = await manager.stopApp(id);

//       if (stopedApp) message.reply(`${stopedApp.type.toUpperCase()}: stop`);
//       else {
//         message.reply(`Stop... But what should I stop?..`);
//         console.log(
//           `${command.name?.toUpperCase()}: Unknown name of app or this app is not running.`
//         );
//       }
//       break;

//     case "show":
//       message.reply(manager.showApps());
//       break;
//   }
// });

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
  // color: Bad_Boy 247121681133469696 Sun Jun 27 2021 17:34:55 GMT+0000 (Coordinated Universal Time)
  console.log(
    `${(message.channel as Discord.TextChannel).name.toUpperCase()} -> ${message.author.username} ${
      message.createdAt.getUTCHours() + 3
    }:${message.createdAt.getUTCMinutes()}\t${message.channel.id}${
      message.channel.id === "247121681133469696"
        ? `
      ${message.content}
      --------------------------`
        : ""
    }`
  );
});

RuRaColor.login(process.env.BOT_RURACOLOR_TOKEN);
