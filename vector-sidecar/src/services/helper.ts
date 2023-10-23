export const getSafeFileName = (tenant: string, name: string): string => {
  var s = `${tenant}_${name}`;
  var filename = s.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return filename;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
