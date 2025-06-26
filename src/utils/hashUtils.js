export function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0; // Convert to 32-bit integer
  }
  return hash;
}

export function createMenuOptionHash(menuOption) {
  if (!Array.isArray(menuOption)) {
    return simpleHash('');
  }
  
  // 속성 순서를 일관되게 유지하기 위해 정렬 (방어적 처리)
  const sortedOption = menuOption.map(group => ({
    ...group,
    options: (group.options || []).sort((a, b) => {
      const nameA = a.optionName || a.name || '';
      const nameB = b.optionName || b.name || '';
      return nameA.localeCompare(nameB);
    })
  })).sort((a, b) => {
    const groupNameA = a.optionGroupName || a.name || '';
    const groupNameB = b.optionGroupName || b.name || '';
    return groupNameA.localeCompare(groupNameB);
  });
  
  return simpleHash(JSON.stringify(sortedOption));
} 
