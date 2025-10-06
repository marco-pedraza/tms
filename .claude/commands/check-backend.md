# Check Backend

Run formatting and linting for the backend.

After running this command:

- Mention if npm run format modified any files and which ones
- List any linting issues found by npm run lint
- Suggest fixes for any issues found

```sh
cd apps/server && (npm run format | grep -v "(unchanged)" || true) && npm run lint
```
