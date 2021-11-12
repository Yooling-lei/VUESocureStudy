/** build的配置文件 */
const path = require("path");
const aliase = require("./alias");

const resolve = (p) => {
  const base = p.split("/")[0];
  if (aliase[base]) {
    return path.resolve(aliase[base], p.slice(base.length + 1));
  } else {
    return path.resolve(__dirname, "../", p);
  }
};
const builds = {
  "web-full-dev": {
    entry: resolve("web/entry-runtime-with-compiler.js"),
    dest: resolve("dist/vue.js"),
    format: "umd",
  },
  "web-runtime-dev": {
    entry: resolve("web/entry-runtime.js"),
    dest: resolve("disk/vue.runtime.js"),
    format:'umd',
    env:'development',
  },
};
/**
 *  entry: resolve("web/entry-runtime-with-compiler.js"),=>
 *  d:\StudyGit\VueSource\src\platforms\web\entry-runtime-with-compiler.js
 *
 */
function genConfig(name) {
  const opts = builds[name];
  const config = {
    input: opts.entry,
    output: {
      file: opts.dest,
      format: opts.format,
    },
  };
  return config;
}

exports.getAllBuilds = () => Object.keys(builds).map(genConfig);
