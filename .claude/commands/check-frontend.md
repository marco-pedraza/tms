# Check Frontend

Run formatting, linting, and type checking for the frontend.

After running this command:

- Mention if npm run format modified any files and which ones
- List any linting issues found by npm run lint
- List any type errors found by npm run check-types
- Suggest fixes for any issues found

```sh
cd apps/web && (npm run format | grep -v "(unchanged)" || true) && npm run lint && npm run check-types
```
