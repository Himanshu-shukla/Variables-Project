import React, { useState } from "react";
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';


import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (fromDate && toDate) {
      localStorage.setItem("fromDate", fromDate.toISOString());
      localStorage.setItem("toDate", toDate.toISOString());
      setIsSubmitted(true);
    } else {
      alert("Please select both dates before submitting.");
    }
  };

  const handleVariableClick = () => {
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
          Variable
        </Button>
      </Grid>

      {/* Include Dropdown */}
      <Grid item xs={12}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm="auto">
            <Typography variant={isSmallScreen ? "body2" : "body1"}>
              Include
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Select fullWidth defaultValue="" size="small">
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Grid>

      {/* Two Dropdowns */}
      <Grid item xs={12} sm={6} md={4}>
        <Select fullWidth defaultValue="Daily" size="small">
          {["Daily", "Weekly", "Monthly", "Quarterly", "Annual"].map(
            (option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            )
          )}
        </Select>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Select fullWidth defaultValue="Average" size="small">
          {["Average", "Median", "Mode", "Max", "Min"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Grid>

      {/* Grid-like Structure */}
      <Grid item xs={12}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell> {/* Empty cell for alignment */}
              <TableCell>Date Range 1</TableCell>
              <TableCell>Date Range 2</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Typography variant="subtitle1">Variable 1</Typography>
                  <Typography variant="caption">Unit</Typography>
                </Stack>
              </TableCell>
              <TableCell>Value 1</TableCell>
              <TableCell>Value 2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Value 3</TableCell>
              <TableCell>Value 4</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Grid>

      {/* Download Button */}
      <Grid item xs={12} sx={{ textAlign: { xs: "center", sm: "right" } }}>
        <Button variant="contained" size={isSmallScreen ? "small" : "medium"}>
          Download
        </Button>
      </Grid>
    </Grid>
  );
}

export default Dashboard;
