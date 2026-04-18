export const LOCATION_HOME = { name: "Ravensburg (Home)", lat: 47.782, lon: 9.6106 };
export const LOCATION_WORK = { name: "Markdorf (Work)", lat: 47.7192, lon: 9.3903 };

export const STOP_NAMES = {
    TOWARDS_WORK_PRIMARY: "Towards work - Meersburger Brücke",
    TOWARDS_WORK_ALTERNATIVE: "Towards work (alternative stop) - Ravensburg Bahnhof",
    TOWARDS_HOME: "Towards home - Markdorf Gewerbegebiet",
} as const;

export const BUS_LINES_TOWARDS_WORK = {
    "700": ["Konstanz Bahnhof"],
    "710": ["Meersburg Fähre", "Markdorf Bahnhof"]
} as const;

export const BUS_LINES_TOWARDS_HOME = {
    "700": ["Ravensburg Bahnhof"],
    "710": ["Ravensburg Bahnhof"]
} as const;