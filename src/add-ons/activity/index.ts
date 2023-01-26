import Discord, { GatewayIntentBits } from "discord.js";

const Bot = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,

    GatewayIntentBits.MessageContent,
  ],
});

Bot.on("ready", () => {
  console.log(`Logged in as ${Bot.user?.tag}!`);
  setRandActivity();
});

Bot.login(process.env.BOT_RURACOLOR_TOKEN);

function setRandActivity() {
  const Activities = (name: string | undefined): Discord.ActivityOptions => {
    if (!name) name = "Лапус";

    console.log("member: ", name, "name: ", name);

    const acts: Discord.ActivityOptions[] = [
      { name: `как ${name} пьет пиво.`, type: Discord.ActivityType.Watching },
      { name: `спам орехусами с ${name}.`, type: Discord.ActivityType.Playing },
      { name: `покрас колора c  ${name}.`, type: Discord.ActivityType.Streaming },
      { name: `слак с ${name}.`, type: Discord.ActivityType.Playing },
      { name: `жалобы от ${name}.`, type: Discord.ActivityType.Listening },
      { name: ` ${name}. Страшно.`, type: Discord.ActivityType.Listening },
    ];

    return acts[getRandomInt(acts.length)];
  };

  const presence = Bot?.user?.setActivity(Activities(getRandomTag()));
  console.log(`Activity set to ${presence?.activities[0].name}`);

  setInterval(() => {
    const presence = Bot?.user?.setActivity(Activities(getRandomTag()));
    console.log(`Activity set to ${presence?.activities[0].name}`);
  }, 10 * 60 * 1000);
}

function getRandomTag() {
  let name = "";
  try {
    const guild = Bot.guilds.cache.get("247110077163634688");

    console.log("GUILD NAME: ", guild?.name);

    const channel = guild?.channels.cache.get("703340270724579338");

    const membersToMention = (
      channel?.members as Discord.Collection<string, Discord.GuildMember> | undefined
    )?.clone();
    membersToMention?.delete("711920772834263122");

    if (membersToMention) console.log([...membersToMention.values()].map((e) => e.user));

    const tag = membersToMention?.random()?.user?.tag;

    if (tag) name = fixTagtoName(tag);
    else throw new Error("NO TAG TO SET ACTIVITY <" + tag + ">");
  } catch (e) {
    if (e instanceof Error) console.log(e.message);
    else console.log(e);
  }

  return name;
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

function fixTagtoName(tag: string): string {
  const fixedTag = tag.match(/.*(?=#)/g);

  if (!fixedTag) return tag;
  else return fixedTag[0];
}
