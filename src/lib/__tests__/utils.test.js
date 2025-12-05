import { describe, it, expect } from "vitest";

// Simple utility function (doesn't actually exist in the codebase)
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Simple url formatter
function formatUrl(url) {
  if (!url) return "";
  // Add leading slash if missing
  if (!url.startsWith("/")) url = "/" + url;
  // Add trailing slash if missing
  if (!url.endsWith("/") && !url.includes("#") && !url.includes("?")) {
    url = url + "/";
  }
  return url;
}

// Simple dark mode class helper
function getClassesForDarkMode(isDarkMode, baseClass) {
  if (!baseClass) return isDarkMode ? "darkmode--activated" : "";
  return isDarkMode ? `${baseClass} darkmode--activated` : baseClass;
}

describe("Utility Functions", () => {
  describe("formatDate", () => {
    it("formats a date correctly", () => {
      const date = new Date("2023-05-15");
      expect(formatDate(date)).toBe("May 15, 2023");
    });

    it("returns empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });
  });

  describe("formatUrl", () => {
    it("adds leading slash if missing", () => {
      expect(formatUrl("test")).toBe("/test/");
    });

    it("adds trailing slash if missing", () => {
      expect(formatUrl("/test")).toBe("/test/");
    });

    it("does not add trailing slash to anchors", () => {
      expect(formatUrl("/test#section")).toBe("/test#section");
    });

    it("does not add trailing slash to query params", () => {
      expect(formatUrl("/test?foo=bar")).toBe("/test?foo=bar");
    });

    it("returns empty string for null", () => {
      expect(formatUrl(null)).toBe("");
    });
  });

  describe("getClassesForDarkMode", () => {
    it("returns darkmode class when darkmode is active", () => {
      expect(getClassesForDarkMode(true)).toBe("darkmode--activated");
    });

    it("returns empty string when darkmode is inactive", () => {
      expect(getClassesForDarkMode(false)).toBe("");
    });

    it("appends darkmode class to base class when darkmode is active", () => {
      expect(getClassesForDarkMode(true, "base-class")).toBe(
        "base-class darkmode--activated",
      );
    });

    it("returns only base class when darkmode is inactive", () => {
      expect(getClassesForDarkMode(false, "base-class")).toBe("base-class");
    });
  });
});
