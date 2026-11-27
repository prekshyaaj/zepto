export const colors = {
  primary: "#3D0B63",
  primaryLight: "#F3EBF9",
  accentCoral: "#FF8A6B",
  accentCoralLight: "#FFF0EB",
  pageBg: "#F8F7FA",
  surface: "#FFFFFF",
  border: "#E0DCE8",
  textPrimary: "#3A3344",
  textMuted: "#9E97A8"
} as const;

export const radii = {
  sm: "8px",
  md: "16px",
  lg: "24px",
  pill: "9999px"
} as const;

export const shadows = {
  card: "0 2px 12px rgba(61,11,99,0.07)",
  floating: "0 4px 20px rgba(61,11,99,0.12)"
} as const;

export const fontSizes = {
  xs: "11px",
  sm: "13px",
  base: "15px",
  md: "16px",
  lg: "18px",
  xl: "22px",
  "2xl": "28px"
} as const;

export const ui = {
  page: "min-h-screen bg-page text-ink",
  shell: "mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-4",
  card: "rounded-md border border-border bg-surface shadow-card",
  floating: "rounded-lg border border-border bg-surface shadow-floating",
  pill: "rounded-pill border border-border bg-surface",
  input: "rounded-md border border-border bg-surface text-base text-ink placeholder:text-muted outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-light",
  primaryButton: "rounded-md bg-primary text-surface shadow-floating transition",
  coralButton: "rounded-md bg-coral text-surface shadow-card transition",
  ghostButton: "rounded-md bg-primary-light text-primary transition",
  muted: "text-muted",
  title: "text-xl font-extrabold tracking-normal text-ink",
  sectionTitle: "text-lg font-extrabold tracking-normal text-ink"
} as const;

export const motion = {
  page: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } },
  card: { whileHover: { y: -3 }, whileTap: { scale: 0.97 }, transition: { duration: 0.2 } },
  button: { whileTap: { scale: 0.95 }, transition: { duration: 0.18 } }
} as const;
