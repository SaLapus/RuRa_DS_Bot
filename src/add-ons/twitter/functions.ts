import https from "https";

import Discord from "discord.js";

// import * as Types from "./types";

export default class TwitterURLMessage {
  message: Discord.Message;

  author: string | undefined;
  channel: string | undefined;
  content: string | undefined;
  timestamp?: number | undefined;

  descriptions: string[] = [];
  hashes: string[] = [];
  locations: string[] = [];

  /**
   *
   */
  constructor(message: Discord.Message) {
    this.message = message;
    this.author = message.author.tag;
    this.channel = (message.channel as Discord.TextChannel).name;
    this.timestamp = message.createdTimestamp;
    this.content = message.content.split("\n").join(" \\ ");
  }

  async parseEmbeds() {
    console.log("Parsing embeds");

    const message = (this.message = await this.message.fetch());

    if (message.embeds.length === 0) return;
    else {
      for (const embed of message.embeds) {
        if (embed.description) this.descriptions.push(embed.description);
      }

      for (const d of this.descriptions) {
        const hashes = d.match(/(?<=t\.co\/)\w{10}/g);
        if (hashes) this.hashes = this.hashes.concat(hashes);
      }

      for (const h of this.hashes) {
        const location = await checkURL(h);
        if (location) this.locations.push(location);
      }
    }
  }

  async reSendTwitterURLs(reactChain: (message: TwitterURLMessage) => Promise<Discord.Message>) {
    console.log("Resending twitter URLs");

    const twitterURLs = this.locations.filter((l) => l.includes("twitter.com"));
    const thisURL = this.message.content.match(
      /http[s]?:\/\/twitter\.com\/[\w_]+\/status\/\d{1,}/g
    );

    for (const url of twitterURLs) {
      if (thisURL && url.includes(thisURL[0])) {
        console.log("URLs are equal");
        continue;
      }
      console.log("Sending twitter URLs");
      const message = await this.message.channel.send(`--temp ${url}`);
      setTimeout(async () => {
        const m = new TwitterURLMessage(message);
        const mToDelete = await reactChain(m);

        console.log("Deleting twitter URL's message");

        await mToDelete.delete();
      }, 5 * 1000);
    }
  }

  reactURLs() {
    console.log("Reacting URLs");
    if (this.locations.some((l) => l.includes("imgur"))) {
      const url = this.content?.match(/http[s]?:\/\/twitter\.com\/[\w_]+\/status\/\d{1,}/g);
      this.message.channel.send(
        "Новые ирасты подвезли! <@&711924634580418672>\n" + `<${url?.shift()}>`
      );
    }
  }

  log() {
    console.log("Logging");
    const message = this.message;
    console.log(JSON.stringify(Object.assign(this, { message: {} })));
    return message;
  }
}

function checkURL(hashUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    var options = {
      hostname: "t.co",
      port: 443,
      path: `/${hashUrl}`,
      method: "GET",
    };

    var req = https.request(options, function (res) {
      if (res.headers["location"] != undefined) {
        console.log("Header was found");
        resolve(res.headers["location"]);
      } else resolve(undefined);

      res.on("error", function (error) {
        console.error(error);
      });
    });

    req.end();
  });
}
