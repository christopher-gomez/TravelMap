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
}) {
  return (
    <Timeline position="right" sx={{ fontFamily: "'Indie Flower', cursive" }}>
      {activities.map((activity, i) => {
        return (
          <TimelineItem
            sx={{ fontFamily: "'Indie Flower', cursive", cursor: "pointer" }}
            onClick={() => onActivityClick(activity)}
          >
            {activity.time && (
              <TimelineOppositeContent
                sx={{ fontFamily: "'Indie Flower', cursive" }}
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
            <TimelineContent sx={{ fontFamily: "'Indie Flower', cursive" }}>
              {activity.label}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
