---
timestamp: 'Fri Nov 07 2025 13:14:43 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_131443.3341eb11.md]]'
content_id: 8ac15347bc6ce0befa13f811a0f3d706e68454997bbfbbfd3d21ac289b38bf8b
---

# file: deno.json

```json
{
  "imports": {
    "@concepts/": "./src/concepts/",
    "@concepts": "./src/concepts/concepts.ts",
    "@test-concepts": "./src/concepts/test_concepts.ts",
    "@utils/": "./src/utils/",
    "@engine": "./src/engine/mod.ts",
    "@syncs": "./src/syncs/syncs.ts"
  },
  "tasks": {
    "start": "deno run --allow-net --allow-write --allow-read --allow-sys --allow-env src/main.ts",
    "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api",
    "import": "deno run --allow-read --allow-write --allow-env src/utils/generate_imports.ts",
    "build": "deno run import"
  },
  "lint": {
    "rules": {
      "exclude": ["no-import-prefix", "no-unversioned-import"]
    }
  }
}

```
