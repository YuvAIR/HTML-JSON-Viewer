import {nodeResolve} from "@rollup/plugin-node-resolve"
export default {
  input: "./src/codemirror_integration.js",
  output: {
    file: "./src/codemirror_integration.bundle.js",
    format: "iife"
  },
  plugins: [nodeResolve()]
}