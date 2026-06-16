// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  darkMode: "class", // enable class based dark mode
  theme: {
    extend: {
      colors: {
        light: "#ffffff", // background main
        lighter: "#f3f4f6",
        "text-primary": "#1a1a1a",
        "text-secondary": "#4b5563",
        "text-light": "#6b7280", // improved contrast
        "border-light": "#e5e7eb",
        primary: "#1a1a2e", // keep existing dark primary for header background
        secondary: "#e67e22",
        accent: "#f39c12",
        success: "#27ae60",
        danger: "#e74c3c",
        warning: "#f1c40f",
      },
    },
  },
  plugins: [],
};
