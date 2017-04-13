
export function isStringValidJSON(input) {
  try {
    JSON.parse(input);
  } catch (e) {
    return false;
  }
  return true;
}
