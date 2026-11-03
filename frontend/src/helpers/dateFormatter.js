export default function dateFormatter(date) {
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
