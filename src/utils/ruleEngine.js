// utils/ruleEngine.js
// =============================================================

import {
  differenceInCalendarDays,
  startOfQuarter,
  startOfYear,
} from "date-fns";

/*─────────────────────── 1. DATE-MATCH HELPERS ───────────────────────*/

export function ruleMatches({ between, betweenValue }, rowDate, changeStart) {
  switch (between) {
    case "Day of Week":
      return (
        rowDate.toLocaleDateString("en-US", { weekday: "long" }) ===
        betweenValue
      );

    case "Date of Month":
      return rowDate.getDate() === Number(betweenValue);

    case "Date of Quarter": {
      const diff =
        differenceInCalendarDays(rowDate, startOfQuarter(rowDate)) + 1;
      return diff === Number(betweenValue);
    }

    case "Date of Year": {
      const diff = differenceInCalendarDays(rowDate, startOfYear(rowDate)) + 1;
      return diff === Number(betweenValue);
    }

    case "Number of days (from start date of change date range)": {
      const interval = Number(betweenValue);
      if (interval <= 0) return false;

      const diff = differenceInCalendarDays(rowDate, changeStart);
      if (diff < 0) return false;
      if (interval === 1) return true; // every day

      // fire on the last day of every N-day block
      return diff % interval === interval - 1;
    }

    default:
      return false;
  }
}

/*──────────────────────── 2. “BY …” OPERATIONS ───────────────────────*/

/** apply an expression relative to PREVIOUS value              */
export function applyBy(prev, byExpr = "", vars = {}) {
  if (!byExpr.trim()) return prev;
  const expr = byExpr.trim();

  /* ── case A: numeric shorthand (+10  -3  *1.1  /2  ^2) ───── */
  const op = expr[0];
  const numPart = Number(expr.slice(1));
  if ("+-*/^".includes(op) && !isNaN(numPart)) {
    switch (op) {
      case "+": return prev + numPart;
      case "-": return prev - numPart;
      case "*": return prev * numPart;
      case "/": return numPart === 0 ? 0 : prev / numPart;
      case "^": return Math.pow(prev, numPart);
    }
  }

  /* ── case B: operator-prefixed full expression  (+5+(A*B)) ── */
  if ("+-*/^".includes(op)) {
    const exprToEval = `prev${expr}`; // e.g.  prev+5+(A*B)
    return _safeEval(exprToEval, { prev, vars });
  }

  /* ── case C: plain full expression that already references prev */
  return _safeEval(expr, { prev, vars });
}

/** compute a value INDEPENDENT of previous value               */
export function applyByIndependent(row, expr = "") {
  const trimmed = expr.trim();
  if (!trimmed) throw new Error("Empty BY expression");

  /* fast path:  col   |  col * 3   |  col + 2  … */
  const m = trimmed.match(
    /^([A-Za-z_]\w*)(?:\s*([+\-*/^])\s*([-+]?\d*\.?\d+))?$/
  );
  if (m) {
    const [, col, op, numStr] = m;
    const base = Number(row[col]);
    if (isNaN(base))
      throw new Error(`Column "${col}" not found in master row`);

    if (!op) return base; // plain “ABC”
    const num = Number(numStr);
    switch (op) {
      case "+": return base + num;
      case "-": return base - num;
      case "*": return base * num;
      case "/": return num === 0 ? 0 : base / num;
      case "^": return Math.pow(base, num);
    }
  }

  /* general path: any full JS-style expression */
  return _safeEval(trimmed, { vars: row });
}

/*──────────────────────── 3.  EVALUATOR CORE ─────────────────────────*/

const trunc = (val, dec = 2) => {
  const f = 10 ** dec;
  return Math.trunc(val * f) / f;
};

/* normalise: very small token mapper (same as before) */
function _normalise(expr) {
  return expr
    .replace(/\bRem\s*\(/gi, "rem(")
    .replace(/\bTrunc\s*\(/gi, "trunc(")
    .replace(/\bRoundup\s*\(/gi, "roundUp(")
    .replace(/\bRounddown\s*\(/gi, "roundDown(")
    .replace(/\bRound\s*\(/gi, "round(")
    .replace(/\bABS\s*\(/gi, "Math.abs(")
    .replace(/\bAND\s*\(/gi, "AND(")
    .replace(/\bOR\s*\(/gi, "OR(")
    .replace(/\bNOT\s*\(/gi, "NOT(")
    .replace(/\bIF\s*\(/gi, "IF(")
    .replace(/<>/g, "!=") // not-equal
    .replace(/([^<>!=])=([^=])/g, "$1==$2") // single '='
    .replace(/\^/g, "**"); // power
}

/* light-weight sandboxed eval (prev + vars only) */
function _safeEval(expr, context = {}) {
  try {
    const src = `"use strict"; return (${_normalise(expr)});`;
    const result = Function(
      "rem", "trunc", "round", "roundUp", "roundDown",
      "AND", "OR", "NOT", "IF", "Math", "prev", "vars",
      `with(vars){ ${src} }`
    )(
      // helper funcs (same as earlier impl)
      (a,b) => (b === 0 ? 0 : a - Math.trunc(a / b) * b),  // rem
      trunc, // trunc
      (v,d=0) => Math.round(v * 10**d) / 10**d,            // round
      (v,d=0) => Math.ceil (v * 10**d) / 10**d,            // roundUp
      (v,d=0) => Math.floor(v * 10**d) / 10**d,            // roundDown
      (...args) => args.every(Boolean),                    // AND
      (...args) => args.some(Boolean),                     // OR
      (x) => !x,                                           // NOT
      (c,t,f) => (c ? t : f),                              // IF
      Math,
      context.prev,
      context.vars || {}
    );
    return trunc(isFinite(result) ? result : 0, 2);
  } catch (e) {
    console.error(`Bad expression "${expr}":`, e.message);
    return context.prev ?? 0;
  }
}
