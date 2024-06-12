import { AppBar, Chip, Grid, Toolbar, Typography, styled } from "@mui/material";
import * as React from "react";
import SearchBar from "./SearchBar";
import FilterDialog, { Filters } from "./FilterDialog";
import DevDialog from "./DevDialog";
import ItineraryRouting from "../MiscComponents/ItineraryRouting";

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  placeItems: "center",
  flexWrap: "wrap",

  "@media (max-width: 600px)": {
    placeContent: "center",
  },

  "@media (min-width: 600px)": {
    placeContent: "flex-start",
  },
}));

export default function AppHeader({
  markers,
  markerDays,
  allTags,
  allTimes,
  focusedMarker,
  focusedCluster,
  onSearch,
  onFilterEdit,
  onFiltersOpen,
  allCities,
  noLocationItems,
  setFocusedCluster,
  setFocusedMarker,
  currentFilters,
  suggestingFor,
  timelineActivities,
  mapsService,
  onActivityClick,
  allMarkers,
  onSetSuggested,
  onActivityMouseOver,
  onActivityMouseOut,
  placesService,
  createOverlay,
  geocoderService,
  googleAccount,
  setLoginPopupOpen,
  onSetSuggesting,
  currentDayFilter,
  map,
  directionsRenderer,
  directionsService,
  routing,
  setRouting,
  travelMode,
  setTravelMode,
  disableMarkerFocusing,
  setDisableMarkerFocusing,
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
        id="header-menu"
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
          <StyledGrid
            container
            alignItems="center"
            spacing={focusedMarker || focusedCluster ? 4 : 1}
          >
            <Grid item xs={12} sm={"auto"} sx={{ marginTop: "1em" }}>
              <SearchBar
                markers={markers}
                onSearch={onSearch}
                onFilterClick={(open) => setFiltersOpen(open)}
                focusedCluster={focusedCluster}
                focusedMarker={focusedMarker}
                cities={allCities}
                tags={allTags}
                days={markerDays}
                times={allTimes}
                suggestingFor={suggestingFor}
                currentDayFilter={currentDayFilter}
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
                  "@media (max-width:679px)": {
                    paddingTop: "1em !important",
                    marginTop: "0", // Width for viewports >= 600px
                  },
                  "@media (min-width:680px)": {
                    marginTop: "1em", // Width for viewports >= 900px
                  },
                  "@media (min-width:1200px)": {
                    marginTop: "1em", // Width for viewports >= 1200px
                  },
                }}
              >
                <StyledGrid container spacing={1.5}>
                  <Grid item>
                    <ItineraryRouting
                      map={map}
                      mapsService={mapsService}
                      timelineActivities={timelineActivities}
                      directionsRenderer={directionsRenderer}
                      directionsService={directionsService}
                      currentDayFilter={currentDayFilter}
                      routing={routing}
                      setRouting={setRouting}
                      travelMode={travelMode}
                      setTravelMode={setTravelMode}
                      focusedCluster={focusedCluster}
                      focusedMarker={focusedMarker}
                      markers={markers}
                      disableMarkerFocusing={disableMarkerFocusing}
                      setDisableMarkerFocusing={setDisableMarkerFocusing}
                    />
                  </Grid>
                  <Filters
                    allCities={allCities}
                    allTags={allTags}
                    allDays={markerDays}
                    allTimes={allTimes}
                    onFilterEdit={onFilterEdit}
                    setFocusedCluster={setFocusedCluster}
                    setFocusedMarker={setFocusedMarker}
                    currentFilters={currentFilters}
                    focusedActivity={focusedMarker}
                    focusedCluster={focusedCluster}
                    timelineActivities={timelineActivities}
                    mapsService={mapsService}
                    onActivityClick={onActivityClick}
                    allMarkers={allMarkers}
                    onSetSuggested={onSetSuggested}
                    onActivityMouseOver={onActivityMouseOver}
                    onActivityMouseOut={onActivityMouseOut}
                    placesService={placesService}
                    createOverlay={createOverlay}
                    geocoderService={geocoderService}
                    googleAccount={googleAccount}
                    setLoginPopupOpen={setLoginPopupOpen}
                    onSetSuggesting={onSetSuggesting}
                    suggestingFor={suggestingFor}
                  />
                </StyledGrid>
              </Grid>
            )}
          </StyledGrid>
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
          {/* {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => {
                setDevOpen(true);
              }}
            >
              Set Locations
            </button>
          )} */}
        </Toolbar>
      </AppBar>

      {/* <DevDialog items={noLocationItems} open={devOpen} setOpen={setDevOpen} /> */}
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
