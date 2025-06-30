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
  Paper,
  TableCell,
  TableContainer,
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
import MetricTable from "../components/MetricTable"
import { storage } from "../utils/storage";
import { splitIntoPeriods, formatDMY } from "../utils/dateMath";
import { calcMetric } from "../utils/metrics";

const PERIODS = ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"];
const METRICS = ["Average", "Median", "Mode", "Max", "Min"];


const ClearLocalStorageButton = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClearLocalStorage = () => {
    // Clear all data from localStorage
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Grid item xs={12} sx={{ textAlign: 'center', marginBottom: 2 }}>
      <Button
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
        }}
        variant="outlined"
        size={isSmall ? "small" : "medium"}
        color="error"
        onClick={handleClearLocalStorage}
      >
        Start Fresh
      </Button>
    </Grid>
  );
};

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
  const [selectedIdx, setSelectedIdx] = useState([]);

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
    try {
      const saved = localStorage.getItem("selectedVariableIndex");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedIdx(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Failed to parse selectedVariableIndex from localStorage", e);
      setSelectedIdx([]);
    }
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

    let rows;

    if (selectedIdx.length) {
      // combined row: sum of all chosen variables
      const chosen = selectedIdx.map((i) => variables[i]);
      const vals = periods.map(({ start, end }) => {
        const rowsInRange = master.filter(({ date }) => {
          const d = new Date(date);
          return d >= start && d <= end;
        });
        return chosen.reduce((sum, v) => {
          return (
            sum + calcMetric(rowsInRange.map((r) => r[v.name]), metric)
          );
        }, 0);
      });
      rows = [
        {
          name: "Combined",
          unit: chosen[0]?.unit ?? "",
          vals,
        },
      ];
    } else {
      // no filter → show every variable individually (unchanged behaviour)
      rows = variables.map((v) => {
        const vals = periods.map(({ start, end }) => {
          const rowsInRange = master.filter(({ date }) => {
            const d = new Date(date);
            return d >= start && d <= end;
          });
          return calcMetric(rowsInRange.map((r) => r[v.name]), metric);
        });
        return { ...v, vals };
      });
    }


    return { periods, rows };
  }, [fromDate, toDate, periodicity, metric, variables, selectedIdx]);

  /* ── render ────────────────────────────────────────── */
  return (
    <>
      <ClearLocalStorageButton />
      <Grid container spacing={2} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

        {/* First Row: Date pickers + Submit + Variables */}
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="center" wrap="wrap">
            <Grid item xs={12} sm="auto">
              <Typography variant={isSmall ? "body1" : "h6"}>Date Range</Typography>
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

            {isSubmitted && (
              <Grid item xs={12} sm="auto">
                <Button
                  variant="contained"
                  size={isSmall ? "small" : "medium"}
                  fullWidth={isSmall}
                  onClick={() => navigate("/variables")}
                >
                  Variables
                </Button>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Second Row: Dropdowns */}
        {isSubmitted && (
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1">Include</Typography>
                  <Select
                    multiple                              /* NEW */
                    size="small"
                    fullWidth
                    displayEmpty
                    value={selectedIdx}
                    onChange={(e) => {
                      const val = e.target.value;         // val is an array
                      setSelectedIdx(val);
                      localStorage.setItem("selectedVariableIndex", JSON.stringify(val));
                    }}
                    renderValue={(selected) =>
                      selected.length
                        ? selected.map((i) => variables[i]?.name).join(", ")
                        : <em>Select variable…</em>
                    }
                  >
                    <MenuItem disabled value="">
                      <em>Select variable…</em>
                    </MenuItem>

                    {variables.map((v, i) => (
                      <MenuItem key={i} value={i}>
                        {/* simple checkbox for UX */}
                        <input
                          type="checkbox"
                          checked={selectedIdx.indexOf(i) > -1}
                          readOnly
                          style={{ marginRight: 8 }}
                        />
                        {v.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Stack>
              </Grid>

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
            </Grid>
          </Grid>
        )}

        {/* Third Row: Table */}
        {isSubmitted && (
          <Grid item xs={12}>
            <TableContainer
              component={Paper}
              elevation={3}
              sx={{
                width: '100%',
                overflowX: 'auto',
                borderRadius: 2,
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 2,
                },
              }}
            >
              <MetricTable tableData={tableData} formatDMY={formatDMY} />
            </TableContainer>
          </Grid>
        )}

        {/* Fourth Row: Download Button */}
        {isSubmitted && (
          <Grid item xs={12} sx={{ textAlign: { xs: "center", sm: "right" } }}>
            <Button
              variant="contained"
              size={isSmall ? "small" : "medium"}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Grid>
        )}
      </Grid>
    </>

  );
}
