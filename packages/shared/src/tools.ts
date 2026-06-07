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
} as const;

export type ToolName = keyof typeof tools;
export type ToolParams<T extends ToolName> = z.infer<typeof tools[T]["parameters"]>;