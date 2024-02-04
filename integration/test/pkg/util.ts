export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formattedDate(unixTime: number) {
  let d = new Date(unixTime),
    yyyy = d.getUTCFullYear(),
    mm = ("0" + (d.getUTCMonth() + 1)).slice(-2),
    dd = ("0" + d.getUTCDate()).slice(-2),
    hh = ("0" + d.getUTCHours()).slice(-2),
    min = ("0" + d.getUTCMinutes()).slice(-2),
    sec = ("0" + d.getUTCSeconds()).slice(-2),
    time;
  time = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + min + ":" + sec + "Z";

  return time;
}

export function isoDate(date: Date) {
  return date.toISOString().replace(/.000Z/g, "Z");
}
