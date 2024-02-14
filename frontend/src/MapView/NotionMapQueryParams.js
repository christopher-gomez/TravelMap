export const TOKYO_QUERY = {
    id: "",
    filter: {
        property: "City",
        multi_select: {
            contains: "Tokyo",
        },
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
}