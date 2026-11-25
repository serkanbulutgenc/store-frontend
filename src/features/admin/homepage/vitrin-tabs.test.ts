import { expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import { vitrinTabs } from "./vitrin-tabs";

const me = (permissions: string[]): Me => ({
  id: 1,
  email: "a@b.c",
  name: "A",
  role: "staff",
  permissions,
  mfa_required: false,
  mfa_enrolled: false,
});

it("shows the layout and both banner tabs to someone who may edit both", () => {
  expect(vitrinTabs(me(["edit_homepage", "edit_banners"])).map((t) => t.key)).toEqual([
    "layout",
    "announcement",
    "category_top",
  ]);
});

it("shows only what the user's permissions allow", () => {
  expect(vitrinTabs(me(["edit_homepage"])).map((t) => t.key)).toEqual(["layout"]);
  expect(vitrinTabs(me(["edit_banners"])).map((t) => t.key)).toEqual([
    "announcement",
    "category_top",
  ]);
  expect(vitrinTabs(me([]))).toEqual([]);
});
