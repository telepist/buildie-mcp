#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration
const API_TOKEN = process.env.BUILDIE_API_TOKEN;
if (!API_TOKEN) {
  throw new Error(
    "BUILDIE_API_TOKEN environment variable is required. " +
      "Create a Partner API key in Buildie: Yritys > Integraatiot > Partner API Avaimet"
  );
}
// TypeScript narrowing: API_TOKEN is guaranteed to be string after the check above
const token: string = API_TOKEN;

const BASE_URL =
  process.env.BUILDIE_API_URL || "https://partner.live.buildie.fi";

// API fetch helper
async function buildieFetch(
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, string> } = {}
): Promise<unknown> {
  const url = new URL(`/v1${path}`, BASE_URL);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "access-token": token,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Buildie API error ${response.status}: ${text}`);
  }

  return response.json();
}

// Helper to build query params from optional fields
function buildParams(
  fields: Record<string, string | number | boolean | undefined>
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== "") {
      params[key] = String(value);
    }
  }
  return params;
}

// Format pagination info
function formatPagination(pagination: {
  totalCount: number;
  skip: number;
  limit: number;
}): string {
  return `Total: ${pagination.totalCount}, showing ${pagination.skip}-${pagination.skip + pagination.limit}`;
}

// MCP Server
const server = new McpServer({
  name: "buildie",
  version: "1.0.0",
});

// ── Projects ──────────────────────────────────────────────

server.tool(
  "list_projects",
  "List construction projects with optional filters",
  {
    skip: z.number().optional().describe("Number of items to skip"),
    limit: z.number().optional().describe("Max items to return"),
    projectNumber: z.string().optional().describe("Filter by project number"),
    projectNumber__in: z
      .string()
      .optional()
      .describe("Filter by project numbers (comma separated)"),
    projectClosed: z
      .boolean()
      .optional()
      .describe("Filter by closed status"),
    projectOpenStates__in: z
      .string()
      .optional()
      .describe("Filter by open state: OPEN, CLOSED (comma separated)"),
    projectCity__in: z
      .string()
      .optional()
      .describe("Filter by cities (comma separated, case insensitive)"),
    projectPersonInChargeUserUuid: z
      .string()
      .optional()
      .describe("Filter by person in charge UUID"),
    projectCreatedAt__gte: z
      .string()
      .optional()
      .describe("Created at or after (YYYY-MM-DD)"),
    projectCreatedAt__lte: z
      .string()
      .optional()
      .describe("Created at or before (YYYY-MM-DD)"),
    projectUpdatedAt__gte: z
      .string()
      .optional()
      .describe("Updated at or after (YYYY-MM-DD)"),
    projectUpdatedAt__lte: z
      .string()
      .optional()
      .describe("Updated at or before (YYYY-MM-DD)"),
    projectClassUuid__in: z
      .string()
      .optional()
      .describe("Filter by project class UUIDs (comma separated)"),
    projectCategoryId__in: z
      .string()
      .optional()
      .describe("Filter by category IDs (comma separated)"),
  },
  async (args) => {
    try {
      const result = (await buildieFetch("/projects", {
        params: buildParams(args),
      })) as { pagination: { totalCount: number; skip: number; limit: number }; data: unknown[] };
      return {
        content: [
          {
            type: "text" as const,
            text: `${formatPagination(result.pagination)}\n\n${JSON.stringify(result.data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_project",
  "Get a single project by UUID",
  {
    uuid: z.string().describe("Project UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/project/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Photos ────────────────────────────────────────────────

server.tool(
  "list_photos",
  "List photos with optional filters",
  {
    skip: z.number().optional().describe("Number of items to skip"),
    limit: z.number().optional().describe("Max items to return"),
    photoProjectUuid: z
      .string()
      .optional()
      .describe("Filter by project UUID"),
    photoProjectUuid__in: z
      .string()
      .optional()
      .describe("Filter by project UUIDs (comma separated)"),
    photoByUserUuid: z
      .string()
      .optional()
      .describe("Filter by photographer user UUID"),
    photoOfficialTime__gte: z
      .string()
      .optional()
      .describe("Taken at or after given time"),
    photoOfficialTime__lte: z
      .string()
      .optional()
      .describe("Taken at or before given time"),
    photoWorkStepUuid__in: z
      .string()
      .optional()
      .describe("Filter by work step UUIDs (comma separated)"),
    photoOnlyWithObservations: z
      .boolean()
      .optional()
      .describe("Only return photos with observations"),
    photoQ: z
      .string()
      .optional()
      .describe("Free text search in description, address, worksteps, observations"),
    photoHasTask: z
      .boolean()
      .optional()
      .describe("Only return photos that have a task"),
    photoHasReport: z
      .boolean()
      .optional()
      .describe("Only return photos that have a report"),
  },
  async (args) => {
    try {
      const result = (await buildieFetch("/photos", {
        params: buildParams(args),
      })) as { pagination: { totalCount: number; skip: number; limit: number }; data: unknown[] };
      return {
        content: [
          {
            type: "text" as const,
            text: `${formatPagination(result.pagination)}\n\n${JSON.stringify(result.data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_photo",
  "Get a single photo by UUID",
  {
    uuid: z.string().describe("Photo UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/photo/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_photo_download_url",
  "Get download URL for a single photo",
  {
    uuid: z.string().describe("Photo UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/photo/${uuid}/download-url`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "view_photo",
  "View a photo image directly. Fetches the photo and returns it as an inline image.",
  {
    uuid: z.string().describe("Photo UUID"),
  },
  async ({ uuid }) => {
    try {
      const downloadResult = (await buildieFetch(
        `/photo/${uuid}/download-url`
      )) as { downloadUrl: string; data: { description: string; officialTime: string; filename: string } };

      const imageResponse = await fetch(downloadResult.downloadUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const buffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

      return {
        content: [
          {
            type: "text" as const,
            text: `Photo: ${downloadResult.data.description || downloadResult.data.filename}\nTaken: ${downloadResult.data.officialTime}`,
          },
          {
            type: "image" as const,
            data: base64,
            mimeType: contentType,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(e as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// ── Tasks ─────────────────────────────────────────────────

server.tool(
  "list_tasks",
  "List tasks with optional filters",
  {
    skip: z.number().optional().describe("Number of items to skip"),
    limit: z.number().optional().describe("Max items to return"),
    taskProjectUuid__in: z
      .string()
      .optional()
      .describe("Filter by project UUIDs (comma separated)"),
    taskCategoryUuid__in: z
      .string()
      .optional()
      .describe("Filter by category UUIDs (comma separated)"),
    taskFinished: z.boolean().optional().describe("Filter by finished status"),
    taskLocked: z.boolean().optional().describe("Filter by locked status"),
    taskCreatedAt__gte: z
      .string()
      .optional()
      .describe("Created at or after given time"),
    taskCreatedAt__lte: z
      .string()
      .optional()
      .describe("Created at or before given time"),
    taskUpdatedAt__gte: z
      .string()
      .optional()
      .describe("Updated at or after given time"),
    taskUpdatedAt__lte: z
      .string()
      .optional()
      .describe("Updated at or before given time"),
    taskFinishedAt__gte: z
      .string()
      .optional()
      .describe("Finished at or after given time"),
    taskFinishedAt__lte: z
      .string()
      .optional()
      .describe("Finished at or before given time"),
  },
  async (args) => {
    try {
      const result = (await buildieFetch("/tasks", {
        params: buildParams(args),
      })) as { pagination: { totalCount: number; skip: number; limit: number }; data: unknown[] };
      return {
        content: [
          {
            type: "text" as const,
            text: `${formatPagination(result.pagination)}\n\n${JSON.stringify(result.data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_task",
  "Get a single task by UUID",
  {
    uuid: z.string().describe("Task UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/tasks/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Reports ───────────────────────────────────────────────

server.tool(
  "list_reports",
  "List reports with optional filters",
  {
    skip: z.number().optional().describe("Number of items to skip"),
    limit: z.number().optional().describe("Max items to return"),
    reportProjectUuid__in: z
      .string()
      .optional()
      .describe("Filter by project UUIDs (comma separated)"),
    reportTemplateUuid__in: z
      .string()
      .optional()
      .describe("Filter by report template UUIDs (comma separated)"),
    reportLocked: z.boolean().optional().describe("Filter by locked status"),
    reportQ: z
      .string()
      .optional()
      .describe("Free text search in label and description"),
    reportStateName__in: z
      .string()
      .optional()
      .describe("Filter by state names (comma separated)"),
    reportCreatedAt__gte: z
      .string()
      .optional()
      .describe("Created at or after given time"),
    reportCreatedAt__lte: z
      .string()
      .optional()
      .describe("Created at or before given time"),
    reportUpdatedAt__gte: z
      .string()
      .optional()
      .describe("Updated at or after given time"),
    reportUpdatedAt__lte: z
      .string()
      .optional()
      .describe("Updated at or before given time"),
  },
  async (args) => {
    try {
      const result = (await buildieFetch("/reports", {
        params: buildParams(args),
      })) as { pagination: { totalCount: number; skip: number; limit: number }; data: unknown[] };
      return {
        content: [
          {
            type: "text" as const,
            text: `${formatPagination(result.pagination)}\n\n${JSON.stringify(result.data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_report",
  "Get a single report by UUID",
  {
    uuid: z.string().describe("Report UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/reports/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_report_download_url",
  "Get download URL for a single report",
  {
    uuid: z.string().describe("Report UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/reports/${uuid}/download-url`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Memos ─────────────────────────────────────────────────

server.tool(
  "list_memos",
  "List memos (daily logs) with optional filters",
  {
    skip: z.number().optional().describe("Number of items to skip"),
    limit: z.number().optional().describe("Max items to return"),
    memoProjectUuid__in: z
      .string()
      .optional()
      .describe("Filter by project UUIDs (comma separated)"),
    memoDate: z.string().optional().describe("Filter by exact date"),
    memoDate__gte: z
      .string()
      .optional()
      .describe("Memos at or after given date"),
    memoDate__lte: z
      .string()
      .optional()
      .describe("Memos at or before given date"),
    memoSigned: z.boolean().optional().describe("Filter by signed status"),
    memoLocked: z.boolean().optional().describe("Filter by locked status"),
  },
  async (args) => {
    try {
      const result = (await buildieFetch("/memos", {
        params: buildParams(args),
      })) as { pagination: { totalCount: number; skip: number; limit: number }; data: unknown[] };
      return {
        content: [
          {
            type: "text" as const,
            text: `${formatPagination(result.pagination)}\n\n${JSON.stringify(result.data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "retrieve_or_create_memo",
  "Retrieve an existing memo for a date and project, or create one if it doesn't exist",
  {
    projectUuid: z.string().describe("Project UUID"),
    date: z.string().describe("Date in YYYY-MM-DD format"),
  },
  async ({ projectUuid, date }) => {
    try {
      const result = await buildieFetch("/memos/retrieve-or-create", {
        method: "POST",
        body: { projectUuid, date },
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Categories ────────────────────────────────────────────

server.tool(
  "list_categories",
  "List categories with optional filters",
  {
    skip: z.number().optional().describe("Number of items to skip"),
    limit: z.number().optional().describe("Max items to return"),
    categoryType__in: z
      .string()
      .optional()
      .describe(
        "Filter by type: company, project, projectClass, projectInternal, workflow (comma separated)"
      ),
    categoryCreatedAt__gte: z
      .string()
      .optional()
      .describe("Created at or after given time"),
    categoryCreatedAt__lte: z
      .string()
      .optional()
      .describe("Created at or before given time"),
  },
  async (args) => {
    try {
      const result = (await buildieFetch("/categories", {
        params: buildParams(args),
      })) as { pagination: { totalCount: number; skip: number; limit: number }; data: unknown[] };
      return {
        content: [
          {
            type: "text" as const,
            text: `${formatPagination(result.pagination)}\n\n${JSON.stringify(result.data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_category",
  "Get a single category by UUID",
  {
    uuid: z.string().describe("Category UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/categories/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Users ─────────────────────────────────────────────────

server.tool(
  "list_users",
  "List users with optional filters",
  {
    skip: z.number().optional().describe("Number of items to skip"),
    limit: z.number().optional().describe("Max items to return"),
    userUuid__in: z
      .string()
      .optional()
      .describe("Filter by user UUIDs (comma separated)"),
  },
  async (args) => {
    try {
      const result = (await buildieFetch("/users", {
        params: buildParams(args),
      })) as { pagination: { totalCount: number; skip: number; limit: number }; data: unknown[] };
      return {
        content: [
          {
            type: "text" as const,
            text: `${formatPagination(result.pagination)}\n\n${JSON.stringify(result.data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_user",
  "Get a single user by UUID",
  {
    uuid: z.string().describe("User UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/user/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Company ───────────────────────────────────────────────

server.tool(
  "get_company",
  "Get company details by UUID",
  {
    uuid: z.string().describe("Company UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/company/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Worklists ─────────────────────────────────────────────

server.tool(
  "list_worklists",
  "List worklists (work step templates)",
  {
    workUuid: z.string().optional().describe("Filter by worklist UUID"),
    workUuid__in: z
      .string()
      .optional()
      .describe("Filter by worklist UUIDs (comma separated)"),
  },
  async (args) => {
    try {
      const result = await buildieFetch("/worklists", {
        params: buildParams(args),
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_worklist",
  "Get a single worklist by UUID",
  {
    uuid: z.string().describe("Worklist UUID"),
  },
  async ({ uuid }) => {
    try {
      const result = await buildieFetch(`/worklists/${uuid}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ── Start server ──────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start Buildie MCP server:", error);
  process.exit(1);
});
