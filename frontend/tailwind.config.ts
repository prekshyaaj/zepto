import type { Config } from "tailwindcss";
import { colors, fontSizes, radii, shadows } from "./lib/tokens";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        "primary-light": colors.primaryLight,
        coral: colors.accentCoral,
        "coral-light": colors.accentCoralLight,
        page: colors.pageBg,
        surface: colors.surface,
        border: colors.border,
        ink: colors.textPrimary,
        muted: colors.textMuted
      },
      borderRadius: {
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg,
        pill: radii.pill
      },
      boxShadow: {
        card: shadows.card,
        floating: shadows.floating
      },
      fontSize: fontSizes,
      fontFamily: {
        sans: ["Nunito", "Avenir Next Rounded", "SF Pro Rounded", "Arial Rounded MT Bold", "Avenir Next", "Inter", "system-ui", "sans-serif"]
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.2s linear infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
