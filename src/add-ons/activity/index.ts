import Discord from "discord.js";

const Bot = new Discord.Client();

Bot.on("ready", () => {
  console.log(`Logged in fork as ${Bot.user?.tag}!`);
  setRandActivity();
});

Bot.login(process.env.BOT_RURACOLOR_TOKEN).then((log) => {
  console.log("LOGIN: ", log);
});

function setRandActivity() {
  const Activities = (name: string | undefined): Discord.ActivityOptions => {
    if (!name) name = "Лапус";

    console.log("member: ", name, "name: ", name);

    const acts: Discord.ActivityOptions[] = [
      { name: `как ${name} пьет пиво.`, type: "CUSTOM_STATUS" },
      { name: `спам орехусами с ${name}.`, type: "CUSTOM_STATUS" },
      { name: `покрас колора c  ${name}.`, type: "CUSTOM_STATUS" },
      { name: `слак с ${name}.`, type: "CUSTOM_STATUS" },
      { name: `жалобы от ${name}.`, type: "CUSTOM_STATUS" },
      { name: ` ${name}. Страшно.`, type: "CUSTOM_STATUS" },
    ];

    return acts[getRandomInt(acts.length)];
  };

  Bot?.user
    ?.setActivity(Activities(getRandomTag()))
    .then((presence) => console.log(`Activity set to ${presence.activities[0].name}`))
    .catch(console.error);

  setInterval(
    () =>
      Bot?.user
        ?.setActivity(Activities(getRandomTag()))
        .then((presence) => console.log(`Activity set to ${presence.activities[0].name}`))
        .catch(console.error),
    10 * 60 * 1000
  );
}

function getRandomTag() {
  let name = "";
  try {
    const guild = Bot.guilds.cache.get("247110077163634688");

    console.log("GUILD NAME: ", guild?.name);

    const channel = guild?.channels.cache.get("703340270724579338");
    const member = guild?.members.cache.get("711920772834263122");

    console.log(member?.permissions.toArray());

    const membersToMention = channel?.members.clone();
    membersToMention?.delete("711920772834263122");

    console.log(membersToMention?.array().map((e) => e.user));

    const tag = membersToMention?.random()?.user?.tag;

    if (tag) name = fixTagtoName(tag);
    else throw new Error("NO TAG TO SET ACTIVITY");
  } catch (e) {
    console.log(e);
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
