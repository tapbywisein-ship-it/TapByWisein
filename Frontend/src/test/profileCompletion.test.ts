import { describe, it, expect } from "vitest";
import { profileSetupChecklist } from "@/lib/profileCompletion";

const doneByLabel = (p: Parameters<typeof profileSetupChecklist>[0]) =>
  Object.fromEntries(profileSetupChecklist(p).map((i) => [i.label, i.done]));

describe("profileSetupChecklist", () => {
  it("has the same 4 tasks for everyone", () => {
    expect(profileSetupChecklist(null).map((i) => i.label)).toEqual([
      "Add a profile photo",
      "Write a short bio",
      "Add your role & company",
      "Add at least 3 skills",
    ]);
  });

  it("only counts skills as done with at least 3", () => {
    expect(doneByLabel({ skills: ["React"] })["Add at least 3 skills"]).toBe(false);
    expect(doneByLabel({ skills: ["React", "Node", "SQL"] })["Add at least 3 skills"]).toBe(true);
  });

  it("needs a bio longer than 20 characters", () => {
    expect(doneByLabel({ bio: "Hi" })["Write a short bio"]).toBe(false);
    expect(doneByLabel({ bio: "Full-stack developer at WiseIn" })["Write a short bio"]).toBe(true);
  });

  it("doesn't count a Google sign-in photo, only an uploaded one", () => {
    expect(doneByLabel({ avatar: "https://lh3.googleusercontent.com/a/photo" })["Add a profile photo"]).toBe(false);
    expect(
      doneByLabel({ avatar: "https://x.supabase.co/storage/v1/object/public/avatars/me.jpg" })["Add a profile photo"]
    ).toBe(true);
  });
});
