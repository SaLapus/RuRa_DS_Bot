import * as Discord from "discord.js";
import { Events, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";

import manager, { AppAction, AppOptions } from "./add-ons/manager";
import startEmojiDialog from "./dialog";

dotenv.config({ path: "./config/.env" });

// "all",
// ["twitter"] /*названия модулей, которые не планируются включать*/

const Bot = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,

    GatewayIntentBits.MessageContent,
  ],
});

Bot.on(Events.ClientReady, (client) => {
  console.log(`Test Logged in as ${Bot.user?.tag}!`);
  console.log("NODE_ENV: ", process.env.NODE_ENV);

  manager.startApp({
    name: "updates",
    args: {
      type: "one" ,
    },
  });

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

Bot.on(Events.MessageCreate, async (message: Discord.Message) => {
  if (!message) return;

  if (message.author.id !== process.env.AUTHOR_ID) return;

  if (!message.content.startsWith("!start")) return;

  const a = await startEmojiDialog(message);

  console.log(a);
});

Bot.login(process.env.BOT_BORIS_TOKEN);

// const RuRaColor = new Discord.Client({intents: GatewayIntentBits.Guilds});

// RuRaColor.on("message", async (message: Discord.Message) => {
//   if (message.channel.id !== "800044270370684958") return;

  // const emojis = [message.guild?.emojis.cache.get("248177959192494080"), "❤", "🔥"];

//   if (message.content.includes("arknarok"))
//     emojis.splice(1, 0, message.guild?.emojis.cache.get("324253416870117386"));

//   const emojisPromises = emojis
//     .filter((e) => e !== undefined)
//     .map((e) => message.react(e as string | Discord.GuildEmoji));
//   Promise.all(emojisPromises)
//     .then((es) => {
//       console.log(es.map((e) => e.emoji.name).join("  "));
//     })
//     .catch(console.error);
// });

// RuRaColor.on("message", (message) => {
//   // color: Bad_Boy 247121681133469696 Sun Jun 27 2021 17:34:55 GMT+0000 (Coordinated Universal Time)
//   console.log(
//     `${(message.channel as Discord.TextChannel).name.toUpperCase()} -> ${message.author.username} ${
//       message.createdAt.getUTCHours() + 3
//     }:${message.createdAt.getUTCMinutes()}\t${message.channel.id}${
//       message.channel.id === "247121681133469696"
//         ? `
//       ${message.content}
//       --------------------------`
//         : ""
//     }`
//   );
// });

// RuRaColor.login(process.env.BOT_RURACOLOR_TOKEN);
