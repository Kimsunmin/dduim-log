export type TagColor = "mint" | "pink" | "yellow" | "lilac" | "sky" | "peach";
export type SnapPosition = "peek" | "mid" | "full";
export type EntityId = string;
export type ISODateString = string;
export type CourseVisibility = "private" | "unlisted" | "public";
export type CourseSource = "seed" | "user" | "imported";

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type CourseTag = {
  text: string;
  emoji: string;
  color: TagColor;
};

export type CourseMetrics = {
  distanceKm: number;
  durationMinutes: number;
  elevationMeters: number;
};

export type Course = {
  id: EntityId;
  title: string;
  area: string;
  distance: number;
  minutes: number;
  elevation: number;
  color: TagColor;
  author: string;
  saves: number;
  anchor: NormalizedPoint;
  path: NormalizedPoint[];
  startPoint?: LatLngLiteral;
  geoPath?: LatLngLiteral[];
  tags: CourseTag[];
  mine?: boolean;
  ownerId?: EntityId;
  visibility?: CourseVisibility;
  source?: CourseSource;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
  deletedAt?: ISODateString | null;
};

export type UserProfile = {
  id: EntityId;
  displayName: string;
  avatarColors: [string, string];
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type SavedCourse = {
  id: EntityId;
  userId: EntityId;
  courseId: EntityId;
  createdAt: ISODateString;
};

export type CourseRecord = {
  id: EntityId;
  userId: EntityId;
  courseId: EntityId;
  metrics: CourseMetrics;
  memo?: string;
  createdAt: ISODateString;
};

export type FeedComment = {
  id: EntityId;
  postId: EntityId;
  userId: EntityId;
  authorName: string;
  text: string;
  createdAt: ISODateString;
};

export type Post = {
  id: EntityId;
  courseId: EntityId;
  author: { name: string; avatar: [string, string] };
  timeAgo: string;
  record: { km: number; totalSec: number; paceMin: number; paceSec: number };
  caption: string;
  likes: number;
  isLiked: boolean;
  comments: Array<{ who: string; text: string }>;
  userId?: EntityId;
  createdAt?: ISODateString;
};

export type DduimAppState = {
  version: number;
  currentUser: UserProfile;
  userCourses: Course[];
  publicCourses: Course[];
  savedCourseIds: EntityId[];
  likedPostIds: EntityId[];
  updatedAt: ISODateString;
};
