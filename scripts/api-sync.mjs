// pnpm api:sync   copy specs from the sibling backend checkout, then regenerate types
// pnpm api:gen    regenerate types from the committed specs only (used by CI)
import { copyFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const specs = ["openapi-store", "openapi-admin"];
const backend = resolve(process.env.BACKEND_DIR ?? "../../Python/store-backend");
const genOnly = process.argv.includes("--gen-only");

for (const name of specs) {
  if (!genOnly) {
    const src = resolve(backend, `${name}.json`);
    if (!existsSync(src)) throw new Error(`Missing ${src}. Set BACKEND_DIR to the store-backend checkout.`);
    copyFileSync(src, `api/specs/${name}.json`);
  }
  // openapi-typescript needs the TypeScript 5 JS API; the project compiles with TS 7, so run
  // it in an isolated pnpm dlx environment with TS 5 pinned beside it.
  execFileSync(
    "pnpm",
    ["dlx", "--package=typescript@5.9.3", "--package=openapi-typescript@7.13.0", "openapi-typescript", `api/specs/${name}.json`, "-o", `api/specs/${name}.d.ts`],
    { stdio: "inherit" },
  );
}
