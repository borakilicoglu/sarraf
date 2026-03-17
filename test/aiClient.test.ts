import { afterEach, describe, expect, it, vi } from "vitest";

import { generateAiSummary } from "../src/aiClient.js";

describe("generateAiSummary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates AI summary from OpenAI-style response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            output_text: "Remove the unused package first.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )),
    );

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

    expect(summary).toBe("Remove the unused package first.");
  });

  it("returns helpful auth error message for failed AI requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: "bad key" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })),
    );

    await expect(
      generateAiSummary(
        {
          enabled: true,
          provider: "openai",
          token: "bad-token",
          model: "gpt-4.1",
        },
        [],
      ),
    ).rejects.toThrow(/AI authentication failed/);
  });
});
