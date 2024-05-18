export const NOTION_QUERY = {
  id: "",
  filter: {
    or: [
      {
        property: "City",
        multi_select: {
          contains: "Tokyo",
        },
      },
      {
        property: "City",
        multi_select: {
          contains: "Kyoto",
        },
      },
      {
        property: "City",
        multi_select: {
          contains: "Osaka",
        },
      },
      {
        property: "City",
        multi_select: {
          contains: "Kinosaki",
        },
      },
    ],
  },
  sorts: [
    {
      property: "Date",
      direction: "ascending",
    },
    {
      property: "Time",
      direction: "descending",
    },
  ],
};
