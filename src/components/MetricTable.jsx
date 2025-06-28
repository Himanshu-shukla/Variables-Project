import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';



const MetricTable = ({ tableData, formatDMY }) => {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <TableContainer
      component={Paper}
      elevation={3}
      sx={{
        width: '100%',
        overflowX: isMdDown ? 'auto' : 'visible',
        borderRadius: 2,
        /* Optional scrollbar polishing */
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.primary.main,
          borderRadius: 2,
        },
      }}
    >
      <Table
        size="small"
        stickyHeader
        sx={{
          minWidth: 600,
          '& thead th': {
            backgroundColor: theme.palette.grey[200],
            fontWeight: 600,
          },
          '& tbody tr:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell />
            {tableData.periods.map((p, i) => (
              <TableCell key={i} align="center">
                {formatDMY(p.end)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {tableData.rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell sx={{ py: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1">{row.name}</Typography>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    ({row.unit})
                  </Typography>
                </Stack>
              </TableCell>

              {row.vals.map((v, j) => (
                <TableCell key={j} align="right">
                  {v}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MetricTable;
