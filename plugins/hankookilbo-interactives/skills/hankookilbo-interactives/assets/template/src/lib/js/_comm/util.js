/** 1234567 → "1,234,567" */
export function addComma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 배열을 size 단위로 자름 */
export function chunkArray(arr, size) {
  const groups = [];
  for (let i = 0; i < arr.length; i += size) {
    groups.push(arr.slice(i, i + size));
  }
  return groups;
}
