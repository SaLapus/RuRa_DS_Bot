import { Annotation } from "./Annotation";
import { Chapter } from "./Chapter";
import { Image } from "./Image";
import { Worker } from "./Worker";

export interface Volume {
  id: number;
  url: string;
  fullUrl?: string;
  type?: string;
  title?: string;
  shortName?: string;
  status?: string;
  covers?: Image[];
  annotation?: Annotation;
  staff?: Worker[];
  chapters?: Chapter[];
}
