import {
  Add,
  Delete,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Snackbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  createMarkersFromPOIs,
  findNearbyMarkers,
  findPlacesOfInterest,
} from "../../Util/Utils";
import InputSlider from "../../Util/InputSlider";
import { ChipPopperMenu } from "../../Util/MultipleSelect";

const suggestLocationDefaultTypes = [
  "amusement_park",
  "aquarium",
  "art_gallery",
  "bakery",
  "bar",
  "cafe",
  "casino",
  "department_store",
  "museum",
  "night_club",
  "park",
  "restaurant",
  "shopping_mall",
  "spa",
  "stadium",
  "tourist_attraction",
  "zoo",
];

export function ItinerarySuggestions({
  timelineActivities,
  focusedActivity,
  focusedCluster,
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
}) {
  // const [suggesting, setSuggesting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [suggestRadius, setSuggestRadius] = useState(1000);
  const [suggestedActivities, setSuggestedActivities] = useState([]);
  const [suggestedTypes, setSuggestedTypes] = useState(
    suggestLocationDefaultTypes
  );
  const [filterNonLatin, setFilterNonLatin] = useState(true);
  // const [settingsDirty, setSettingsDirty] = useState(false);
  const [fetchingNearby, setFetchingNearby] = useState(false);
  const [usingGooglePOIs, setUsingGooglePOIs] = useState(false);
  const [noLocationsNearby, setNoLocationsNearby] = useState(false);

  function suggestNearby() {
    setFetchingNearby(true);
    let nearbyMarkers = [];
    const target =
      timelineActivities && timelineActivities.length > 0
        ? timelineActivities
        : focusedCluster
        ? focusedCluster.markers
        : focusedActivity
        ? [focusedActivity]
        : [];

    nearbyMarkers = findNearbyMarkers(
      target,
      allMarkers,
      mapsService,
      suggestRadius
    );

    if (timelineActivities && timelineActivities.length > 0)
      nearbyMarkers = nearbyMarkers.filter((m) => !m.date);

    findPlacesOfInterest(
      target,
      allMarkers,
      placesService,
      async (nearby) => {
        const markers = await createMarkersFromPOIs(
          nearby,
          mapsService,
          geocoderService,
          createOverlay,
          onActivityMouseOver,
          onActivityMouseOut,
          onActivityClick
        );
        markers.sort((a, b) => {
          if (a.rating === undefined) return 1; // Move a to the end if it lacks ratings
          if (b.rating === undefined) return -1; // Move b to the end if it lacks ratings
          return b.rating - a.rating;
        });

        const final = [...nearbyMarkers, ...markers];
        if (final.length === 0) {
          setNoLocationsNearby(true);
        } else {
          setNoLocationsNearby(false);
        }

        setSuggestedActivities(final);
      },
      suggestRadius,
      suggestedTypes,
      timelineActivities && timelineActivities.length > 0,
      filterNonLatin,
      googleAccount
    );

    // setSuggestedActivities(nearbyMarkers);
  }

  useEffect(() => {
    // if (suggesting) {
    //   if (suggestedActivities.length === 0 && !noLocationsNearby)
    //     suggestNearby();
    //   else setSettingsDirty(true);
    // }
  }, [suggestRadius, suggestedTypes, filterNonLatin, usingGooglePOIs]);

  // useEffect(() => {
  //   if (!suggesting) {
  //     setSuggestedActivities([]);
  //     // setSuggestRadius(1000);
  //     setFetchingNearby(false);
  //     // setSettingsDirty(false);
  //     setSettingsOpen(false);
  //     setNoLocationsNearby(false);
  //   }

  //   // if (routing) {
  //   //   setRouting(false);
  //   // }

  //   if (suggesting) {
  //     suggestNearby();
  //   }

  //   if (onSetSuggesting) onSetSuggesting(suggesting);
  // }, [suggesting]);

  useEffect(() => {
    onSetSuggested(suggestedActivities);
    setFetchingNearby(false);
  }, [suggestedActivities]);

  useEffect(() => {
    if (noLocationsNearby) {
      setFetchingNearby(false);
    } 
    
    // else {
    //   setSuggesting(false);
    // }
  }, [noLocationsNearby]);

  useEffect(() => {
    if (fetchingNearby) {
      // setSettingsDirty(false);
      setSettingsOpen(false);
    }
  }, [fetchingNearby]);

  return (
    <>
      <ChipPopperMenu
        label="Suggest Nearby"
        deleteIcon={
          settingsOpen ? (
            <KeyboardArrowUp
              sx={{
                color: "white !important",
                ">*": {
                  color: "white",
                },
              }}
            />
          ) : (
            <KeyboardArrowDown
              sx={{
                color: "white !important",
                ">*": {
                  color: "white",
                },
              }}
            />
          )
        }
        openOnDelete={true}
        onToggledOpen={(open) => setSettingsOpen(open)}
        open={settingsOpen}
        chipSx={{
          backgroundColor: "#4285F4",
          color: "white",
          ":hover": { backgroundColor: "#4285F4 !important" },
          ":focus": { backgroundColor: "#4285F4 !important" },
        }}
        onClick={() => {
          setSettingsOpen(false);
          suggestNearby();
        }}
      >
        {/* <Accordion
            expanded={settingsOpen}
            onChange={(_, expanded) => setSettingsOpen(expanded)}
            sx={{
              background: "none",
              boxShadow: "none",
              "& .MuiAccordionSummary-content": {
                justifyContent: "center",
              },
              "& .MuiAccordionDetails-root": {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pt: 0,
                pb: 0,
                mb: 1,
              },
            }}
          > */}
        {/* <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography
                variant="body1"
                sx={{ fontFamily: "'Fredoka', sans-serif", ml: "24px" }}
              >
                Settings
              </Typography>
            </AccordionSummary> */}
        {/* <AccordionDetails> */}
        <Box
          sx={{
            display: "flex",
            placeContent: "center",
            placeItems: "center",
            flexFlow: "column",
            "> *": {
              textAlign: "center",
            },
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Fredoka', sans-serif",
              fontStyle: "italic",
              pb: 0,
              mb: 0,
            }}
            gutterBottom={false}
          >
            Settings
          </Typography>
          <InputSlider
            value={suggestRadius}
            label="Search Radius (meters)"
            min={100}
            max={10000}
            onValueChanged={(value) => setSuggestRadius(value)}
          />
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Checkbox
                checked={!googleAccount ? false : usingGooglePOIs}
                onChange={(_, checked) => {
                  if (!googleAccount) {
                    setLoginPopupOpen(true);

                    return;
                  }
                  setUsingGooglePOIs(checked);
                }}
              />
            }
            labelPlacement="start"
            label={
              <Typography
                variant="body1"
                sx={{ fontFamily: "'Fredoka', sans-serif", m: 0, p: 1 }}
              >
                Search Google Places
              </Typography>
            }
          />
          {usingGooglePOIs && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterNonLatin}
                    onChange={(_, checked) => setFilterNonLatin(checked)}
                  />
                }
                labelPlacement="start"
                label={
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: "'Fredoka', sans-serif",
                      mb: 0,
                    }}
                  >
                    Filter Non-English Locations
                  </Typography>
                }
              />
              <Typography
                variant="body1"
                sx={{ fontFamily: "'Fredoka', sans-serif", mb: 1 }}
              >
                Suggested Types
              </Typography>
              <Grid
                container
                spacing={1}
                sx={{ placeContent: "center", placeItems: "center" }}
              >
                {suggestLocationDefaultTypes.map((type, i) => (
                  <Grid item key={"suggested-type-" + i}>
                    <Chip
                      variant="filled"
                      sx={{
                        backgroundColor: "white",
                        opacity: suggestedTypes.includes(type) ? 1 : 0.65,
                        border: "1px solid gray",
                      }}
                      key={"suggested-type-filter-chip-" + i}
                      label={type.replace("_", " ")}
                      onDelete={() => {
                        if (suggestedTypes.includes(type))
                          setSuggestedTypes(
                            suggestedTypes.filter((t) => t !== type)
                          );
                        else setSuggestedTypes([...suggestedTypes, type]);
                      }}
                      deleteIcon={
                        suggestedTypes.includes(type) ? (
                          <Delete />
                        ) : (
                          <Add
                            sx={{
                              opacity: "1 !important",
                              color: "black",
                            }}
                          />
                        )
                      }
                    />
                  </Grid>
                ))}
                {/* {suggestedTypes.length !==
                  suggestLocationDefaultTypes.length && (
                  <Grid item>
                    <ChipSelectMenu
                      multiple={false}
                      label={"Add Type"}
                      icon={<Add />}
                      options={suggestLocationDefaultTypes.filter(
                        (type) => !suggestedTypes.includes(type)
                      )}
                      onChange={(selected) => {
                        setSuggestedTypes([...suggestedTypes, selected]);
                      }}
                    />
                  </Grid>
                )} */}
              </Grid>
            </>
          )}
          {/* </AccordionDetails>
          </Accordion> */}
        </Box>
      </ChipPopperMenu>
      {
        // (!timelineActivities || !timelineActivities.length === 0) &&
        // <Box
        //   sx={{
        //     display: "flex",
        //     flexFlow: "column",
        //     placeItems: "center",
        //     p: 2,
        //     flex: "0 1 auto",
        //   }}
        // >
        //   <Typography
        //     variant="h5"
        //     sx={{
        //       fontFamily: "'Fredoka', sans-serif",
        //       display: "inline",
        //       userSelect: "none",
        //       msUserSelect: "none",
        //       MozUserSelect: "none",
        //       WebkitUserSelect: "none",
        //       WebkitTouchCallout: "none",
        //       textAlign: "center",
        //     }}
        //   >
        //     Nearby Activity Suggestions
        //     {/* <IconButton
        //           size="small"
        //           onClick={() => setSuggesting(false)}
        //           sx={{
        //             position: "absolute",
        //             p: 0,
        //             ml: 1,
        //             ">.MuiSvgIcon-root": {
        //               fontSize: "1em",
        //             },
        //           }}
        //         >
        //           <Cancel />
        //         </IconButton> */}
        //   </Typography>
        // <Accordion
        //   expanded={settingsOpen}
        //   onChange={(_, expanded) => setSettingsOpen(expanded)}
        //   sx={{
        //     background: "none",
        //     boxShadow: "none",
        //     "& .MuiAccordionSummary-content": {
        //       justifyContent: "center",
        //     },
        //     "& .MuiAccordionDetails-root": {
        //       display: "flex",
        //       flexDirection: "column",
        //       alignItems: "center",
        //       pt: 0,
        //       pb: 0,
        //       mb: 1,
        //     },
        //   }}
        // >
        //   <AccordionSummary expandIcon={<ExpandMore />}>
        //     <Typography
        //       variant="body1"
        //       sx={{ fontFamily: "'Fredoka', sans-serif", ml: "24px" }}
        //     >
        //       Settings
        //     </Typography>
        //   </AccordionSummary>
        //   <AccordionDetails>
        //     <InputSlider
        //       value={suggestRadius}
        //       label="Search Radius (meters)"
        //       min={100}
        //       max={10000}
        //       onValueChanged={(value) => setSuggestRadius(value)}
        //     />
        //     <FormControlLabel
        //       control={
        //         <Checkbox
        //           checked={!googleAccount ? false : usingGooglePOIs}
        //           onChange={(_, checked) => {
        //             if (!googleAccount) {
        //               setLoginPopupOpen(true);
        //               return;
        //             }
        //             setUsingGooglePOIs(checked);
        //           }}
        //         />
        //       }
        //       labelPlacement="start"
        //       label={
        //         <Typography
        //           variant="body1"
        //           sx={{ fontFamily: "'Fredoka', sans-serif", mb: 0 }}
        //         >
        //           Search Google Places
        //         </Typography>
        //       }
        //     />
        //     {usingGooglePOIs && (
        //       <>
        //         <FormControlLabel
        //           control={
        //             <Checkbox
        //               checked={filterNonLatin}
        //               onChange={(_, checked) => setFilterNonLatin(checked)}
        //             />
        //           }
        //           labelPlacement="start"
        //           label={
        //             <Typography
        //               variant="body1"
        //               sx={{
        //                 fontFamily: "'Fredoka', sans-serif",
        //                 mb: 0,
        //               }}
        //             >
        //               Filter Non-English Locations
        //             </Typography>
        //           }
        //         />
        //         <Typography
        //           variant="body1"
        //           sx={{ fontFamily: "'Fredoka', sans-serif", mb: 1 }}
        //         >
        //           Suggested Types
        //         </Typography>
        //         <Grid
        //           container
        //           spacing={1}
        //           sx={{ placeContent: "center", placeItems: "center" }}
        //         >
        //           {suggestLocationDefaultTypes.map((type, i) => (
        //             <Grid item key={"suggested-type-" + i}>
        //               <Chip
        //                 variant="filled"
        //                 sx={{
        //                   backgroundColor: "white",
        //                   opacity: suggestedTypes.includes(type) ? 1 : 0.65,
        //                   border: "1px solid gray",
        //                 }}
        //                 key={"suggested-type-filter-chip-" + i}
        //                 label={type.replace("_", " ")}
        //                 onDelete={() => {
        //                   if (suggestedTypes.includes(type))
        //                     setSuggestedTypes(
        //                       suggestedTypes.filter((t) => t !== type)
        //                     );
        //                   else setSuggestedTypes([...suggestedTypes, type]);
        //                 }}
        //                 deleteIcon={
        //                   suggestedTypes.includes(type) ? (
        //                     <Delete />
        //                   ) : (
        //                     <Add
        //                       sx={{
        //                         opacity: "1 !important",
        //                         color: "black",
        //                       }}
        //                     />
        //                   )
        //                 }
        //               />
        //             </Grid>
        //           ))}
        //           {/* {suggestedTypes.length !==
        //       suggestLocationDefaultTypes.length && (
        //       <Grid item>
        //         <ChipSelectMenu
        //           multiple={false}
        //           label={"Add Type"}
        //           icon={<Add />}
        //           options={suggestLocationDefaultTypes.filter(
        //             (type) => !suggestedTypes.includes(type)
        //           )}
        //           onChange={(selected) => {
        //             setSuggestedTypes([...suggestedTypes, selected]);
        //           }}
        //         />
        //       </Grid>
        //     )} */}
        //         </Grid>
        //       </>
        //     )}
        //   </AccordionDetails>
        // </Accordion>
        //  {/* {settingsDirty && ( */}
        // <Button
        //   variant="contained"
        //   sx={{ mt: 2, pb: 0 }}
        //   onClick={() => {
        //     if (suggesting) suggestNearby();
        //     else setSuggesting(true);
        //   }}
        // >
        //   Search
        // </Button>
        //  {/* )} */}
        // </Box>
      }

      <>
        <Snackbar
          open={noLocationsNearby}
          autoHideDuration={5000}
          onClose={() => {
            setNoLocationsNearby(false);
          }}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => {
              setNoLocationsNearby(false);
            }}
            severity="warning"
            // variant="filled"
            sx={{ width: "100%" }}
          >
            No nearby activities found. Adjust your settings and try again.
          </Alert>
        </Snackbar>
      </>
    </>
  );
}
