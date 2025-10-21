---
timestamp: 'Sat Oct 18 2025 11:45:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_114541.eaae5182.md]]'
content_id: 88bd3e70bf90249c8b73a0eb37609f42ec813900f837f1007d2b65e6c9d8691a
---

# file: deno.json

```json
{
  "imports": {
    "@concepts/": "./src/concepts/",
    "@utils/": "./src/utils/"
  },
  "tasks": {
    "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
  }
}

```
