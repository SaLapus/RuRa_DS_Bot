import * as Discord from "discord.js";
import Manager from "./add-ons/manager";

interface IDialog {
  description: string;
  options: string[];
}

let Dialogs: IDialog[] = [];

async function waitDialogs() {
  Dialogs = [
    {
      description: "Choose app",
      options: await Manager.availableApps,
    },
    {
      description: "Choose action",
      options: ["start", "stop", "restart"],
    },
    {
      description: "Choose mode",
      options: ["production", "debug"],
    },
  ];
}

const emojisList = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
let step = 0;

export default async function startEmojiDialog(msg: Discord.Message): Promise<string[]> {
  await waitDialogs();

  const dialog = new emojisDialog(msg);
  const choicesArray: string[] = [];

  dialog.choices = choicesArray;

  const collector = (await dialog.messageMenu).createReactionCollector({
    filter: (r) => emojisList.some((emo) => emo === r.emoji.name),
    idle: 30_000,
  });

  return new Promise((resolve) => {
    collector.on("collect", (reaction, user) => {
      if (user.username !== "SaLapus") return;

      if (!reaction.emoji.name) return;

      const index = emojisList.indexOf(reaction.emoji.name);

      choicesArray.push(Dialogs[step].options[index]);

      step++;

      if (step >= Dialogs.length) {
        resolve(choicesArray);
        dialog.endMenu();
      } else dialog.editMessage();
    });

    collector.on("end", (c, reason) => {
      console.log(reason);
    });
  });
}

class emojisDialog {
  messageMenu: Promise<Discord.Message>;
  choices?: string[];

  constructor(msg: Discord.Message) {
    this.messageMenu = msg.channel.send({ embeds: [this.createEmbed(Dialogs[step])] });
    this.messageMenu.then(async () => {
      await this.createReactMenu();
    });
  }
  createEmbed(dialog: IDialog) {
    const embed = new Discord.EmbedBuilder().addFields(
      { name: "\u200B", value: `${this.choices?.join(" ") || ""}\n\n${dialog.description}` },
      { name: "\u200B", value: dialog.options.map((o, i) => `${i + 1}: ${o}\n`).join("") }
    );

    return embed;
  }

  async createReactMenu() {
    for (let i = 0; i < Dialogs[step].options.length; i++) {
      await (await this.messageMenu).react(emojisList[i]);
    }
  }

  async editMessage() {
    const embed = this.createEmbed(Dialogs[step]);

    (await this.messageMenu).edit({ embeds: [embed] });
    await (await this.messageMenu).reactions.removeAll();

    await this.createReactMenu();
  }

  async endMenu() {
    (await this.messageMenu).edit({ content: this.choices?.join(" ") });
    (await this.messageMenu).suppressEmbeds();
    (await this.messageMenu).reactions.removeAll();
  }
}
