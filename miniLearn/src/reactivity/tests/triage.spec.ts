const TriageStage = {
  COULD_ADD: 1, // 可以新增  0
  COULD_UPDATE: 1 << 1, // 可以更新 0
  COULD_TEMP: 1 << 2, //新增暂存
  COULD_UPDATE_TEMP: 1 << 3, //更新暂存
  BACKTRIAGE: 1 << 4, // 补录
  RETRIAGE: 1 << 5, //二次分诊
};

function normalTriage() {
  return TriageStage.COULD_ADD | TriageStage.COULD_TEMP;
}

it("normal triage", () => {
  const stage = normalTriage();
  expect(stage & TriageStage.COULD_ADD).toBeGreaterThan(0);
  expect(stage & TriageStage.COULD_TEMP).toBeGreaterThan(0);
  expect(stage & TriageStage.COULD_UPDATE).toBeLessThan(1);
  expect(stage & TriageStage.COULD_UPDATE_TEMP).toBeLessThan(1);
});
