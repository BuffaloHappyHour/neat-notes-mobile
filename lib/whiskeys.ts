export type Whiskey = {
  id: string;          // URL-safe id, e.g. "lagavulin-16"
  name: string;        // Display name
  distillery: string;
  region: string;
  type: string;        // Scotch / Bourbon / Rye / etc.
  age?: number;        // years
  proof?: number;      // e.g. 86
  abv?: number;        // e.g. 43
  notes?: string;
  image?: any;
};

export const WHISKEYS: Whiskey[] = [
  {
    id: "lagavulin-16",
    name: "Lagavulin 16",
    distillery: "Lagavulin",
    region: "Islay",
    type: "Single Malt Scotch Whisky",
    age: 16,
    abv: 43,
    notes: "Smoky, maritime peat with dried fruit and oak.",
    image: require("../assets/whiskeys/placeholder.png"),

  },
  {
    id: "laphroaig-10",
    name: "Laphroaig 10",
    distillery: "Laphroaig",
    region: "Islay",
    type: "Single Malt Scotch Whisky",
    age: 10,
    abv: 40,
    notes: "Medicinal peat, seaweed, iodine, and sweet smoke.",
    image: require("../assets/whiskeys/placeholder.png"),
  },
  {
    id: "macallan-12",
    name: "The Macallan 12",
    distillery: "The Macallan",
    region: "Speyside",
    type: "Single Malt Scotch Whisky",
    age: 12,
    abv: 40,
    notes: "Sherry-forward with vanilla, dried fruit, and spice.",
    image: require("../assets/whiskeys/placeholder.png"),
  },
];

export function getWhiskeyById(id: string) {
  return WHISKEYS.find((w) => w.id === id);
}
