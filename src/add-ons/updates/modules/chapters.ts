import { APITypes } from "../types";

export default class Chapters {
  data: (APITypes.ParentChapter | APITypes.Chapter)[];

  constructor(chapters: APITypes.Chapter[] | undefined) {
    this.data = sortChapters(chapters);
  }

  filter(oldness: string) {
    return this.data.filter(
      (ch) => new Date(ch.publishDate) >= new Date(oldness)
    ) as APITypes.ParentChapter[];
  }
}

function sortChapters(chapters: APITypes.Chapter[] | undefined) {
  const temp: Map<number, APITypes.ParentChapter> = new Map();

  if (!chapters) return [];

  let chapter: APITypes.Chapter | undefined;
  while (chapters.length !== 0) {
    chapter = chapters.shift();
    if (chapter) {
      if (chapter.parentChapterId) {
        if (temp.has(chapter.parentChapterId))
          temp.get(chapter.parentChapterId)?.childs.push(chapter);
      } else temp.set(chapter.id, Object.assign({}, { childs: [] }, chapter));
    }
  }

  return [...temp.values()];
}
