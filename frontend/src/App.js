import MapView from "./MapView/MapView";
import CssBaseline from "@mui/material/CssBaseline";
import Div100vh from "react-div-100vh";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StackNavigationProvider } from "./Util/StackNavigation";

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Div100vh>
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            height: "100%",
            width: "100%",
          }}
        >
          <CssBaseline />
          <StackNavigationProvider>
            <MapView />
          </StackNavigationProvider>
        </div>
      </Div100vh>
    </LocalizationProvider>
  );
}

export default App;
