import MapView from "./MapView/MapView";
import CssBaseline from "@mui/material/CssBaseline";
import Div100vh from "react-div-100vh";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Div100vh>
        <CssBaseline />
        <MapView />
      </Div100vh>
    </LocalizationProvider>
  );
}

export default App;
