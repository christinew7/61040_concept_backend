---
timestamp: 'Wed Nov 05 2025 23:44:57 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251105_234457.e6854a15.md]]'
content_id: ca30c5e3e86fb60b9d8a1e5f2d45e3db3f13b54eb58a3f856f935295b557652a
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
            "exclude": [
                "no-import-prefix",
                "no-unversioned-import"
            ]
        }
    }
}

```
