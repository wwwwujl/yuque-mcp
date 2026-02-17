type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export interface UserOutput {
  id: number | null;
  type: string | null;
  login: string | null;
  name: string | null;
  avatarUrl: string | null;
  description: string | null;
}

export function normalizeUser(value: unknown): UserOutput {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    type: asString(item.type),
    login: asString(item.login),
    name: asString(item.name),
    avatarUrl: asString(item.avatar_url),
    description: asString(item.description),
  };
}

export interface GroupOutput {
  id: number | null;
  login: string | null;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
}

export function normalizeGroup(value: unknown): GroupOutput {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    login: asString(item.login),
    name: asString(item.name),
    description: asString(item.description),
    avatarUrl: asString(item.avatar_url),
  };
}

export interface RepoOutput {
  id: number | null;
  type: string | null;
  name: string | null;
  slug: string | null;
  namespace: string | null;
  userLogin: string | null;
  description: string | null;
  public: number | null;
  itemsCount: number | null;
  docsCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function normalizeRepo(value: unknown): RepoOutput {
  const item = asRecord(value);
  const user = asRecord(item.user);

  return {
    id: asNumber(item.id),
    type: asString(item.type),
    name: asString(item.name),
    slug: asString(item.slug),
    namespace: asString(item.namespace),
    userLogin: asString(user.login),
    description: asString(item.description),
    public: asNumber(item.public),
    itemsCount: asNumber(item.items_count),
    docsCount: asNumber(item.docs_count),
    createdAt: asString(item.created_at),
    updatedAt: asString(item.updated_at),
  };
}

export interface TocItemOutput {
  id: number | null;
  uuid: string | null;
  type: string | null;
  level: number | null;
  title: string | null;
  slug: string | null;
  depth: number | null;
  url: string | null;
}

export function normalizeTocItem(value: unknown): TocItemOutput {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    uuid: asString(item.uuid),
    type: asString(item.type),
    level: asNumber(item.level),
    title: asString(item.title),
    slug: asString(item.slug),
    depth: asNumber(item.depth),
    url: asString(item.url),
  };
}

export interface DocSummaryOutput {
  id: number | null;
  slug: string | null;
  title: string | null;
  description: string | null;
  format: string | null;
  public: number | null;
  wordCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function normalizeDocSummary(value: unknown): DocSummaryOutput {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    slug: asString(item.slug),
    title: asString(item.title),
    description: asString(item.description),
    format: asString(item.format),
    public: asNumber(item.public),
    wordCount: asNumber(item.word_count),
    createdAt: asString(item.created_at),
    updatedAt: asString(item.updated_at),
  };
}

export interface DocOutput extends DocSummaryOutput {
  body: string | null;
  bodyHtml: string | null;
  likesCount: number | null;
  commentsCount: number | null;
  pinned: boolean | null;
}

export function normalizeDoc(value: unknown): DocOutput {
  const base = normalizeDocSummary(value);
  const item = asRecord(value);
  return {
    ...base,
    body: asString(item.body),
    bodyHtml: asString(item.body_html),
    likesCount: asNumber(item.likes_count),
    commentsCount: asNumber(item.comments_count),
    pinned: asBoolean(item.pinned),
  };
}

export function normalizeGroups(value: unknown): GroupOutput[] {
  return asArray(value).map((item) => normalizeGroup(item));
}

export function normalizeRepos(value: unknown): RepoOutput[] {
  return asArray(value).map((item) => normalizeRepo(item));
}

export function normalizeToc(value: unknown): TocItemOutput[] {
  return asArray(value).map((item) => normalizeTocItem(item));
}

export function normalizeDocs(value: unknown): DocSummaryOutput[] {
  return asArray(value).map((item) => normalizeDocSummary(item));
}
