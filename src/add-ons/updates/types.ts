import type { Pool } from "pg";

export declare function getSavedTime(pool: Pool): Promise<DBTypes.DBTime>;

export interface IndexOptions {
  noDB: boolean;
  debug: boolean;
  noLoop: boolean;
  DBTime: DBTypes.TimeOptions;
}

export namespace DBTypes {
  export type DBTime = number | null;

  export interface DataBaseInfoObject {
    type: string;
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
}

export namespace APITypes {
  export type APIResponse =
    | { volumeUpdates: VolumeUpdate.Data }
    | { project: Project }
    | { chapter: Chapter }
    | { volume: Volume };

  export namespace VolumeUpdate {
    export interface Data {
      content: Content[];
    }

    export interface Content {
      title: string;
      url: string;
      showTime: string;
      sectionId?: number;
      projectId: number;
      volumeId: number;
      // updates: Update[];
    }

    // export interface Update{
    //   type: string;
    //   title: string;
    //   updated: string;
    //   url: string;
    //   showTime: string;
    //   sectionId?: number;
    //   projectId: number;
    //   volumeId: number;
    //   chapterId?: number;
    // }
  }

  export interface Project {
    shortDescription: string;
  }

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

  export interface Image {
    url?: string;
  }

  export interface Annotation {
    text?: string;
  }

  export interface Worker {
    nickname: string;
    activityName?: string;
  }

  export interface Chapter {
    title?: string;
    id: number;
    parentChapterId?: number | null;
    volumeId: number;
    publishDate: string;
  }

  export interface ParentChapter extends Chapter {
    childs: Chapter[];
  }
}

export namespace ReSenderInfo {
  export interface Data {
    type: "rura-update";
    debug: boolean;
    extended: Update;
  }

  export interface Update {
    title: string;
    chapters: APITypes.ParentChapter[];
    annotation: string;
    staff: {
      [name: string]: string;
    };
    doneStatus: boolean;

    description: string;

    updateURL: string;
    coverURL: string;
  }
}
