/** 生成编译后的代码 */
let builds = require("./config").getAllBuilds();
console.log(builds);
build(builds);
function build() {
  //let built = 0;
  //const total = builds.length;
  const next = () => {
    // buildEntry(builds[built]).then(() => {
    //   built++;
    //   if (built < total) {
    //     next();
    //   }
    // });
  };
  next();
}
``;
