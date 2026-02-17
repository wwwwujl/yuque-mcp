# Yuque API Mapping

Source used: `https://github.com/yuque/sdk` (`lib/*.js`) and Yuque OpenAPI docs.

Base endpoint:
- `https://www.yuque.com/api/v2/`

Auth header:
- `X-Auth-Token: <YUQUE_TOKEN>`

## Endpoint Mapping

- `yuque_get_current_user` -> `GET user`
- `yuque_list_groups` -> `GET groups` or `GET users/{login}/groups`
- `yuque_get_group` -> `GET groups/{login}`
- `yuque_create_group` -> `POST groups`
- `yuque_update_group` -> `PUT groups/{login}`
- `yuque_delete_group` -> `DELETE groups/{login}`
- `yuque_list_repos` -> `GET users/{user}/repos` or `GET groups/{group}/repos`
- `yuque_get_my_repositories` -> `GET user` + `GET users/{current_login}/repos`
- `yuque_get_repo` -> `GET repos/{namespace}`
- `yuque_create_repo` -> `POST users/{user}/repos` or `POST groups/{group}/repos`
- `yuque_update_repo` -> `PUT repos/{namespace}`
- `yuque_delete_repo` -> `DELETE repos/{namespace}`
- `yuque_get_repo_toc` -> `GET repos/{namespace}/toc`
- `yuque_get_repository_overview` -> `GET repos/{namespace}` + `GET repos/{namespace}/toc`
- `yuque_list_docs` -> `GET repos/{namespace}/docs` with optional `offset`/`limit`
- `yuque_get_doc` -> `GET repos/{namespace}/docs/{slug_or_doc_id}` with optional `raw`
- `yuque_create_doc` -> `POST repos/{namespace}/docs`
- `yuque_create_document_with_toc` -> `POST repos/{namespace}/docs` + `PUT repos/{namespace}/toc`
- `yuque_update_doc` -> `PUT repos/{namespace}/docs/{slug_or_doc_id}`
- `yuque_delete_doc` -> `DELETE repos/{namespace}/docs/{slug_or_doc_id}`
- `yuque_create_doc_from_file` -> local file read + `POST repos/{namespace}/docs` (+ TOC attach attempt)
- `yuque_update_doc_from_file` -> local file read + `PUT repos/{namespace}/docs/{slug_or_doc_id}`
- `yuque_update_toc` -> `PUT repos/{namespace}/toc`
- `yuque_search_and_read` -> client-side paginated search over listed docs + optional `GET repos/{namespace}/docs/{slug_or_doc_id}`

## Notes

- `yuque_search_docs` and `yuque_search_and_read` are implemented client-side over paginated listed docs.
- Retry policy remains read-only only (`GET` + transient statuses).
- For delete tools (`group/repo/doc`), confirmation text is validated in service layer before upstream call.
- `yuque_list_groups` will fallback to `GET users/{current_login}/groups` if `GET groups` returns 404.
- TOC calls attempt namespace fallback: if repo ID namespace is not accepted, service retries with canonical `login/slug` namespace.
