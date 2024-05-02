import { AppBar, Chip, Grid, Toolbar, Typography } from "@mui/material";
import * as React from "react";
import SearchBar from "./SearchBar";
import FilterDialog, { Filters } from "./FilterDialog";
import DevDialog from "./DevDialog";

export default function AppHeader({
  markers,
  markerDays,
  allTags,
  focusedMarker,
  focusedCluster,
  onSearch,
  onFilterEdit,
  onFiltersOpen,
  allCities,
  noLocationItems,
}) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [devOpen, setDevOpen] = React.useState(false);

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
        <Toolbar
          sx={{
            alignContent: "center",
            justifyItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Grid
            container
            alignItems="center"
            spacing={focusedMarker || focusedCluster ? 4 : 1}
            style={{ flexWrap: "wrap" }}
          >
            <Grid item xs={12} sm={"auto"} sx={{marginTop: '1em'}}>
              <SearchBar
                markers={markers}
                onSearch={onSearch}
                onFilterClick={(open) => setFiltersOpen(open)}
                focusedCluster={focusedCluster}
                focusedMarker={focusedMarker}
              />
            </Grid>
            {allTags.length > 0 && markerDays.length > 0 && (
              <Grid
                item
                // xs={12}
                sm={false}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "1em",
                }}
              >
                {/* <Chip
                  label={
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Tags
                    </Typography>
                  }
                  sx={{ backgroundColor: "white" }}
                /> */}
                <Filters
                  allCities={allCities}
                  allTags={allTags}
                  allDays={markerDays}
                  onFilterEdit={onFilterEdit}
                />
              </Grid>
            )}
          </Grid>
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
          {/* <SearchBar
            markers={markers}
            onSearch={onSearch}
            onFilterClick={(open) => setFiltersOpen(open)}
            focusedCluster={focusedCluster}
            focusedMarker={focusedMarker}
          /> */}
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => {
                setDevOpen(true);
              }}
            >
              Set Locations
            </button>
          )}
        </Toolbar>
      </AppBar>

      <DevDialog items={noLocationItems} open={devOpen} setOpen={setDevOpen} />
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
