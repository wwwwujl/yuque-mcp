import * as z from "zod/v4";

export const RepoTypeSchema = z.enum(["Book", "Design", "Column", "all"]);
export const DocFormatSchema = z.enum(["markdown", "html", "lake"]);
export const VisibilitySchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export const BinaryFlagSchema = z.union([z.literal(0), z.literal(1)]);
export const ConfirmTrueSchema = z.literal(true);
export const TocActionSchema = z.enum([
  "appendNode",
  "prependNode",
  "insertNode",
  "moveNode",
  "removeNode",
  "editNode",
]);
export const TocActionModeSchema = z.enum(["child", "sibling"]);
export const TocNodeTypeSchema = z.enum(["DOC", "TITLE"]);

const NonEmptyStringSchema = z.string().trim().min(1);
const DocRefSchema = z.coerce.string().trim().min(1);

function ensureExactlyOneDocRef(
  value: {
    slug?: string;
    doc_id?: string;
  },
  ctx: z.core.$RefinementCtx,
) {
  const hasSlug = Boolean(value.slug);
  const hasDocId = Boolean(value.doc_id);
  if (hasSlug === hasDocId) {
    ctx.addIssue({
      code: "custom",
      path: ["slug"],
      message: "Exactly one of slug or doc_id must be provided.",
    });
  }
}

export const EmptyInputSchema = z.object({}).strict();

export const ListGroupsInputSchema = z
  .object({
    login: NonEmptyStringSchema.optional(),
  })
  .strict();

export const ListReposInputSchema = z
  .object({
    user: NonEmptyStringSchema.optional(),
    group: NonEmptyStringSchema.optional(),
    type: RepoTypeSchema.default("all"),
    offset: z.coerce.number().int().min(0).default(0),
    include_membered: z.coerce.boolean().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasUser = Boolean(value.user);
    const hasGroup = Boolean(value.group);

    if (hasUser === hasGroup) {
      ctx.addIssue({
        code: "custom",
        path: ["user"],
        message: "Exactly one of user or group must be provided.",
      });
    }
  });

export const GetMyRepositoriesInputSchema = z
  .object({
    type: RepoTypeSchema.default("all"),
    offset: z.coerce.number().int().min(0).default(0),
    include_membered: z.coerce.boolean().default(false),
  })
  .strict();

export const GetRepoInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    type: z.enum(["Book", "Design", "Column"]).optional(),
  })
  .strict();

export const NamespaceInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
  })
  .strict();

export const ListDocsInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const GetDocInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    slug: NonEmptyStringSchema.optional(),
    doc_id: DocRefSchema.optional(),
    raw: BinaryFlagSchema.default(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    ensureExactlyOneDocRef(value, ctx);
  });

export const SearchDocsInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    query: NonEmptyStringSchema,
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const SearchAndReadInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    query: NonEmptyStringSchema,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    read_first: z.coerce.boolean().default(true),
  })
  .strict();

export const CreateDocInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    body: z.string().min(1),
    slug: NonEmptyStringSchema.optional(),
    public: VisibilitySchema.optional(),
    format: DocFormatSchema.default("markdown"),
  })
  .strict();

export const CreateDocWithTocInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    body: z.string().min(1),
    slug: NonEmptyStringSchema.optional(),
    public: VisibilitySchema.optional(),
    format: DocFormatSchema.default("markdown"),
    parent_uuid: NonEmptyStringSchema.optional(),
  })
  .strict();

export const UpdateDocInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    slug: NonEmptyStringSchema.optional(),
    doc_id: DocRefSchema.optional(),
    title: NonEmptyStringSchema.optional(),
    body: z.string().min(1).optional(),
    new_slug: NonEmptyStringSchema.optional(),
    public: VisibilitySchema.optional(),
    format: DocFormatSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    ensureExactlyOneDocRef(value, ctx);

    const hasChanges = [value.title, value.body, value.new_slug, value.public, value.format].some(
      (item) => item !== undefined,
    );

    if (!hasChanges) {
      ctx.addIssue({
        code: "custom",
        message: "At least one writable field must be provided to update a doc.",
      });
    }
  });

export const DeleteDocInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    slug: NonEmptyStringSchema.optional(),
    doc_id: DocRefSchema.optional(),
    confirm: ConfirmTrueSchema,
    confirm_text: NonEmptyStringSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    ensureExactlyOneDocRef(value, ctx);
  });

export const UpdateTocInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    action: TocActionSchema,
    action_mode: TocActionModeSchema.optional(),
    doc_ids: NonEmptyStringSchema.optional(),
    node_uuid: NonEmptyStringSchema.optional(),
    target_uuid: NonEmptyStringSchema.optional(),
    to_uuid: NonEmptyStringSchema.optional(),
    title: NonEmptyStringSchema.optional(),
    node_type: TocNodeTypeSchema.optional(),
    insert_ahead: BinaryFlagSchema.optional(),
    url: NonEmptyStringSchema.optional(),
    open_window: BinaryFlagSchema.optional(),
    visible: BinaryFlagSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasTarget = [
      value.doc_ids,
      value.node_uuid,
      value.target_uuid,
      value.to_uuid,
      value.title,
      value.url,
    ].some((item) => item !== undefined);

    if (!hasTarget) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one TOC target field must be provided: doc_ids, node_uuid, target_uuid, to_uuid, title, or url.",
      });
    }
  });

export const GetGroupInputSchema = z
  .object({
    login: NonEmptyStringSchema,
  })
  .strict();

export const CreateGroupInputSchema = z
  .object({
    name: NonEmptyStringSchema,
    login: NonEmptyStringSchema,
    description: z.string().optional(),
  })
  .strict();

export const UpdateGroupInputSchema = z
  .object({
    login: NonEmptyStringSchema,
    name: NonEmptyStringSchema.optional(),
    new_login: NonEmptyStringSchema.optional(),
    description: z.string().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasChanges = [value.name, value.new_login, value.description].some((item) => item !== undefined);
    if (!hasChanges) {
      ctx.addIssue({
        code: "custom",
        message: "At least one writable field must be provided to update a group.",
      });
    }
  });

export const DeleteGroupInputSchema = z
  .object({
    login: NonEmptyStringSchema,
    confirm: ConfirmTrueSchema,
    confirm_text: NonEmptyStringSchema,
  })
  .strict();

export const CreateRepoInputSchema = z
  .object({
    user: NonEmptyStringSchema.optional(),
    group: NonEmptyStringSchema.optional(),
    name: NonEmptyStringSchema,
    slug: NonEmptyStringSchema,
    type: z.enum(["Book", "Design", "Column"]).default("Book"),
    description: z.string().optional(),
    public: VisibilitySchema.default(0),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasUser = Boolean(value.user);
    const hasGroup = Boolean(value.group);
    if (hasUser === hasGroup) {
      ctx.addIssue({
        code: "custom",
        path: ["user"],
        message: "Exactly one of user or group must be provided.",
      });
    }
  });

export const UpdateRepoInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    name: NonEmptyStringSchema.optional(),
    slug: NonEmptyStringSchema.optional(),
    description: z.string().optional(),
    public: VisibilitySchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasChanges = [value.name, value.slug, value.description, value.public].some(
      (item) => item !== undefined,
    );
    if (!hasChanges) {
      ctx.addIssue({
        code: "custom",
        message: "At least one writable field must be provided to update a repo.",
      });
    }
  });

export const DeleteRepoInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    confirm: ConfirmTrueSchema,
    confirm_text: NonEmptyStringSchema,
  })
  .strict();

export const CreateDocFromFileInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    file_path: NonEmptyStringSchema,
    title: NonEmptyStringSchema.optional(),
    slug: NonEmptyStringSchema.optional(),
    public: VisibilitySchema.optional(),
    format: DocFormatSchema.default("markdown"),
    parent_uuid: NonEmptyStringSchema.optional(),
  })
  .strict();

export const UpdateDocFromFileInputSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    slug: NonEmptyStringSchema.optional(),
    doc_id: DocRefSchema.optional(),
    file_path: NonEmptyStringSchema,
    title: NonEmptyStringSchema.optional(),
    new_slug: NonEmptyStringSchema.optional(),
    public: VisibilitySchema.optional(),
    format: DocFormatSchema.default("markdown"),
  })
  .strict()
  .superRefine((value, ctx) => {
    ensureExactlyOneDocRef(value, ctx);
  });

export type ListGroupsInput = z.infer<typeof ListGroupsInputSchema>;
export type ListReposInput = z.infer<typeof ListReposInputSchema>;
export type GetMyRepositoriesInput = z.infer<typeof GetMyRepositoriesInputSchema>;
export type GetRepoInput = z.infer<typeof GetRepoInputSchema>;
export type NamespaceInput = z.infer<typeof NamespaceInputSchema>;
export type ListDocsInput = z.infer<typeof ListDocsInputSchema>;
export type GetDocInput = z.infer<typeof GetDocInputSchema>;
export type SearchDocsInput = z.infer<typeof SearchDocsInputSchema>;
export type SearchAndReadInput = z.infer<typeof SearchAndReadInputSchema>;
export type CreateDocInput = z.infer<typeof CreateDocInputSchema>;
export type CreateDocWithTocInput = z.infer<typeof CreateDocWithTocInputSchema>;
export type UpdateDocInput = z.infer<typeof UpdateDocInputSchema>;
export type DeleteDocInput = z.infer<typeof DeleteDocInputSchema>;
export type UpdateTocInput = z.infer<typeof UpdateTocInputSchema>;
export type GetGroupInput = z.infer<typeof GetGroupInputSchema>;
export type CreateGroupInput = z.infer<typeof CreateGroupInputSchema>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupInputSchema>;
export type DeleteGroupInput = z.infer<typeof DeleteGroupInputSchema>;
export type CreateRepoInput = z.infer<typeof CreateRepoInputSchema>;
export type UpdateRepoInput = z.infer<typeof UpdateRepoInputSchema>;
export type DeleteRepoInput = z.infer<typeof DeleteRepoInputSchema>;
export type CreateDocFromFileInput = z.infer<typeof CreateDocFromFileInputSchema>;
export type UpdateDocFromFileInput = z.infer<typeof UpdateDocFromFileInputSchema>;
