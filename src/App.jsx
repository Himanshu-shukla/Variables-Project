import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard';
import Variables from './pages/Variables';
import CreateModify from './pages/CreateModify';

const theme = createTheme();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/variables" element={<Variables />} />
          <Route path="/create-modify" element={<CreateModify />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}