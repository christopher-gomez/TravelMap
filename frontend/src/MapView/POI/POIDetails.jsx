import React, { useState } from "react";
import "./POIDetails.css";

var options = { weekday: "short", month: "short", day: "numeric" };

export const POIDetails = ({ title, tags, description, day, date }) => {
  return (
    <div className="content">
      {/* {date && (
        <span className="poi-date">{`${new Date(date.start).toLocaleDateString(
          "en-US",
          options
        )}${
          date.end
            ? " - " + new Date(date.end).toLocaleDateString("en-US", options)
            : ""
        }`}</span>
      )}
      {day && (
        <span className="poi-day">
          {Array.isArray(day)
            ? "Days: " + day[0] + "-" + day[day.length - 1]
            : "Day: " + day}
        </span>
      )} */}
      {title &&
        (Array.isArray(title) ? (
          title.map((t, i) => (
            <h1 className="poi-title" key={title + "-title"}>
              {t}
              {i !== title.length - 1 && ","}
            </h1>
          ))
        ) : (
          <h1 className="poi-title">{title}</h1>
        ))}
      {(day || date) && (
        <div
          style={{
            display: "flex",
            flexFlow: "row",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: ".5em",
            marginTop: ".5em",
          }}
        >
          {date && (
            <span className="poi-date row">
              {`${new Date(date.start).toLocaleDateString("en-US", options)}${
                date.end
                  ? " - " +
                    new Date(date.end).toLocaleDateString("en-US", options)
                  : ""
              }`}{" "}
              -{" "}
            </span>
          )}
          {day && (
            <span className="poi-day row">
              {Array.isArray(day)
                ? "Days " + day[0] + "-" + day[day.length - 1]
                : "Day " + day}
            </span>
          )}
        </div>
      )}
      {tags && (
        <div className="poi-tags">
          {tags.map((tag, i) => (
            <span className="poi-tag" key={title + "-tag-" + i}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {description && <p className="poi-description">{description}</p>}
      {/* <div className="poi-extra-info">
        </div> */}
    </div>
  );
};

export const POIDetailsTitle = ({ title, tags, day, date }) => {
  return (
    <div className="content">
      {title &&
        (Array.isArray(title) ? (
          title.map((t, i) => (
            <h1 className="poi-title" key={title + "-title"} >
              {t}
              {i !== title.length - 1 && ","}
            </h1>
          ))
        ) : (
          <h1 className="poi-title" style={{marginTop: '1em'}}>{title}</h1>
        ))}
      {(day || date) && (
        <div
          style={{
            display: "flex",
            flexFlow: "row",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: ".5em",
          }}
        >
          {date && (
            <span className="poi-date row">
              {`${new Date(date.start).toLocaleDateString("en-US", options)}${
                date.end
                  ? " - " +
                    new Date(date.end).toLocaleDateString("en-US", options)
                  : ""
              }`}{" "}
              -{" "}
            </span>
          )}
          {day && (
            <span className="poi-day row">
              {Array.isArray(day)
                ? "Days " + day[0] + "-" + day[day.length - 1]
                : "Day " + day}
            </span>
          )}
        </div>
      )}
      {tags && (
        <div className="poi-tags row">
          {tags.map((tag, i) => (
            <span className="poi-tag" key={title + "-tag-" + i}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const POIDetailsDescription = ({ description }) => {
  return (
    <div className="content">
      {description && <p className="poi-description">{description}</p>}
    </div>
  );
};

const POIDetailsCard = ({
  active,
  title,
  tags,
  description,
  onClose,
  day,
  date,
}) => {
  return (
    <div className={`slide-in-div ${active ? "active" : ""}`}>
      {onClose !== undefined && <button onClick={() => onClose()}>X</button>}
      <div className="content">
        {date && (
          <span className="poi-date">{`${new Date(
            date.start
          ).toLocaleDateString("en-US", options)}${
            date.end
              ? " - " + new Date(date.end).toLocaleDateString("en-US", options)
              : ""
          }`}</span>
        )}
        {day && (
          <span className="poi-day">
            {Array.isArray(day)
              ? "Days: " + day[0] + "-" + day[day.length - 1]
              : "Day: " + day}
          </span>
        )}
        {title &&
          (Array.isArray(title) ? (
            title.map((t, i) => (
              <h1 className="poi-title" key={title + "-title"}>
                {t}
                {i !== title.length - 1 && ","}
              </h1>
            ))
          ) : (
            <h1 className="poi-title">{title}</h1>
          ))}
        {tags && (
          <div className="poi-tags">
            {tags.map((tag, i) => (
              <span className="poi-tag" key={title + "-tag-" + i}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {description && <p className="poi-description">{description}</p>}
        {/* <div className="poi-extra-info">
        </div> */}
      </div>
    </div>
  );
};

export default POIDetailsCard;
