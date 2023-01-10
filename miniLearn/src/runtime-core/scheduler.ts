const queue: any[] = [];

export function queueJobs(job: any) {
  // 假如有100次update,每次job都一样(vnode instance.update function是一样的)
  // 调用100次queueJobs
  // 则执行顺序为
  // 100*mainTask => queue = [job]
  // 100*microTask =>第一次 queue[0].() ,其他99次return
  // mainTask
  queuePush(job);
  // microTask
  queueFlush();
}

function queuePush(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
}

function queueFlush() {
  Promise.resolve().then(() => {
    let job;
    while ((job = queue.shift())) {
      console.log("run job");
      job?.();
    }
  });
}
