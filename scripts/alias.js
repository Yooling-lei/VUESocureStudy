const path = require("path");
const resolve = (p) => path.resolve(__dirname, "../", p);

/**获取各模块的完整目录 */
//标识入口的具体未知
module.exports = {
  web: resolve("src/platforms/web"),
};
