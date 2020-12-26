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
  const Activities = (
    memberName: string | undefined,
    n: number
  ): Discord.ActivityOptions => {
    const nameReg = memberName?.match(/.*(?=#)/g) as RegExpMatchArray;
    console.log("member: ", memberName, "name: ", nameReg);

    const name = nameReg[0];

    const acts: Discord.ActivityOptions[] = [
      { name: `как ${name} пьет пиво.`, type: "WATCHING" },
      { name: `спам орехусами с ${name}.`, type: "PLAYING" },
      { name: `покрас колора c  ${name}.`, type: "STREAMING" },
      { name: `слак с ${name}.`, type: "PLAYING" },
      { name: `жалобы от ${name}.`, type: "LISTENING" },
      { name: ` ${name}. Страшно.`, type: "LISTENING" },
    ];

    return acts[n];
  };

  const guild = Bot.guilds.cache.get("247110077163634688");
  console.log("GUILD NAME: ", guild?.name);
  const channel = guild?.channels.cache.get("703340270724579338");

  const member = guild?.members.cache.get("711920772834263122");

  console.log(member?.permissions.toArray());


  // const membersToMention = channel?.members.clone();
  // membersToMention?.delete("711920772834263122");

  // console.log(membersToMention?.array().map((e) => e.user));

  // Bot?.user
  //   ?.setActivity(
  //     Activities(membersToMention?.random()?.user?.tag, getRandomInt(6))
  //   )
  //   .then((presence) =>
  //     console.log(`Activity set to ${presence.activities[0].name}`)
  //   )
  //   .catch(console.error);

  // setInterval(
  //   () =>
  //     Bot?.user
  //       ?.setActivity(
  //         Activities(membersToMention?.random()?.user?.tag, getRandomInt(6))
  //       )
  //       .then((presence) =>
  //         console.log(`Activity set to ${presence.activities[0].name}`)
  //       )
  //       .catch(console.error),
  //   10 * 60 * 1000
  // );
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}
