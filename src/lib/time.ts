export const ZONE = "America/Puerto_Rico";
export function prDate(now: Date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}-${p.find((x) => x.type === "day")!.value}`;
}
export function weekday(date: string) {
  return new Date(date + "T12:00:00-04:00").getUTCDay();
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("es-PR", {
    timeZone: ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date + "T12:00:00-04:00"));
}
export function weekNumber(start: string, date: string) {
  return Math.max(
    1,
    Math.floor(
      (Date.parse(date + "T12:00:00-04:00") -
        Date.parse(start + "T12:00:00-04:00")) /
        604800000,
    ) + 1,
  );
}
export function shiftDate(date: string, days: number) {
  const d = new Date(date + "T12:00:00-04:00");
  d.setUTCDate(d.getUTCDate() + days);
  return prDate(d);
}
export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
