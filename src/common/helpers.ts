export const isNumeric = (data: string): boolean => {
  const num = parseInt(data, 10);
  return isNaN(num) ? false : true;
};
