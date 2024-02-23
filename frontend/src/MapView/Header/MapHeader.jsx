import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import * as React from "react";
import { isTouchDevice } from "../../Util/Utils";
import MultipleSelectChip from "../../Util/MultipleSelect";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchBar from "./SearchBar";
import FilterDialog from "./FilterDialog";

export default function AppHeader({
  markers,
  markerDays,
  allTags,
  focusedMarker,
  focusedCluster,
  onSearch,
  onFilterEdit,
  onFiltersOpen,
}) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    if (onFiltersOpen) {
      onFiltersOpen(filtersOpen);
    }
  }, [filtersOpen]);
  
  // return isTouchDevice() ? (
  return (
    <>
      <AppBar
        position="absolute"
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0)",
          boxShadow: "none",
          zIndex: 99999
        }}
      >
        <Toolbar>
          {/* <Typography
          variant="h4"
          component="div"
          noWrap
          sx={{
            flexGrow: 1,
            fontFamily: "'Indie Flower', cursive",
            display: { xs: "none", sm: "block" },
          }}
        >
          Itinerary Map
        </Typography> */}
          <SearchBar
            markers={markers}
            onSearch={onSearch}
            onFilterClick={(open) => setFiltersOpen(open)}
          />
        </Toolbar>
      </AppBar>
      <FilterDialog
        open={filtersOpen}
        setOpen={setFiltersOpen}
        allTags={allTags}
        onFilterEdit={onFilterEdit}
        allDays={markerDays}
      />
    </>
  );
}
