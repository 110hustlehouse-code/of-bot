const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  mode: "production",
  entry: {
    "service-worker": "./background/service-worker.ts",
    content: "./content/content.ts",
    popup: "./popup/popup.ts",
    sidebar: "./sidebar/sidebar.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "popup/popup.html", to: "popup.html" },
        { from: "sidebar/sidebar.html", to: "sidebar.html" },
      ],
    }),
  ],
};
