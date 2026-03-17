import test from "node:test";
import assert from "node:assert/strict";

import { generateAiSummary } from "../dist/aiClient.js";

test("generates AI summary from OpenAI-style response", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        output_text: "Remove the unused package first.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    const summary = await generateAiSummary(
      {
        enabled: true,
        provider: "openai",
        token: "test-token",
        model: "gpt-4.1",
      },
      [
        {
          workspace: {
            name: "fixture",
            dir: "/tmp/fixture",
            packagePath: "/tmp/fixture/package.json",
            relativeDir: ".",
          },
          result: {
            rootDir: "/tmp/fixture",
            packagePath: "/tmp/fixture/package.json",
            files: [],
            externalImports: ["commander"],
            scriptCommandPackages: [],
            scriptEntryFiles: [],
            packageTraces: { commander: ["src/index.ts"] },
            missingPackages: [],
            unusedDependencies: ["react"],
            unusedDevDependencies: [],
            misplacedDevDependencies: [],
          },
          findings: [
            {
              type: "unused-dependencies",
              title: "Unused dependencies",
              items: ["react"],
            },
          ],
        },
      ],
    );

    assert.equal(summary, "Remove the unused package first.");
  } finally {
    global.fetch = originalFetch;
  }
});

test("returns helpful auth error message for failed AI requests", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(JSON.stringify({ error: { message: "bad key" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      () =>
        generateAiSummary(
          {
            enabled: true,
            provider: "openai",
            token: "bad-token",
            model: "gpt-4.1",
          },
          [],
        ),
      /AI authentication failed/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
