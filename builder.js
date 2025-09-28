import fs from "fs/promises";
import { minify } from "terser";

async function build(inputFile, outputFile) {
  const raw = await fs.readFile(inputFile, "utf8");

  // Minify safely
  const min = await minify(raw, {
    compress: true,
    mangle: false,
    output: { comments: false }
  });

  if (min.error) throw min.error;

  const obj = {
    imageDecryptEval: min.code,
    postDecryptEval: null,
    shouldVerifyLinks: false
  };

  await fs.writeFile(outputFile, JSON.stringify(obj, null, 2), "utf8");
  console.log("Wrote", outputFile);
}

build("rco-decode.js", "config.json").catch(console.error);
