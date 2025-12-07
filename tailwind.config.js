module.exports = {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['"Roboto Flex"', "sans-serif"],
      },
      keyframes: {
        popup: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        popdown: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
      },
      animation: {
        popup: "popup 0.15s ease-out",
        popdown: "popdown 0.12s ease-in forwards",
      },
    },
  },
  plugins: [],
};
