import { Chapter } from "./Chapter";

export interface ParentChapter extends Chapter {
  childs: Chapter[];
}
