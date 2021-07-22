import { Annotation } from "./Annotation";

export interface Project {
  id: number;
  url: string;
  title: string;
  shortDescription: string;
  annotation: Annotation;
}
