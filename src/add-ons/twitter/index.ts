import Discord from "discord.js";

import Message from "./functions";
// import * as Types from "./types";

const Bot = new Discord.Client();

Bot.on("ready", () => {
  console.log(`Logged in as ${Bot.user?.tag}!`);
});

Bot.on("message", async (m: Discord.Message) => {
  if (m.content.includes("<@&711924634580418672>")) return;

  if (m.content.startsWith("--temp")) return;

  const message = new Message(m);

  if (m.content.includes("<:OrehGisha:709492185728417865>")) {
    m.react(m.guild?.emojis?.cache?.get("709492185728417865") as Discord.EmojiResolvable).catch(
      console.error
    );
    return;
  }

  //  http://twitter.com/kiyoe_sans/status/1253813674776674311
  //  http://twitter.com/kiyoe_sans/status/1349878870233800704
  //
  //  https://t.co/ujQOpkkAEN
  //  https://imgur.com/a/67e8ZIi
  const regExpTwit = /twitter.com/;

  if (regExpTwit.test(m.content) == true) {
    console.log("Twitter url");
    await reactChain(new Message(m));
  }
});

async function reactChain(message: Message) {
  console.log(message.content);
  await message.parseEmbeds();
  message.reactURLs();
  await message.reSendTwitterURLs(reactChain);
  return message.log();
}

Bot.login(process.env.BOT_BORIS_TOKEN);
