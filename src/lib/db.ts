import Dexie, { type Table } from "dexie";
import type { CourseTypeId } from "./courseTypes";

export type AudioSource = "mic" | "tab" | "file";
export type SessionStatus = "recording" | "ready";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  language: string;
  model: string;
  segments: TranscriptSegment[];
  createdAt: number;
  elapsedSec?: number;
}

export interface SessionRecord {
  id: string;
  title: string;
  courseType: CourseTypeId;
  context: string;
  source: AudioSource;
  status: SessionStatus;
  createdAt: number;
  durationMs: number;
  mimeType: string;
  userNotes: string;
  transcript?: Transcript;
  aiNotes?: string;
  transcriptionJobId?: string;
}

export interface ChunkRecord {
  id?: number;
  sessionId: string;
  seq: number;
  blob: Blob;
}

class CoursesDB extends Dexie {
  sessions!: Table<SessionRecord, string>;
  chunks!: Table<ChunkRecord, number>;

  constructor() {
    super("coursesrec");
    this.version(1).stores({
      sessions: "id, createdAt",
      chunks: "++id, sessionId, [sessionId+seq]",
    });
  }
}

export const db = new CoursesDB();
