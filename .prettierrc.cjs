/** @type {import("prettier").Options} */
module.exports = {
  endOfLine: "auto",
  experimentalOperatorPosition: "start",
  importOrder: ["^hextools-", "^[./]"],
  importOrderSeparation: true,
  plugins: [
    require.resolve("prettier-plugin-packagejson"),
    require.resolve("@trivago/prettier-plugin-sort-imports"),
  ],
};
