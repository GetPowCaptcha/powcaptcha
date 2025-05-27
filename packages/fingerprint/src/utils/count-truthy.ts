function countThruly(values: boolean[]): number {
  return values.reduce((count, value) => count + (value ? 1 : 0), 0);
}
export default countThruly;
