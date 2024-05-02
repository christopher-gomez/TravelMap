import React, { useEffect, useRef, useState } from "react";
import "./POIDetails.css";
import { Box, Skeleton } from "@mui/material";

var options = { weekday: "short", month: "short", day: "numeric" };

export const POIDetails = ({
  title,
  image,
  icon,
  tags,
  description,
  day,
  date,
  hideDescription = true,
  onClick,
}) => {
  return (
    <div
      className="content"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
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

      {title && (
        <>
          {image && <img src={image} style={{ width: "100%", height: '400px', marginBottom: '.5em' }} />}
          {icon && (
            <img src={icon.url} style={{ height: "50px", width: "50px",  }} />
          )}
          {Array.isArray(title) ? (
            title.map((t, i) => (
              <h1 className="poi-title" key={title + "-title"}>
                {t}
                {i !== title.length - 1 && ","}
              </h1>
            ))
          ) : (
            <h1 className="poi-title">{title}</h1>
          )}
        </>
      )}
      {(day || date) && (
        <div
          style={{
            display: "flex",
            flexFlow: "row",
            placeContent: "center",
            alignItems: "center",
            // width: "100%",
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
        <div className="poi-tags" style={{ marginTop: "1em" }}>
          {tags.map((tag, i) => (
            <span className="poi-tag" key={title + "-tag-" + i}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {description && !hideDescription && (
        <p
          className="poi-description"
          style={{ marginTop: "1em", marginBottom: 0 }}
        >
          {description}
        </p>
      )}
      {!description && !hideDescription && (
        <div
          className="poi-description"
          style={{
            marginTop: "1em",
            marginBottom: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Skeleton
            height={"100%"}
            width={"100%"}
            sx={{ transform: "none !important" }}
          />
        </div>
      )}

      {/* <div className="poi-extra-info">
        </div> */}
    </div>
  );
};

export const POIDetailsTitle = ({ title, tags, day, date }) => {
  return (
    <div className="content mobile">
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
  const [atBottom, setAtBottom] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const scrollableRef = useRef(null);

  useEffect(() => {
    const scrollable = scrollableRef.current;
    // Attach the scroll event listener
    scrollable.addEventListener("scroll", checkScroll);

    // Remove the event listener on cleanup
    return () => {
      scrollable.removeEventListener("scroll", checkScroll);
    };
  }, [scrollableRef]);

  const checkScroll = () => {
    if (scrollableRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
      // Set state based on scroll position
      setAtBottom(scrollTop + clientHeight >= scrollHeight);
      setAtTop(scrollTop === 0);
    }
  };

  return (
    <div className="content mobile">
      {description && (
        <>
          {/* <div className={`scroll-fade-top ${atTop ? "hidden" : ""}`}></div> */}
          <p className="poi-description" ref={scrollableRef}>
            {description}
          </p>
          {/* <div
            className={`scroll-fade-bottom ${atBottom ? "hidden" : ""}`}
          ></div> */}
        </>
      )}
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
        {description && (
          <p className="poi-description" style={{ marginTop: "1em" }}>
            {description}
          </p>
        )}
        {/* <div className="poi-extra-info">
        </div> */}
      </div>
    </div>
  );
};

export default POIDetailsCard;
