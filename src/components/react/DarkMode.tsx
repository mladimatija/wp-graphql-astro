import React, { useEffect, useState } from "react";
import Darkmode from "darkmode-js";
import { log } from "../../lib/constants";

// Define global interfaces
declare global {
  interface Window {
    a11yManager?: {
      announce: (message: string, assertive?: boolean) => void;
    };
    darkmode?: any; // To store the dark mode instance globally
    resetDarkMode?: () => void; // Helper function to fix dark mode layer issues
  }
}

type ColorScheme = "dark" | "light" | null;

// Dark mode with accessibility enhancements
export default function DarkMode(): React.ReactElement | null {
  const [, setPrefersColorScheme] = useState<ColorScheme>(null);

  useEffect(() => {
    // Check if user has system dark mode preference
    const prefersColorSchemeQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );
    const systemPrefersDark = prefersColorSchemeQuery.matches;
    setPrefersColorScheme(systemPrefersDark ? "dark" : "light");

    // Create darkmode instance with our theme colors
    const darkmode = new Darkmode({
      label: "🌓",
      backgroundColor: "#192226", // $color-black
      mixColor: "#192226", // $color-black
      buttonColorDark: "#29aae1", // $color-blue
      buttonColorLight: "#29aae1", // $color-blue
      time: "0.3s", // $transition-duration-normal
      saveInCookies: true,
      autoMatchOsTheme: true, // Match system preferences
    });

    // Store darkmode instance globally to help with debugging and direct control
    window.darkmode = darkmode;

    // Also add a helper function to force reset the dark mode layer
    window.resetDarkMode = () => {
      // Check for both possible class names used by the library
      const darkmodeLayer = document.querySelector(
        ".darkmode-layer",
      ) as HTMLElement | null;
      const darkmodeBackground = document.querySelector(
        ".darkmode-background",
      ) as HTMLElement | null;

      const isDarkModeActive = document.body.classList.contains(
        "darkmode--activated",
      );

      log.debug(
        "Reset Dark Mode called, isDarkModeActive: " + isDarkModeActive,
      );

      // Handle .darkmode-layer if it exists
      if (darkmodeLayer) {
        if (!isDarkModeActive) {
          // If dark mode is OFF, hide the layer
          darkmodeLayer.style.opacity = "0";
          darkmodeLayer.style.pointerEvents = "none";
          darkmodeLayer.style.mixBlendMode = "normal";
          // We'll keep visibility and display properties intact
          // as they might interfere with the library's ability to toggle
        } else {
          // If dark mode is ON, make sure it's visible with the right styles
          darkmodeLayer.style.removeProperty("opacity");
          darkmodeLayer.style.removeProperty("pointer-events");
          darkmodeLayer.style.removeProperty("mix-blend-mode");
          darkmodeLayer.style.removeProperty("visibility");
          darkmodeLayer.style.removeProperty("display");
        }
      }

      // Handle .darkmode-background if it exists
      if (darkmodeBackground) {
        if (!isDarkModeActive) {
          // If dark mode is OFF, hide the background
          darkmodeBackground.style.opacity = "0";
          darkmodeBackground.style.pointerEvents = "none";
          darkmodeBackground.style.mixBlendMode = "normal";
          // We'll keep visibility and display properties intact
        } else {
          // If dark mode is ON, reset all properties to allow the library to control them
          darkmodeBackground.style.removeProperty("opacity");
          darkmodeBackground.style.removeProperty("pointer-events");
          darkmodeBackground.style.removeProperty("mix-blend-mode");
          darkmodeBackground.style.removeProperty("visibility");
          darkmodeBackground.style.removeProperty("display");
        }
      }

      // Log the darkmode elements for debugging
      log.dir("Darkmode elements reset", {
        layer: darkmodeLayer,
        background: darkmodeBackground,
        isDarkModeActive,
      });
    };

    // Fix for dark mode layer still showing when inactive
    const fixDarkModeLayer = () => {
      // Find all darkmode related elements
      const darkmodeLayer = document.querySelector(
        ".darkmode-layer",
      ) as HTMLElement | null;
      const darkmodeBackground = document.querySelector(
        ".darkmode-background",
      ) as HTMLElement | null;

      // Check if dark mode is currently active
      const isDarkModeActive = document.body.classList.contains(
        "darkmode--activated",
      );

      log.debug(
        "Fix Dark Mode Layer called, isDarkModeActive: " + isDarkModeActive,
      );

      // Handle .darkmode-layer
      if (darkmodeLayer) {
        if (!isDarkModeActive) {
          // If dark mode is not active, make sure the layer is completely hidden
          darkmodeLayer.style.opacity = "0";
          darkmodeLayer.style.pointerEvents = "none";
          darkmodeLayer.style.mixBlendMode = "normal";
          // We only set these when initializing, not when toggling
          if (!window.darkmode || !window.darkmode.isActivated()) {
            darkmodeLayer.style.visibility = "hidden";
            darkmodeLayer.style.display = "none";
          }
        } else {
          // If dark mode is active, reset all properties to allow the library to control them
          darkmodeLayer.style.removeProperty("opacity");
          darkmodeLayer.style.removeProperty("pointer-events");
          darkmodeLayer.style.removeProperty("mix-blend-mode");
          darkmodeLayer.style.removeProperty("visibility");
          darkmodeLayer.style.removeProperty("display");
        }
      }

      // Handle .darkmode-background
      if (darkmodeBackground) {
        if (!isDarkModeActive) {
          darkmodeBackground.style.opacity = "0";
          darkmodeBackground.style.pointerEvents = "none";
          darkmodeBackground.style.mixBlendMode = "normal";
          // We only set these when initializing, not when toggling
          if (!window.darkmode || !window.darkmode.isActivated()) {
            darkmodeBackground.style.visibility = "hidden";
            darkmodeBackground.style.display = "none";
          }
        } else {
          // If dark mode is active, reset all properties to allow the library to control them
          darkmodeBackground.style.removeProperty("opacity");
          darkmodeBackground.style.removeProperty("pointer-events");
          darkmodeBackground.style.removeProperty("mix-blend-mode");
          darkmodeBackground.style.removeProperty("visibility");
          darkmodeBackground.style.removeProperty("display");
        }
      }
    };

    // Observer to watch for class changes on the body element
    const bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          // Body class has changed, check if darkmode--activated was toggled
          const isDarkMode = document.body.classList.contains(
            "darkmode--activated",
          );
          log.debug("Body class changed, isDarkMode: " + isDarkMode);

          // Apply fix with a slight delay to let the darkmode library finish its operations
          setTimeout(() => {
            fixDarkModeLayer();
          }, 50);

          // Update aria-checked on the toggle button
          const darkmodeToggle = document.querySelector(
            ".darkmode-toggle",
          ) as HTMLElement | null;
          if (darkmodeToggle) {
            darkmodeToggle.setAttribute(
              "aria-checked",
              isDarkMode ? "true" : "false",
            );
          }
        }
      });
    });

    // Start observing the body element for class changes
    bodyObserver.observe(document.body, { attributes: true });

    // If system prefers dark, activate dark mode automatically
    if (systemPrefersDark) {
      // First let's check if it's not already activated
      if (!document.body.classList.contains("darkmode--activated")) {
        darkmode.toggle();
      }

      // Hide the toggle button if system prefers dark
      setTimeout(() => {
        const darkmodeToggle = document.querySelector(
          ".darkmode-toggle",
        ) as HTMLElement | null;
        if (darkmodeToggle) {
          darkmodeToggle.style.display = "none";
        }
      }, 100);
    } else {
      // Only show widget if system is not already in dark mode
      darkmode.showWidget();

      // Apply the fix immediately in case the page loads with dark mode inactive
      fixDarkModeLayer();

      // Find the darkmode toggle button and enhance it for accessibility
      setTimeout(() => {
        const darkmodeToggle = document.querySelector(
          ".darkmode-toggle",
        ) as HTMLElement | null;
        if (darkmodeToggle) {
          // Add proper accessibility attributes
          darkmodeToggle.setAttribute("role", "switch");
          darkmodeToggle.setAttribute(
            "aria-checked",
            document.body.classList.contains("darkmode--activated")
              ? "true"
              : "false",
          );
          darkmodeToggle.setAttribute("aria-label", "Toggle dark mode");
          darkmodeToggle.setAttribute("tabindex", "0");

          // Add keyboard support
          darkmodeToggle.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              darkmodeToggle.click();

              // Update ARIA state and fix dark mode layer
              setTimeout(() => {
                const isDarkMode = document.body.classList.contains(
                  "darkmode--activated",
                );
                darkmodeToggle.setAttribute(
                  "aria-checked",
                  isDarkMode ? "true" : "false",
                );
                fixDarkModeLayer();

                // Announce to screen readers using A11yManager
                if (window.a11yManager) {
                  window.a11yManager.announce(
                    isDarkMode ? "Dark mode enabled" : "Light mode enabled",
                  );
                }
              }, 50);
            }
          });
        }
      }, 100);
    }

    // Listen for changes to system preferences
    const handlePreferenceChange = (e: MediaQueryListEvent) => {
      setPrefersColorScheme(e.matches ? "dark" : "light");
      const darkmodeToggle = document.querySelector(
        ".darkmode-toggle",
      ) as HTMLElement | null;

      if (e.matches) {
        // System switched to dark mode - hide toggle and ensure dark mode is activated
        if (!document.body.classList.contains("darkmode--activated")) {
          darkmode.toggle();
        }
        if (darkmodeToggle) {
          darkmodeToggle.style.display = "none";
        }
      } else {
        // System switched to light mode - show toggle
        if (darkmodeToggle) {
          darkmodeToggle.style.display = "";
        }
        // Fix dark mode layer when system preference changes to light
        fixDarkModeLayer();
      }
    };

    prefersColorSchemeQuery.addEventListener("change", handlePreferenceChange);

    // Cleanup on component unmount
    return () => {
      prefersColorSchemeQuery.removeEventListener(
        "change",
        handlePreferenceChange,
      );
      bodyObserver.disconnect();

      const darkmodeToggle = document.querySelector(".darkmode-toggle");
      if (darkmodeToggle) {
        darkmodeToggle.removeEventListener("keydown", () => {});
      }
    };
  }, []);

  return null;
}
