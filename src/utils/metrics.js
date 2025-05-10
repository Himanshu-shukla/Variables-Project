// utils/metrics.js
// ------------------------------------------------------------
export function calcMetric(values, metric) {
    if (!values.length) return "";
    const nums = values.filter((x) => typeof x === "number" && !isNaN(x));
    if (!nums.length) return "";
  
    switch (metric) {
      case "Average":
        return average(nums);
      case "Median":
        return median(nums);
      case "Mode":
        return mode(nums);
      case "Max":
        return Math.max(...nums);
      case "Min":
        return Math.min(...nums);
      default:
        return "";
    }
  }
  
  const average = (arr) => +(arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(2);
  
  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : average([s[mid - 1], s[mid]]);
  };
  
  const mode = (arr) => {
    const freq = {};
    arr.forEach((n) => (freq[n] = (freq[n] || 0) + 1));
    let max = 0,
      mode = arr[0];
    for (const n of arr) {
      if (freq[n] > max) {
        max = freq[n];
        mode = n;
      }
    }
    return mode;
  };
  