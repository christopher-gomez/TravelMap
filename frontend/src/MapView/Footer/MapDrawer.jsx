import * as React from "react";
import SwipeableEdgeDrawer from "../../Util/SwipeableEdgeDrawer";
import { Typography } from "@mui/material";
import { isTouchDevice } from "../../Util/Utils";
import StandardDrawer from "../../Util/StandardDrawer";
import {
  POIDetails,
  POIDetailsDescription,
  POIDetailsTitle,
} from "../POI/POIDetails";

export default function MapDrawer({
  onHeightChange,
  focusedMarker,
  focusedCluster,
  drawerHeaderHeight,
  onClose,
  onHeaderHeightChange,
  setFocusedMarker,
  allMarkers,
  offsetCenter,
  googleAccount,
  setLoginPopupOpen,
  onUpdateDate,
  calculateDay,
  onUpdateTitle,
  allTags,
  onTagsUpdated,
  allTimes,
  onTimeUpdated,
  currentDayFilter,
}) {
  let title =
    focusedCluster === null && focusedMarker === null
      ? ""
      : focusedMarker
      ? focusedMarker.info
      : focusedCluster.markers.map((m) => m.info);
  let icon = focusedMarker
    ? focusedMarker.icon
    : focusedCluster
    ? focusedCluster.icon
    : null;
  let day =
    focusedCluster === null && focusedMarker === null
      ? null
      : focusedMarker
      ? focusedMarker.day
      : null;
  let date =
    focusedCluster === null && focusedMarker === null
      ? null
      : focusedMarker
      ? focusedMarker.date
      : null;
  let description =
    focusedCluster === null && focusedMarker === null
      ? ""
      : focusedMarker
      ? focusedMarker.description
      : "";
  let tags =
    focusedCluster === null && focusedMarker === null
      ? []
      : focusedMarker
      ? focusedMarker.tags
      : [];
  let related = focusedMarker
    ? focusedMarker.related
      ? allMarkers.filter((m) => focusedMarker.related.includes(m.id))
      : []
    : [];

  let link = focusedMarker ? focusedMarker.link : null;

  let time = focusedMarker ? focusedMarker.time : null;

  let content = focusedMarker ? (
    <POIDetails
      icon={icon}
      image={focusedMarker.photo}
      title={title}
      day={day}
      date={date}
      time={time}
      description={description}
      hideDescription={
        focusedMarker.description === "" ||
        !focusedMarker.description ||
        focusedMarker.description === null
      }
      tags={tags}
      related={related}
      setFocusedMarker={setFocusedMarker}
      offsetCenter={offsetCenter}
      googleAccount={googleAccount}
      setLoginPopupOpen={setLoginPopupOpen}
      onUpdateDate={onUpdateDate}
      calculateDay={calculateDay}
      marker={focusedMarker}
      link={link}
      onUpdateTitle={onUpdateTitle}
      allTags={allTags}
      onTagsUpdated={onTagsUpdated}
      allTimes={allTimes}
      onTimeUpdated={onTimeUpdated}
      currentDayFilter={currentDayFilter}
      allMarkers={allMarkers}
    />
  ) : focusedCluster ? (
    focusedCluster.markers.map((m, i) => (
      <>
        <POIDetails
          icon={m.icon}
          image={m.photo}
          title={m.info}
          day={m.day}
          date={m.date}
          time={m.time}
          hideDescription={true}
          onClick={() => setFocusedMarker(m)}
          // description={m.description}
          // tags={m.tags}
        />
        {i !== focusedCluster.markers.length - 1 && (
          <hr style={{ color: "black", width: "100%" }} />
        )}
      </>
    ))
  ) : null;

  return (
    <StandardDrawer
      open={
        (focusedCluster !== null && focusedCluster !== undefined) ||
        (focusedMarker !== undefined && focusedMarker !== null)
      }
      onClose={onClose}
      DrawerContent={content}
    />
  );
  //  isTouchDevice() ? (
  //   <SwipeableEdgeDrawer
  //     onHeightChange={onHeightChange}
  //     hidden={!focusedMarker && !focusedCluster}
  //     headerHeight={drawerHeaderHeight}
  //     HeaderContent={
  //       <POIDetailsTitle title={title} tags={tags} day={day} date={date} />
  //     }
  //     DrawerContent={
  //       description !== "" ? (
  //         <POIDetailsDescription description={description} />
  //       ) : null
  //     }
  //     onClose={onClose}
  //     onHeaderHeightChange={onHeaderHeightChange}
  //   />
  // ) : (

  // );
}
