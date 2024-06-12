import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import "./Timeline.css";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import { styled } from "@mui/material";

export default function ActivityTimeline({
  activities,
  selectedActivities,
  onActivityClick,
  onActivityMouseOver,
  onActivityMouseOut,
}) {
  const [hovered, setHovered] = React.useState(null);
  return (
    <Timeline
      position="right"
      sx={{
        fontFamily: "'Fredoka', sans-serif",
        mt: 0,
        mb: 0,
        userSelect: "none",
        msUserSelect: "none",
        MozUserSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        p: 0
        // flexFlow: "row !important",
      }}
    >
      {activities.map((activity, i) => {
        return (
          <TimelineItem
            key={activity.marker.id + "-timeline-item-" + i}
            sx={{
              fontFamily: "'Fredoka', sans-serif",

              fontSize: "1.5em",
              cursor: "pointer",
              userSelect: "none",
              msUserSelect: "none",
              MozUserSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
            onClick={() => onActivityClick(activity)}
            onPointerOver={() => {
              onActivityMouseOver(activity);
              setHovered(activity);
            }}
            onPointerOut={() => {
              onActivityMouseOut(activity);
              setHovered(null);
            }}
          >
            {activity.time && (
              <TimelineOppositeContent
                sx={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: ".8em",
                  userSelect: "none",
                  msUserSelect: "none",
                  MozUserSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                  pl: 0
                  // fontWeight: hovered === activity ? "bolder" : "normal",
                }}
              >
                {activity.time}
              </TimelineOppositeContent>
            )}
            {i !== activities.length - 1 ? (
              <TimelineSeparator>
                <TimelineDot
                  color={
                    selectedActivities.includes(i)
                      ? selectedActivities.length > 1 &&
                        selectedActivities.indexOf(i) ===
                          selectedActivities.length - 1
                        ? "error"
                        : "success"
                      : "grey"
                  }
                />
                <TimelineConnector />
              </TimelineSeparator>
            ) : (
              <TimelineSeparator>
                <TimelineDot
                  color={
                    selectedActivities.includes(i)
                      ? selectedActivities.length > 1 &&
                        selectedActivities.indexOf(i) ===
                          selectedActivities.length - 1
                        ? "error"
                        : "success"
                      : "grey"
                  }
                />
              </TimelineSeparator>
            )}
            <TimelineContent
              sx={{
                fontFamily: "'Fredoka', sans-serif",

                fontSize: ".85em",
                userSelect: "none",
                msUserSelect: "none",
                MozUserSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                pr: 1
                // fontWeight: hovered === activity ? "bolder" : "normal",
              }}
            >
              {activity.label}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
const HorizontalTimeline = styled(Timeline)({
  flexDirection: "row",
  flexWrap: "nowrap",
  overflowX: "auto",
  alignItems: "baseline",
  justifyContent: "space-between",
});

const HorizontalTimelineItem = styled(TimelineItem)({
  // minWidth: "200px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  position: "relative",
  flexGrow: 1,
  // flex: "1 0 20%", // Adjust the flex-basis (20%) to control item width
  minWidth: "150px", // Ensure items don't shrink too small
});

const HorizontalTimelineOppositeContent = styled(TimelineOppositeContent)({
  flex: "none",
  paddingBottom: "16px",
  // position: "absolute",
  // top: "-40px", // Adjust as needed
  // left: "50%",
  // transform: "translateX(-50%)",
  marginRight: 0,
  textAlign: "center",
});

const HorizontalTimelineSeparator = styled(TimelineSeparator)({
  flexDirection: "row",
  alignItems: "center",
  position: "relative",
  width: "100%",
});

const HorizontalTimelineConnector = styled(TimelineConnector)({
  width: "50%",
  height: "2px",
  backgroundColor: "grey",
  flexGrow: 0,
  // position: "absolute",
  // top: "50%",
  // left: "50%",
  // transform: "translateX(50%)",
});

const TimelineContentCentered = styled(TimelineContent)({
  fontFamily: "'Fredoka', sans-serif",
  fontSize: ".85em",
  userSelect: "none",
  msUserSelect: "none",
  MozUserSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  fontWeight: "normal",
  // position: "absolute",
  // bottom: "-40px", // Adjust as needed
  // left: "50%",
  // transform: "translateX(-50%)",
  textAlign: "center",
});

export function HorizontalActivityTimeline({
  activities,
  selectedActivities,
  onActivityClick,
  onActivityMouseOver,
  onActivityMouseOut,
}) {
  const [hovered, setHovered] = React.useState(null);

  return (
    <HorizontalTimeline
      sx={{
        fontFamily: "'Fredoka', sans-serif",
        mt: 0,
        mb: 0,
        userSelect: "none",
        msUserSelect: "none",
        MozUserSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {activities.map((activity, i) => {
        return (
          <HorizontalTimelineItem
            key={activity.marker.id + "-timeline-item-" + i}
            sx={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: "1.5em",
              cursor: "pointer",
              userSelect: "none",
              msUserSelect: "none",
              MozUserSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
            onClick={() => onActivityClick(activity)}
            onPointerOver={() => {
              onActivityMouseOver(activity);
              setHovered(activity);
            }}
            onPointerOut={() => {
              onActivityMouseOut(activity);
              setHovered(null);
            }}
          >
            <TimelineContentCentered
              sx={
                {
                  // fontWeight: hovered === activity ? "bolder" : "normal",
                }
              }
            >
              {activity.label}
            </TimelineContentCentered>
            <HorizontalTimelineSeparator
              sx={{ transform: i === 0 ? "translateX(50%)" : "none" }}
            >
              {i !== 0 && <HorizontalTimelineConnector />}
              <TimelineDot
                color={
                  selectedActivities.includes(i)
                    ? selectedActivities.length > 1 &&
                      selectedActivities.indexOf(i) ===
                        selectedActivities.length - 1
                      ? "error"
                      : "success"
                    : "grey"
                }
              />
              {i !== activities.length - 1 && <HorizontalTimelineConnector />}
            </HorizontalTimelineSeparator>
            {activity.time && (
              <HorizontalTimelineOppositeContent
                sx={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: ".8em",
                  userSelect: "none",
                  msUserSelect: "none",
                  MozUserSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                  // fontWeight: hovered === activity ? "bolder" : "normal",
                }}
              >
                {activity.time}
              </HorizontalTimelineOppositeContent>
            )}
          </HorizontalTimelineItem>
        );
      })}
    </HorizontalTimeline>
  );
}
