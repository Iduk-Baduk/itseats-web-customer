export function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

export function createMenuOptionHash(menuOption) {
  // 속성 순서를 일관되게 유지하기 위해 정렬
  const sortedOption = menuOption.map(group => ({
    ...group,
    options: group.options.sort((a, b) => a.optionName.localeCompare(b.optionName))
  })).sort((a, b) => a.optionGroupName.localeCompare(b.optionGroupName));
  
  return simpleHash(JSON.stringify(sortedOption));
} 