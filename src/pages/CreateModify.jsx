import React, { useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  Button,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

const dataTypes = [
  { label: "Decimal (2 float)", value: "decimal" },
  { label: "Integer", value: "integer" },
  { label: "Percentage (2 float)", value: "percentage" },
];

function CreateModify() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar(); // notistack hook

  const [name, setName] = useState("Var1");
  const [dataType, setDataType] = useState("decimal");
  const [unit, setUnit] = useState("kg");
  const [initialValue, setInitialValue] = useState("10");

  const handleSubmit = () => {
    if (name.length > 15 || unit.length > 3) {
      enqueueSnackbar("Name must be ≤ 15 characters, Unit ≤ 3 characters", {
        variant: "warning",
      });
      return;
    }

    const variable = {
      name,
      datatype: dataType,
      unit,
      initial:
        dataType === "integer"
          ? parseInt(initialValue)
          : parseFloat(initialValue),
      min: null,
      max: null,
    };

    const prev = JSON.parse(localStorage.getItem("variables") || "[]");
    const isDuplicate = prev.some((v) => v.name === name);
    if (isDuplicate) {
      enqueueSnackbar("Name must be unique", { variant: "error" });
      return;
    }

    localStorage.setItem("variables", JSON.stringify([...prev, variable]));
    enqueueSnackbar("Variable saved successfully", { variant: "success" });
    navigate("/variables");
  };

  const handleBack = () => {
    navigate("/variables");
  };

  return (
    <>
      <Grid container spacing={2} sx={{ padding: 2 }}>
        {/* Name */}
        <Grid item xs={12} sm={6}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Typography>Name</Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                inputProps={{ maxLength: 15 }}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* DataType */}
        <Grid item xs={12} sm={6}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Typography>DataType</Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
              >
                {dataTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Grid>

        {/* Unit */}
        <Grid item xs={12} sm={6}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Typography>Unit</Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                inputProps={{ maxLength: 3 }}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Initial Value */}
        <Grid item xs={12} sm={6}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Typography>Initial Value</Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                type="number"
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Submit & Back Buttons */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleBack}
              >
                Back
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}

export default CreateModify;
