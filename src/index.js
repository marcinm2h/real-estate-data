import { promises as fs } from "fs";
import merge from "lodash/merge.js";
import olxdata from "./olxdata.json" assert { type: "json" }; // https://olxdata.azurewebsites.net/olx?data=olxdata&city=warszawa
import otodomdata from "./otodomdata.json" assert { type: "json" }; // https://olxdata.azurewebsites.net/olx?data=otodomdata&city=warszawa

const data = merge(
  olxdata.reduce(
    (acc, { date, toSell, toRent }) => ({
      ...acc,
      [date]: { olxToSell: toSell, olxToRent: toRent },
    }),
    {}
  ),
  otodomdata.reduce(
    (acc, { date, toSell, toRent }) => ({
      ...acc,
      [date]: { otodomToSell: toSell, otodomToRent: toRent },
    }),
    {}
  )
);

const sortedData = Object.entries(data).sort(
  ([dateA], [dateB]) => dateA > dateB
);

const fillEmptyValues = (
  { olxToSell, olxToRent, otodomToSell, otodomToRent },
  previous
) => {
  return {
    olxToSell: olxToSell ? olxToSell : previous.olxToSell,
    olxToRent: olxToRent ? olxToRent : previous.olxToRent,
    otodomToSell: otodomToSell ? otodomToSell : previous.otodomToSell,
    otodomToRent: otodomToRent ? otodomToRent : previous.otodomToRent,
  };
};

const processedData = sortedData.reduce(
  (acc, [date, values], idx) => [
    ...acc,
    [date, fillEmptyValues(values, idx > 0 ? acc[idx - 1][1] : values)],
  ],
  []
);

const CSV_EMPTY_STRING = '""';

const csv = processedData
  .sort(([dateA], [dateB]) => dateA > dateB)
  .reduce(
    (
      acc,
      [
        date,
        {
          olxToSell = CSV_EMPTY_STRING,
          olxToRent = CSV_EMPTY_STRING,
          otodomToSell = CSV_EMPTY_STRING,
          otodomToRent = CSV_EMPTY_STRING,
        },
      ]
    ) =>
      `${acc}${[date, olxToSell, otodomToSell, olxToRent, otodomToRent].join(
        ","
      )}\n`,
    `date,olx_to_sell,otodom_to_sell,olx_to_rent,otodom_to_rent\n`
  );

fs.writeFile("data.csv", csv)
  .then(() => {
    console.log("done");
  })
  .catch((err) => console.error(err));
