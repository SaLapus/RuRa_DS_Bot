import type { Pool } from "pg";

export declare function getSavedTime(pool: Pool): Promise<DBTime>;

export type DBTime = number | null;

export interface DataBaseInfoObject {
  pool: Pool | undefined;
  setPool: (pool: Pool) => Pool;
  getPool: () => Pool;

  time: DBTime;
  setTime: (time: DBTime) => DBTime;
  getTime: () => DBTime;
}

export interface TimeOptions {
  timeRange?: Date;
  defaultTime?: number;
}

export type APIResponse = { updates: Updates } | { project: Project };
export interface Updates {
  content: UpdatesContent[];
}

export interface UpdatesContent {
  type: string;
  showTime: string;
  description?: string;
  url: string;
  title: string;
  updated: string;
  shortUpdated: string;
  sectionId?: number;
  projectId: number;
  volumeId?: number;
  chapterId?: number;
  volumeUrl: string;
  volume: Volume;
  main: boolean;
}

export interface Project {
  shortDescription: string;
}

interface Volume {
  id: number;
  url: string;
  fullUrl?: string;
  type?: string;
  title?: string;
  shortName?: string;
  status?: string;
  covers: Cover[];
  annotation: Annotation;
  staff: Staff[];
}

interface Cover {
  url?: string;
}

interface Annotation {
  text?: string;
}

interface Staff {
  nickname: string;
  activityName?: string;
}
