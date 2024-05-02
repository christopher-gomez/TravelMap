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

  let content = focusedMarker ? (
    <POIDetails
      icon={icon}
      title={title}
      day={day}
      date={date}
      description={description}
      tags={tags}
    />
  ) : focusedCluster ? (
    focusedCluster.markers.map((m) => (
      <POIDetails
        icon={m.icon}
        title={m.info}
        day={m.day}
        date={m.date}
        hideDescription={true}
        onClick={() => setFocusedMarker(m)}
        // description={m.description}
        // tags={m.tags}
      />
    ))
  ) : null;

  return isTouchDevice() ? (
    <SwipeableEdgeDrawer
      onHeightChange={onHeightChange}
      hidden={!focusedMarker && !focusedCluster}
      headerHeight={drawerHeaderHeight}
      HeaderContent={
        <POIDetailsTitle title={title} tags={tags} day={day} date={date} />
      }
      DrawerContent={
        description !== "" ? (
          <POIDetailsDescription description={description} />
        ) : null
      }
      onClose={onClose}
      onHeaderHeightChange={onHeaderHeightChange}
    />
  ) : (
    <StandardDrawer
      open={focusedCluster || focusedMarker}
      onClose={onClose}
      DrawerContent={content}
    />
  );
}
