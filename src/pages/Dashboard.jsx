import React, { useState, useEffect, useMemo } from "react";
import {
  Grid,
  TextField,
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { storage } from "../utils/storage";
import { splitIntoPeriods, formatDMY } from "../utils/dateMath";
import { calcMetric } from "../utils/metrics";

const PERIODS = ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"];
const METRICS = ["Average", "Median", "Mode", "Max", "Min"];

function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [periodicity, setPeriodicity] = useState("Monthly");
  const [metric, setMetric] = useState("Average");

  const [variables, setVariables] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState("");

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setVariables(storage.getVariables());
  }, []);

  useEffect(() => {
    const fd = localStorage.getItem("fromDate");
    const td = localStorage.getItem("toDate");

    if (fd) setFromDate(new Date(fd));
    if (td) setToDate(new Date(td));

    // disable pickers if both dates were already chosen
    if (fd && td) setIsSubmitted(true);
  }, []);

  const handleSubmit = () => {
    if (fromDate && toDate) {
      localStorage.setItem("fromDate", fromDate.toISOString());
      localStorage.setItem("toDate", toDate.toISOString());
      setIsSubmitted(true);
    } else {
      alert("Please select both dates before submitting.");
    }
  };

  const handleDownload = () => {
    if (!tableData.periods.length) {
      enqueueSnackbar("Nothing to download – pick a date range first.", {
        variant: "warning",
      });
      return;
    }

    // 1️⃣  header row
    const header = [
      "Variable / Unit",
      ...tableData.periods.map((p) => formatDMY(p.end)),
    ];

    // 2️⃣  data rows
    const rows = tableData.rows.map((r) => [
      `${r.name} (${r.unit})`,
      ...r.vals,
    ]);

    const aoa = [header, ...rows]; // array-of-arrays

    // 3️⃣  build workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Summary");

    // 4️⃣  create blob & save
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileName = `data_${periodicity}_${metric}.xlsx`;
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  };

  const tableData = useMemo(() => {
    if (!fromDate || !toDate) return { periods: [], rows: [] };

    const masterRows = storage.getMasterRows();
    if (!masterRows.length) return { periods: [], rows: [] };

    const periods = splitIntoPeriods(fromDate, toDate, periodicity);

    const rows = variables.map((v) => {
      const vals = periods.map(({ start, end }) => {
        const inRange = masterRows.filter((r) => {
          const d = new Date(r.date); // assumes r.date is ISO or parseable
          return d >= start && d <= end;
        });
        const periodValues = inRange.map((r) => r[v.name]);
        return calcMetric(periodValues, metric);
      });
      return { ...v, vals };
    });
    return { periods, rows };
  }, [fromDate, toDate, periodicity, metric, variables]);

  const handleVariableClick = () => {
    // if (selectedIdx === "") {
    //   enqueueSnackbar("Please choose a variable first.", { variant: "info" });
    //   return;
    // }
    localStorage.setItem("selectedVariableIndex", selectedIdx);
    navigate("/variables");
  };

  return (
    <Grid container spacing={2} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* First Row: Date Range */}
      <Grid item xs={12}>
        <Grid container spacing={2} alignItems="center" flexWrap="wrap">
          <Grid item xs={12} sm="auto">
            <Typography variant={isSmallScreen ? "body1" : "h6"}>
              Date Range
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                disabled={isSubmitted}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="To"
                value={toDate}
                disabled={isSubmitted}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm="auto">
            <Button
              variant="contained"
              size={isSmallScreen ? "small" : "medium"}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* Second Row: Variable Button */}
      <Grid item xs={12}>
        <Button
          variant="contained"
          size={isSmallScreen ? "small" : "medium"}
          fullWidth={isSmallScreen}
          onClick={handleVariableClick}
        >
          Variables
        </Button>
      </Grid>

      {/* Include Dropdown */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1">Include</Typography>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(e.target.value)}
          >
            <MenuItem value="">
              <em>Select variable…</em>
            </MenuItem>
            {(variables || []).map((v, i) => (
              <MenuItem key={i} value={i}>
                {v.name}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Grid>

      {/* Two Dropdowns */}
      <Grid item xs={12} sm={6} md={4}>
        <Select
          fullWidth
          size="small"
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
          fullWidth
          size="small"
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

      {/* Grid-like Structure */}
      <Grid item xs={12}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              {tableData.periods.map((p, idx) => (
                <TableCell key={idx}>{formatDMY(p.end)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="subtitle1">{row.name}</Typography>
                    <Typography variant="caption">{row.unit}</Typography>
                  </Stack>
                </TableCell>
                {row.vals.map((val, j) => (
                  <TableCell key={j}>{val}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Grid>

      {/* Download Button */}
      <Grid item xs={12} sx={{ textAlign: { xs: "center", sm: "right" } }}>
        <Button
          variant="contained"
          size={isSmallScreen ? "small" : "medium"}
          onClick={handleDownload}
        >
          Download
        </Button>
      </Grid>
    </Grid>
  );
}

export default Dashboard;
