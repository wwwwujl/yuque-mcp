# Tool Contract (V4)

All tools return a stable JSON envelope:
- success: `{ ok: true, data, meta }`
- failure: `{ ok: false, error, meta }`

## Delete Safety (All Delete Tools)

Required input fields:
- `confirm: true`
- `confirm_text: string` (must exactly match expected phrase)

Expected confirmation phrases:
- doc: `DELETE DOC <namespace>/<docRef>` (`docRef` is `slug` or `doc_id`)
- repo: `DELETE REPO <namespace>`
- group: `DELETE GROUP <login>`

Server policy:
- delete disabled by default (`YUQUE_ALLOW_DELETE=false`)
- optional allowlist (`YUQUE_DELETE_NAMESPACE_ALLOWLIST`) for delete targets
  - repo/doc target: `namespace`
  - group target: `login`

## User & Group

### `yuque_get_current_user`
- Input: none
- Output: current user object

### `yuque_list_groups`
- Input: `login?: string`
- Output: groups array

### `yuque_get_group`
- Input: `login: string`
- Output: group details

### `yuque_create_group`
- Input: `name`, `login`, `description?`
- Output: created group

### `yuque_update_group`
- Input: `login`, `name?`, `new_login?`, `description?`
- Rules: at least one writable field required
- Output: updated group

### `yuque_delete_group`
- Input: `login`, `confirm`, `confirm_text`
- Output: `{ login, deleted, group }`

## Repository

### `yuque_list_repos`
- Input: `user?`, `group?`, `type?`, `offset?`, `include_membered?`
- Rules: exactly one of `user` or `group`
- Output: repos array

### `yuque_get_my_repositories`
- Input: `type?`, `offset?`, `include_membered?`
- Output: `{ user, repos }`

### `yuque_get_repo`
- Input: `namespace`, `type?`
- Output: repo details

### `yuque_create_repo`
- Input: `user?`, `group?`, `name`, `slug`, `type?`, `description?`, `public?`
- Rules: exactly one of `user` or `group`
- `public`: `0 | 1 | 2`
- Output: created repo

### `yuque_update_repo`
- Input: `namespace`, `name?`, `slug?`, `description?`, `public?`
- Rules: at least one writable field required
- `public`: `0 | 1 | 2`
- Output: updated repo

### `yuque_delete_repo`
- Input: `namespace`, `confirm`, `confirm_text`
- Output: `{ namespace, deleted, repo }`

### `yuque_get_repo_toc`
- Input: `namespace`
- Output: TOC items with normalized fields:
  - `id`, `uuid`, `type`, `level`, `title`, `slug`, `depth`, `url`

### `yuque_get_repository_overview`
- Input: `namespace`
- Output: `{ repo, toc }`

## Document

### `yuque_list_docs`
- Input: `namespace`, `offset?`, `limit?`
- Output: docs array

### `yuque_get_doc`
- Input: `namespace`, `slug?`, `doc_id?`, `raw?`
- Rules: exactly one of `slug` or `doc_id`
- Output: doc details

### `yuque_search_docs`
- Input: `namespace`, `query`, `limit?`
- Behavior: client-side search on paginated listed docs (scans repository docs pages and matches title/slug/description)
- Output: `{ query, total, items }`

### `yuque_search_and_read`
- Input: `namespace`, `query`, `limit?`, `read_first?`
- Behavior: search docs and optionally load first hit content
- Output: `{ query, total, items, first_doc, read_first }`

### `yuque_create_doc`
- Input: `namespace`, `title`, `body`, `slug?`, `public?`, `format?`
- `format`: `"markdown" | "html" | "lake"`
- `public`: `0 | 1 | 2`
- Output: created doc

### `yuque_create_document_with_toc`
- Input: `namespace`, `title`, `body`, `slug?`, `public?`, `format?`, `parent_uuid?`
- Output: `{ doc, toc }`

### `yuque_update_doc`
- Input: `namespace`, `slug?`, `doc_id?`, `title?`, `body?`, `new_slug?`, `public?`, `format?`
- Rules:
  - exactly one of `slug` or `doc_id`
  - at least one writable field required
- Output: updated doc

### `yuque_delete_doc`
- Input: `namespace`, `slug?`, `doc_id?`, `confirm`, `confirm_text`
- Rules: exactly one of `slug` or `doc_id`
- Output: `{ namespace, docRef, slug, docId, deleted, doc }`

### `yuque_create_doc_from_file`
- Input: `namespace`, `file_path`, `title?`, `slug?`, `public?`, `format?`, `parent_uuid?`
- Behavior: read local file and create doc
- Output: `{ doc, toc, source_file }`

### `yuque_update_doc_from_file`
- Input: `namespace`, `slug?`, `doc_id?`, `file_path`, `title?`, `new_slug?`, `public?`, `format?`
- Rules: exactly one of `slug` or `doc_id`
- Behavior: read local file and update doc body
- Output: `{ doc, source_file }`

## TOC

### `yuque_update_toc`
- Input:
  - `namespace`
  - `action`: `"appendNode" | "prependNode" | "insertNode" | "moveNode" | "removeNode" | "editNode"`
  - `action_mode?`: `"child" | "sibling"`
  - `doc_ids?`, `node_uuid?`, `target_uuid?`, `to_uuid?`, `title?`, `node_type?`, `insert_ahead?`
  - `url?`, `open_window?`, `visible?`
- Rules: at least one target field required (`doc_ids` / `node_uuid` / `target_uuid` / `to_uuid` / `title` / `url`)
- Output: `{ namespace, effectiveNamespace, action, items, raw }`
