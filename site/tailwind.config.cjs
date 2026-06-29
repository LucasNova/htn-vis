module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"]
      }
    }
  },
  daisyui: {
    themes: [
      {
        htn: {
          primary: "#2563eb",
          secondary: "#0f766e",
          accent: "#c2410c",
          neutral: "#27313f",
          "base-100": "#f7f8fb",
          "base-200": "#eceff4",
          "base-300": "#d8dee9",
          "base-content": "#1f2937",
          info: "#0284c7",
          success: "#15803d",
          warning: "#b45309",
          error: "#b91c1c"
        }
      }
    ]
  },
  plugins: [require("daisyui")]
};
