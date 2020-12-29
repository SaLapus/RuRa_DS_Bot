import Discord from "discord.js";

export interface DebugObject {
  message: Discord.Message;
  logs: Logs;
}

export interface Logs {
  author?: string;
  channel?: string;
  content?: string;
  embeds?: {
    description: string | undefined;
  };
  hash?: RegExpMatchArray | undefined;
  location?: string[];
  timestamp?: number;
}
