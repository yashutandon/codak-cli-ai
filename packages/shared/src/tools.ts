import { z } from "zod";

export const tools = {
  read_file: {
    description: "Read the contents of a file",
    parameters: z.object({
      path: z.string().describe("Path to the file to read"),
    }),
  },

  write_file: {
    description: "Write content to a file, creating it if it doesn't exist",
    parameters: z.object({
      path: z.string().describe("Path to the file to write"),
      content: z.string().describe("Content to write to the file"),
    }),
  },

  edit_file: {
    description: "Edit a file by replacing specific text. Use this instead of write_file when modifying existing files.",
    parameters: z.object({
      path: z.string().describe("Path to the file to edit"),
      old_str: z.string().describe("Exact string to find and replace"),
      new_str: z.string().describe("String to replace it with"),
    }),
  },

  list_files: {
    description: "List files and directories in a given path",
    parameters: z.object({
      path: z.string().describe("Directory path to list").default("."),
    }),
  },

  run_command: {
    description: "Run a shell command and return its output",
    parameters: z.object({
      command: z.string().describe("Shell command to execute"),
    }),
  },

  create_directory: {
    description: "Create a directory and all parent directories",
    parameters: z.object({
      path: z.string().describe("Directory path to create"),
    }),
  },

  delete_file: {
    description: "Delete a file or empty directory",
    parameters: z.object({
      path: z.string().describe("Path to delete"),
    }),
  },

  search_files: {
    description: "Search for files matching a pattern",
    parameters: z.object({
      pattern: z.string().describe("Glob pattern to search for"),
      path: z.string().describe("Directory to search in").default("."),
    }),
  },

  // ── Git Tools ─────────────────────────────────────────────────
  git_status: {
    description: "Show working tree status — modified, staged, untracked files",
    parameters: z.object({}),
  },

  git_diff: {
    description: "Show changes in working directory or between commits",
    parameters: z.object({
      staged: z.boolean().describe("Show staged changes (git diff --staged)").default(false),
      file: z.string().describe("Specific file to diff (optional)").optional(),
    }),
  },

  git_commit: {
    description: "Stage all changes and create a commit",
    parameters: z.object({
      message: z.string().describe("Commit message"),
    }),
  },

  git_checkout: {
    description: "Switch to a branch or create a new one",
    parameters: z.object({
      branch: z.string().describe("Branch name to switch to or create"),
      create: z.boolean().describe("Create branch if it doesn't exist").default(false),
    }),
  },

  git_log: {
    description: "Show recent commit history",
    parameters: z.object({
      limit: z.number().describe("Number of commits to show").default(10),
    }),
  },

  git_create_branch: {
    description: "Create a new branch from current HEAD",
    parameters: z.object({
      branch: z.string().describe("New branch name"),
    }),
  },
} as const;

export type ToolName = keyof typeof tools;
export type ToolParams<T extends ToolName> = z.infer<typeof tools[T]["parameters"]>;