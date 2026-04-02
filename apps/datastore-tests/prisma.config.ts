// Used by Prisma 7+ CLI; connection URL is not allowed in schema.prisma
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
