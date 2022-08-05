const obj = {
  test: {
    test: {
      foo: 1,
    },
    test2: {
      gg: "222",
    },
  },
};

function loopFunc(paraObj) {
  for (const key in paraObj) {
    const current = paraObj[key];
    console.log("print====>", current);
    if (typeof current === "object") {
      loopFunc(current);
    }
  }
}
loopFunc(obj);
