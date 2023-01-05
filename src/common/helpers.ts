export const is_numeric = (data: string): boolean => {
  const num = parseInt(data);
  return isNaN(num) ? false : true;
};
