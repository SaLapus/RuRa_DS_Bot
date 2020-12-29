import https from "https";

import * as Types from "./types";

export function checkUrls({ message, logs }: Types.DebugObject) {
  let hash = message.embeds[0].description?.match(/t.co\/\w{10}/g);

  if (hash == undefined) {
    logs.hash = hash as undefined;
    logs.location = [];

    console.log(logs);
    return;
  }

  logs.hash = hash;
  logs.location = [];

  let promQueue = [];
  for (let h of hash) {
    const parsedHash = h.match(/\w{10}/g);

    console.log("Start reactUrl");

    promQueue.push(
      reactURL(parsedHash as RegExpMatchArray, logs).then((res) => {
        if (res == true)
          message.channel.send(
            "Новые ирасты подвезли! <@&711924634580418672>\n" +
              `<${message.content}>`
          );
      })
    );
  }

  Promise.all(promQueue).then(() => console.log(logs));
}

export function reactURL(hashUrl: RegExpMatchArray, log: Types.Logs) {
  return new Promise((resolve) => {
    var options = {
      hostname: "t.co",
      port: 443,
      path: `/${hashUrl}`,
      method: "GET",
    };

    var req = https.request(options, function (res) {
      if (res.headers["location"] != undefined) {
        log.location?.push(res.headers["location"]);

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
