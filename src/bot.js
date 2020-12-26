const https = require("https");

const Discord = require("discord.js");

// import { init } from "./botInit";

const Bot = new Discord.Client();

const Manager = require("./add-ons/manager");

Manager(["activity"]/*названия модулей, которые не планируются включать*/);

Bot.on("ready", () => {
  console.log(`Logged in as ${Bot.user?.tag}!`);
});

Bot.on("message", (message) => {
  if (message.content.includes("<@&711924634580418672>")) return;

  if (message.content.includes("<:OrehGisha:709492185728417865>")) {
    message
      .react(message.guild.emojis.cache.get("709492185728417865"))
      .catch(console.error);
    return;
  }

  let MessageLog = {
    author: message.author.tag,
    channel: message.channel.name,
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
        .then((msg) => {
          msg.logs = MessageLog;

          msg.logs.embeds = {
            description: msg.embeds[0].description,
          };

          checkUrls(msg);
        })
        .catch(console.error);
    }, 5 * 1000);
  } else {
    console.log(MessageLog);
  }
});

Bot.login(process.env.BOT_RURACOLOR_TOKEN);

function checkUrls(message) {
  let hash = "";

  hash = message.embeds[0].description.match(/t.co\/\w{10}/g);

  message.logs.hash = hash;
  message.logs.location = [];

  if (hash == undefined) {
    console.log(message.logs);
    return;
  }

  let promQueue = [];
  for (let h of hash) {
    h = h.match(/\w{10}/g);

    console.log("Start reactUrl");

    promQueue.push(
      reactURL(h, message.logs).then((res) => {
        if (res == true)
          message.channel.send(
            "Новые ирасты подвезли! <@&711924634580418672>\n" +
              `<${message.content}>`
          );
      })
    );
  }

  Promise.all(promQueue).then(() => console.log(message.logs));
}

function reactURL(hashUrl, log) {
  return new Promise((resolve) => {
    var options = {
      hostname: "t.co",
      port: 443,
      path: `/${hashUrl}`,
      method: "GET",
    };

    var req = https.request(options, function (res) {
      log.location.push(res.headers["location"]);

      if (res.headers["location"] != undefined) {
        console.log("Header was found");
        resolve(res.headers["location"].includes("imgur"));
      }

      res.on("error", function (error) {
        console.error(error);
      });
    });

    req.end();
  });
}
