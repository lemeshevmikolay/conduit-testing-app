export default function dateFormatter(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  const part = (number) => String(number).padStart(2, "0");
  return `${part(value.getUTCDate())}.${part(value.getUTCMonth() + 1)}.${value.getUTCFullYear()} ${part(value.getUTCHours())}:${part(value.getUTCMinutes())}:${part(value.getUTCSeconds())}`;
}
