interface ItemInfo {
    project: string;
    updated: Updated[];

    requestInfo: Request_Info;
}

interface Updated {
    time: Date;
    volume: string;
    VolumeId: number;
    chapter: string | null;
    chapterId: number | null;
}

interface Request_Info {
    hostname: string;
    url: string;
    project: string;
    volume: string;
}

interface RequestData {
    project: {
        url: string;
    };
    volume: Volume;
}

interface Volume {
    title: string;
    url: string;
    annotation: { text: string } | null;
    staff: StaffMember[];
    chapters: Chapter[];
    covers: Cover[];
}

interface StaffMember {
    nickname: string;
    activityName: string;
}

interface ParentChapter extends Chapter {
    chapters: Chapter[] | undefined;
}

interface Chapter {
    title: string;
    id: number;
    parentChapterId: number | null;
    publishDate: string;
}

interface Cover {
    url: string;
    thumbnail: string;
}

interface ProjInfo {
    project: string;
    title: string;
    url: string;
    annotation: string;
    staff: string;
    chapters: Chapter[];
    thumbnail: string;
}
