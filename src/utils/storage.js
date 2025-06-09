// utils/storage.js
// =============================================================

import {
  ruleMatches,
  applyBy,
  applyByIndependent,
} from "./ruleEngine";
import { parse } from "date-fns";

// ---------- keys ---------------------------------------------
const VAR_KEY         = "variables";
const VAR_CHANGES_KEY = "variableChanges";
const MASTER_KEY      = "masterTable";

// ---------- helpers ------------------------------------------
const get = (k, fb) => {
  const raw = localStorage.getItem(k);
  if (raw === null) return fb;
  try { return JSON.parse(raw); } catch { return raw; }
};
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ---------- public API ---------------------------------------
export const storage = {
  /* 1️⃣  VARIABLES ------------------------------------------- */
  getVariables        : ()      => get(VAR_KEY, []),
  saveVariables       : (vars)  => set(VAR_KEY, vars),

  /* 2️⃣  VARIABLE-CHANGES ------------------------------------ */
  getVariableChanges  : ()      => get(VAR_CHANGES_KEY, []),
  saveVariableChanges : (arr)   => set(VAR_CHANGES_KEY, arr),

  /* 3️⃣  MASTER TABLE ---------------------------------------- */
  getMasterRows       : ()      => get(MASTER_KEY, []),
  saveMasterRows      : (rows)  => set(MASTER_KEY, rows),

  addColumnToMaster({ name, initial }) {
    let rows = this.getMasterRows();
    if (!rows.length) rows = this._bootstrapSkeleton();

    this.saveMasterRows(rows.map((r) => ({ ...r, [name]: initial })));
  },

  renameColumnInMaster(oldName, newName) {
    if (oldName === newName) return;
    const patched = this.getMasterRows().map((r) => {
      if (!(oldName in r)) return r;
      const { [oldName]: val, ...rest } = r;
      return { ...rest, [newName]: val };
    });
    this.saveMasterRows(patched);
  },

  patchInitialValues(variableName, newInitial, cutOffISO) {
    const cutoff = new Date(cutOffISO);
    this.saveMasterRows(
      this.getMasterRows().map((r) =>
        new Date(r.date) < cutoff ? { ...r, [variableName]: newInitial } : r
      )
    );
  },

  /* 🔄  REBUILD ONE COLUMN FROM ITS CHANGE SHEET -------------- */
  generateMasterTableFromVariableChanges(variableName) {
    let rows = this.getMasterRows();
    if (!rows.length) rows = this._bootstrapSkeleton();

    const variable = this.getVariables().find((v) => v.name === variableName);
    if (!variable) return;
    const initVal = variable.initial;

    // helper – parse "03 Jun 25"
    const dmy = (s) => parse(s, "dd MMM yy", new Date());

    const changes = this
      .getVariableChanges()
      .filter((c) => c.name === variableName)
      .sort((a, b) => dmy(a.startDate) - dmy(b.startDate))
      .map((c) => ({ ...c, start: dmy(c.startDate), end: dmy(c.endDate) }));

    let currentVal = initVal;

    const patched = rows.map((row) => {
      let rowDate = new Date(row.date);
      if (isNaN(rowDate)) rowDate = parse(row.date, "dd-MMM-yy", new Date());

      changes.forEach((ch) => {
        if (
          rowDate >= ch.start &&
          rowDate <= ch.end &&
          ruleMatches(ch, rowDate, ch.start)
        ) {
          currentVal =
            ch.onType === "Independent"
              ? (ch.by ? applyByIndependent(row, ch.by) : Number(ch.setTo))
              : (ch.by ? applyBy(currentVal, ch.by) : Number(ch.setTo));
        }
      });

      return { ...row, [variableName]: Number(currentVal.toFixed(2)) };
    });

    this.saveMasterRows(patched);
  },

  /* ---------- private --------------------------------------- */
  _bootstrapSkeleton() {
    const fromISO = localStorage.getItem("fromDate");
    const toISO   = localStorage.getItem("toDate");
    if (!(fromISO && toISO)) return [];

    const start = new Date(fromISO);
    const end   = new Date(toISO);
    const rows  = [];

    for (let i = 1, cur = new Date(start); cur <= end; i++, cur.setDate(cur.getDate() + 1)) {
      rows.push({
        sno : i,
        date: cur.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"2-digit" }),
        dow : cur.toLocaleDateString("en-GB", { weekday:"short" }),
      });
    }
    return rows;
  },
};
