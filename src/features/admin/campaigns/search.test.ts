import { describe, expect, it } from "vitest";
import { campaignSearchSchema } from "./search";

describe("campaignSearchSchema edit", () => {
  it("takes the id of the Campaign to open", () => {
    expect(campaignSearchSchema.parse({ edit: 7 }).edit).toBe(7);
    expect(campaignSearchSchema.parse({ edit: "7" }).edit).toBe(7);
  });

  it("is absent by default, and ignores anything that is not a Campaign id", () => {
    expect(campaignSearchSchema.parse({}).edit).toBeUndefined();
    for (const bad of ["abc", 0, -3, 1.5, ""]) {
      expect(campaignSearchSchema.parse({ edit: bad }).edit).toBeUndefined();
    }
  });
});
