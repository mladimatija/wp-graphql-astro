import React, {useEffect, useState} from 'react';
import Darkmode from 'darkmode-js';

// Define window.a11yManager interface
declare global {
    interface Window {
        a11yManager?: {
            announce: (message: string, assertive?: boolean) => void;
        };
    }
}

type ColorScheme = 'dark' | 'light' | null;

// Dark mode with accessibility enhancements
export default function DarkMode(): React.ReactElement | null {
    const [, setPrefersColorScheme] = useState<ColorScheme>(null);

    useEffect(() => {
        // Check if user has system dark mode preference
        const prefersColorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const systemPrefersDark = prefersColorSchemeQuery.matches;
        setPrefersColorScheme(systemPrefersDark ? 'dark' : 'light');

        // Create darkmode instance with our theme colors
        const darkmode = new Darkmode({
            label: "🌓",
            backgroundColor: "#192226", // $color-black
            mixColor: "#192226",        // $color-black
            buttonColorDark: "#29aae1", // $color-blue
            buttonColorLight: "#29aae1", // $color-blue
            time: "0.3s",               // $transition-duration-normal
            saveInCookies: true,
            autoMatchOsTheme: true      // Match system preferences
        });

        // If system prefers dark, activate dark mode automatically
        if (systemPrefersDark) {
            // First let's check if it's not already activated
            if (!document.body.classList.contains('darkmode--activated')) {
                darkmode.toggle();
            }

            // Hide the toggle button if system prefers dark
            setTimeout(() => {
                const darkmodeToggle = document.querySelector('.darkmode-toggle') as HTMLElement | null;
                if (darkmodeToggle) {
                    darkmodeToggle.style.display = 'none';
                }
            }, 100);
        } else {
            // Only show widget if system is not already in dark mode
            darkmode.showWidget();

            // Find the darkmode toggle button and enhance it for accessibility
            setTimeout(() => {
                const darkmodeToggle = document.querySelector('.darkmode-toggle') as HTMLElement | null;
                if (darkmodeToggle) {
                    // Add proper accessibility attributes
                    darkmodeToggle.setAttribute('role', 'switch');
                    darkmodeToggle.setAttribute('aria-checked', document.body.classList.contains('darkmode--activated') ? 'true' : 'false');
                    darkmodeToggle.setAttribute('aria-label', 'Toggle dark mode');
                    darkmodeToggle.setAttribute('tabindex', '0');

                    // Add keyboard support
                    darkmodeToggle.addEventListener('keydown', (e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            darkmodeToggle.click();

                            // Update ARIA state
                            setTimeout(() => {
                                const isDarkMode = document.body.classList.contains('darkmode--activated');
                                darkmodeToggle.setAttribute('aria-checked', isDarkMode ? 'true' : 'false');

                                // Announce to screen readers using A11yManager
                                if (window.a11yManager) {
                                    window.a11yManager.announce(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled');
                                }
                            }, 50);
                        }
                    });
                }
            }, 100);
        }

        // Listen for changes to system preferences
        const handlePreferenceChange = (e: MediaQueryListEvent) => {
            setPrefersColorScheme(e.matches ? 'dark' : 'light');
            const darkmodeToggle = document.querySelector('.darkmode-toggle') as HTMLElement | null;

            if (e.matches) {
                // System switched to dark mode - hide toggle and ensure dark mode is activated
                if (!document.body.classList.contains('darkmode--activated')) {
                    darkmode.toggle();
                }
                if (darkmodeToggle) {
                    darkmodeToggle.style.display = 'none';
                }
            } else {
                // System switched to light mode - show toggle
                if (darkmodeToggle) {
                    darkmodeToggle.style.display = '';
                }
            }
        };

        prefersColorSchemeQuery.addEventListener('change', handlePreferenceChange);

        // Cleanup on component unmount
        return () => {
            prefersColorSchemeQuery.removeEventListener('change', handlePreferenceChange);
            const darkmodeToggle = document.querySelector('.darkmode-toggle');
            if (darkmodeToggle) {
                darkmodeToggle.removeEventListener('keydown', () => {
                });
            }
        };
    }, []);

    return null;
}