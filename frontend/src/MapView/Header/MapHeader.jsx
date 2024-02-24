import { AppBar, Toolbar } from "@mui/material";
import * as React from "react";
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
          zIndex: 99999,
          padding: "0 !important",
        }}
      >
        <Toolbar sx={{padding: "0 !important"}}>
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
            focusedCluster={focusedCluster}
            focusedMarker={focusedMarker}
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
