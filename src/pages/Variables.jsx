import React, { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Button,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { SnackbarProvider, useSnackbar } from "notistack";
import useVariables from "../hooks/useVariables";
import { storage } from "../utils/storage";

function Variables() {
  const navigate = useNavigate();
  const [variables, setVariables] = useState([]);

  useEffect(() => {
    const storedVars = storage.getVariables();
    setVariables(storedVars);
  }, []);

  const { enqueueSnackbar } = useSnackbar();

  const handleCreateClick = () => {
    if (variables.length < 11) {
      // OK: fewer than 11 variables
      navigate("/create-modify");
    } else {
      // Block navigation + warn the user
      enqueueSnackbar(
        "You already have 11 variables. Delete one before adding another.",
        { variant: "warning" }
      );
    }
  };

  return (
    <Grid container spacing={2} sx={{ padding: 2 }}>
      {/* Table */}
      <Grid item xs={12}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Min Value</TableCell>
              <TableCell>Max Value</TableCell>
              <TableCell>Select Checkbox</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variables.map((v, i) => (
              <TableRow key={i}>
                <TableCell>{v.name || "-"}</TableCell>
                <TableCell>{v.unit || "-"}</TableCell>
                <TableCell>{v.min ?? "-"}</TableCell>
                <TableCell>{v.max ?? "-"}</TableCell>
                <TableCell>
                  <Checkbox defaultChecked={i === 0} />
                </TableCell>
              </TableRow>
            ))}
            {variables.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No variables found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Grid>

      {/* Buttons */}
      <Grid item xs={12}>
        <Grid container spacing={2} justifyContent="flex-start">
          <Grid item>
            <Button variant="contained" onClick={handleCreateClick}>
              Create
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={() => navigate("/create-modify")}
            >
              Modify
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained">Delete</Button>
          </Grid>
          <Grid item>
            <Button variant="contained">Back</Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default Variables;
