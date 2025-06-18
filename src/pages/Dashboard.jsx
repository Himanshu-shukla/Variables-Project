// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Button,
  Select,
  MenuItem,
  Table,
  TableHead,
  Stack,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { storage } from "../utils/storage";
import { splitIntoPeriods, formatDMY } from "../utils/dateMath";
import { calcMetric } from "../utils/metrics";

const PERIODS = ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"];
const METRICS = ["Average", "Median", "Mode", "Max", "Min"];

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { enqueueSnackbar } = useSnackbar();

  /* ── local state ───────────────────────────────────── */
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // defaults required by spec
  const [periodicity, setPeriodicity] = useState("Weekly");
  const [metric, setMetric] = useState("Average");

  const [variables, setVariables] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState("");

  /* ── initialise variables list ─────────────────────── */
  useEffect(() => {
    setVariables(storage.getVariables());
  }, []);

  /* ── restore dates (+ flag) on mount ───────────────── */
  useEffect(() => {
    const fd = localStorage.getItem("fromDate");
    const td = localStorage.getItem("toDate");
    if (fd) setFromDate(new Date(fd));
    if (td) setToDate(new Date(td));
    if (fd && td) setIsSubmitted(true);
  }, []);

  /* ── once vars load, restore chosen variable ───────── */
  useEffect(() => {
    if (!variables.length) return;
    const idx = localStorage.getItem("selectedVariableIndex");
    if (idx !== null) setSelectedIdx(idx);
  }, [variables]);

  /* ── handlers ──────────────────────────────────────── */
  const handleSubmit = () => {
    if (!fromDate || !toDate) {
      enqueueSnackbar("Please pick both dates.", { variant: "warning" });
      return;
    }
    // save and jump to create/modify screen
    localStorage.setItem("fromDate", fromDate.toISOString());
    localStorage.setItem("toDate", toDate.toISOString());
    navigate("/create-modify");
  };

  const handleDownload = () => {
    if (!tableData.periods.length) {
      enqueueSnackbar("Nothing to download.", { variant: "info" });
      return;
    }
    const header = [
      "Variable / Unit",
      ...tableData.periods.map((p) => formatDMY(p.end)),
    ];
    const rows = tableData.rows.map((r) => [
      `${r.name} (${r.unit})`,
      ...r.vals,
    ]);
    const aoa = [header, ...rows];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Summary");
    const blob = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([blob]), `data_${periodicity}_${metric}.xlsx`);
  };

  /* ── build table (memo) ────────────────────────────── */
  const tableData = useMemo(() => {
    if (!fromDate || !toDate) return { periods: [], rows: [] };

    const master = storage.getMasterRows();
    if (!master.length) return { periods: [], rows: [] };

    const periods = splitIntoPeriods(fromDate, toDate, periodicity);
    const varsToUse =
      selectedIdx !== "" ? [variables[+selectedIdx]] : variables;

    const rows = varsToUse.map((v) => {
      const vals = periods.map(({ start, end }) => {
        const rowsInRange = master.filter(({ date }) => {
          const d = new Date(date);
          return d >= start && d <= end;
        });
        return calcMetric(rowsInRange.map((r) => r[v.name]), metric);
      });
      return { ...v, vals };
    });
    return { periods, rows };
  }, [fromDate, toDate, periodicity, metric, variables, selectedIdx]);

  /* ── render ────────────────────────────────────────── */
  return (
    <Grid container spacing={2} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Date pickers + submit */}
      <Grid item xs={12}>
        <Grid container spacing={2} alignItems="center" wrap="wrap">
          <Grid item xs={12} sm="auto">
            <Typography variant={isSmall ? "body1" : "h6"}>
              Date Range
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From"
                value={fromDate}
                disabled={isSubmitted}
                onChange={setFromDate}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="To"
                value={toDate}
                disabled={isSubmitted}
                onChange={setToDate}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm="auto">
            <Button
              variant="contained"
              size={isSmall ? "small" : "medium"}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* Everything else is hidden until submitted */}
      {isSubmitted && (
        <>
          {/* Variables button (optional) */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              size={isSmall ? "small" : "medium"}
              fullWidth={isSmall}
              onClick={() => navigate("/variables")}
            >
              Variables
            </Button>
          </Grid>

          {/* Include dropdown */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1">Include</Typography>
              <Select
                size="small"
                fullWidth
                displayEmpty
                value={selectedIdx}
                onChange={(e) => {
                  setSelectedIdx(e.target.value);
                  localStorage.setItem(
                    "selectedVariableIndex",
                    e.target.value
                  );
                }}
              >
                <MenuItem value="">
                  <em>Select variable…</em>
                </MenuItem>
                {variables.map((v, i) => (
                  <MenuItem key={i} value={i}>
                    {v.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Grid>

          {/* Periodicity + Metric dropdowns */}
          <Grid item xs={12} sm={6} md={4}>
            <Select
              size="small"
              fullWidth
              value={periodicity}
              onChange={(e) => setPeriodicity(e.target.value)}
            >
              {PERIODS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Select
              size="small"
              fullWidth
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              {METRICS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* Summary table */}
          <Grid item xs={12}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  {tableData.periods.map((p, i) => (
                    <TableCell key={i}>{formatDMY(p.end)}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Typography variant="subtitle1">{row.name}</Typography>
                        <Typography variant="subtitle1">{row.unit}</Typography>
                      </Stack>
                    </TableCell>
                    {row.vals.map((v, j) => (
                      <TableCell key={j}>{v}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Grid>

          {/* Download */}
          <Grid item xs={12} sx={{ textAlign: { xs: "center", sm: "right" } }}>
            <Button
              variant="contained"
              size={isSmall ? "small" : "medium"}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
}
