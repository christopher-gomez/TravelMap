const server =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

export const queryDatabase = async ({ id, filter, sorts, cursor }) => {
  id = id ?? "";
  const queryResponse = await fetch(server + "/notion/database/" + id, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: filter ?? {},
      sorts: sorts ?? [],
      start_cursor: cursor,
    }),
  });
  const queryData = await queryResponse.json();
  return queryData;
};

export const updatePage = async ({ id, properties, icon }) => {
  const response = await fetch(server + "/notion/page/" + id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties, icon }),
  });
  const data = await response.json();
  return data;
};

export const createPage = async ({ properties }) => {
  const response = await fetch(server + "/notion/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties }),
  });
  const data = await response.json();
  return data;
};

export const deletePage = async (id) => {
  const response = await fetch(server + "/notion/page/" + id, {
    method: "DELETE",
  });
  const data = await response.json();
  return data;
};
