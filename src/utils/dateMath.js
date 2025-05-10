// utils/dateMath.js
// ------------------------------------------------------------

export function splitIntoPeriods(from, to, periodicity) {
    const periods = [];
    const cur = new Date(from);
    const end = new Date(to);
  
    const push = (endDate) =>
      periods.push({ start: new Date(cur), end: new Date(endDate) });
  
    while (cur <= end) {
      const d = new Date(cur);
  
      switch (periodicity) {
        case "Daily":
          push(d);
          cur.setDate(cur.getDate() + 1);
          break;
  
        case "Weekly":
          // advance to Saturday (ISO weekday 6) or end
          const diff = 6 - d.getDay();
          d.setDate(d.getDate() + diff);
          push(d > end ? end : d);
          cur.setDate(cur.getDate() + diff + 1);
          break;
  
        case "Monthly":
          d.setMonth(d.getMonth() + 1, 0); // last day of month
          push(d > end ? end : d);
          cur.setDate(d.getDate() + 1);
          break;
  
        case "Quarterly":
          const month = Math.floor(d.getMonth() / 3) * 3 + 3; // 3,6,9,12
          d.setMonth(month, 0);
          push(d > end ? end : d);
          cur.setDate(d.getDate() + 1);
          break;
  
        case "Annual":
          d.setMonth(12, 0); // 31-Dec
          push(d > end ? end : d);
          cur.setDate(d.getDate() + 1);
          break;
      }
    }
    return periods;
  }
  
  export const formatDMY = (date) =>
    date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  