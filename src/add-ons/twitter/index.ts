import Discord from "discord.js";

import { checkUrls, reactURL } from "./functions";
import * as Types from "./types";

const Bot = new Discord.Client();

Bot.on("ready", () => {
  console.log(`Logged in as ${Bot.user?.tag}!`);
});

Bot.on("message", (message: Discord.Message) => {
  if (message.content.includes("<@&711924634580418672>")) return;

  if (message.content.includes("<:OrehGisha:709492185728417865>")) {
    message
      .react(
        message.guild?.emojis?.cache?.get(
          "709492185728417865"
        ) as Discord.EmojiResolvable
      )
      .catch(console.error);
    return;
  }

  let logs: Types.Logs = {
    author: message.author.tag,
    channel: (message.channel as Discord.TextChannel).name,
    timestamp: message.createdTimestamp,
    content: message.content.split("\n").join(" \\ "),
  };

  //  http://twitter.com/kiyoe_sans/status/1253813674776674311
  const regExpTwit = /twitter.com/;

  if (regExpTwit.test(message.content) == true) {
    console.log("Twitter url");
    setTimeout(() => {
      message
        .fetch()
        .then((msg: Discord.Message) => {
          logs.embeds = {
            description: msg.embeds[0].description,
          };

          checkUrls({ message, logs });
        })
        .catch(console.error);
    }, 5 * 1000);
  } else {
    console.log(logs);
  }
});

Bot.login(process.env.BOT_RURACOLOR_TOKEN);
