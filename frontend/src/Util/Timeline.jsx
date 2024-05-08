import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import "./Timeline.css";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";

export default function ActivityTimeline({
  activities,
  selectedActivities,
  onActivityClick,
  driveDuration,
  walkDuration,
  driveDistance,
  walkDistance,
  onActivityMouseOver,
  onActivityMouseOut,
}) {
  return (
    <Timeline
      position="right"
      sx={{
        fontFamily: "'Indie Flower', cursive",
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
          <TimelineItem
            sx={{
              fontFamily: "'Indie Flower', cursive",
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
            }}
            onPointerOut={() => onActivityMouseOut(activity)}
          >
            {activity.time && (
              <TimelineOppositeContent
                sx={{
                  fontFamily: "'Indie Flower', cursive",
                  userSelect: "none",
                  msUserSelect: "none",
                  MozUserSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
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
                fontFamily: "'Indie Flower', cursive",
                userSelect: "none",
                msUserSelect: "none",
                MozUserSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
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
