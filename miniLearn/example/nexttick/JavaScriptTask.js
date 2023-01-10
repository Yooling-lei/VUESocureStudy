function PromiseTask() {
  const innerPromise = () => {
    return new Promise((resolve) => {
      resolve(1);
    });
  };
  innerPromise().then(() => {
    console.log("Promise Resolved");
  });
}

function TimeoutTask() {
  setTimeout(() => {
    console.log("TimeOut");
  }, 0);
}

function case1() {
  console.log("=====start======");
  TimeoutTask();
  PromiseTask();
  console.log("======end=======");
}
case1();
// #1 执行宏任务,当前语句 log ,
// #2 遇到宏任务,将其放到下一个宏任务队列,
// #3 遇到微任务,将其放到微任务队列
// #4 执行宏任务,当前语句 log
// 当前宏任务执行完毕,开始执行微任务队列 Promise Resolved
// 微任务执行完毕,执行下一个宏任务(由于这里timeout为0,满足Timmer while条件)
// log TimeOut
// 打印结果为
// =====start======
// ======end=======
// Promise Resolved
// TimeOut
function case2() {
  for (let index = 0; index < 10; index++) {
    console.log("=====start======");
    TimeoutTask();
    PromiseTask();
    console.log("======end=======");
  }
}
case2();
// 打印结果为
// =====start======
// ======end=======
// =====start======
// ======end=======
// =====start======
// ======end=======
// Promise Resolved
// Promise Resolved
// Promise Resolved
// Promise Resolved
// TimeOut
// TimeOut
// TimeOut
// TimeOut
