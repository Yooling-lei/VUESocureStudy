export const convertTriageLevel = (
  level,
  convertToText = false
  //   highestLevel = 5
) => {
  const levelMap = {
    0: "死亡",
    1: "一级",
    2: "二级",
    3: "三级",
    4: "四级",
    5: "五级",
  };
  const unknow = convertToText ? "未知" : "未";
  const numberLevel = Number(level);
  const levelIsNumber = level !== "" && !isNaN(numberLevel);
  for (const key in levelMap) {
    const value = levelMap[key];
    if (
      (levelIsNumber && Number(key) === numberLevel) ||
      (!levelIsNumber && value === level)
    )
      return convertToText ? value : Number(key);
  }
  return unknow;
};
