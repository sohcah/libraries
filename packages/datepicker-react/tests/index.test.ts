import { getCalendarMonth, getWeekGroups } from "../src/index.js";
import { expect, test } from "vitest";
import { Temporal } from "@js-temporal/polyfill";

test("getCalendarMonth - Gregorian", () => {
  const month = getCalendarMonth(
    Temporal,
    Temporal.PlainYearMonth.from({
      year: 2025,
      month: 5,
      calendar: "gregory",
    }),
  );
  expect(month).toStrictEqual({
    month: Temporal.PlainYearMonth.from("2025-05-01[u-ca=gregory]"),
    weeks: [
      {
        dates: [
          {
            date: Temporal.PlainDate.from("2025-04-28[u-ca=gregory]"),
            isInMonth: false,
          },
          {
            date: Temporal.PlainDate.from("2025-04-29[u-ca=gregory]"),
            isInMonth: false,
          },
          {
            date: Temporal.PlainDate.from("2025-04-30[u-ca=gregory]"),
            isInMonth: false,
          },
          {
            date: Temporal.PlainDate.from("2025-05-01[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-02[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-03[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-04[u-ca=gregory]"),
            isInMonth: true,
          },
        ],
        isFirstOfMonth: true,
      },
      {
        dates: [
          {
            date: Temporal.PlainDate.from("2025-05-05[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-06[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-07[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-08[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-09[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-10[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-11[u-ca=gregory]"),
            isInMonth: true,
          },
        ],
        isFirstOfMonth: false,
      },
      {
        dates: [
          {
            date: Temporal.PlainDate.from("2025-05-12[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-13[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-14[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-15[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-16[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-17[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-18[u-ca=gregory]"),
            isInMonth: true,
          },
        ],
        isFirstOfMonth: false,
      },
      {
        dates: [
          {
            date: Temporal.PlainDate.from("2025-05-19[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-20[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-21[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-22[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-23[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-24[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-25[u-ca=gregory]"),
            isInMonth: true,
          },
        ],
        isFirstOfMonth: false,
      },
      {
        dates: [
          {
            date: Temporal.PlainDate.from("2025-05-26[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-27[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-28[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-29[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-30[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-05-31[u-ca=gregory]"),
            isInMonth: true,
          },
          {
            date: Temporal.PlainDate.from("2025-06-01[u-ca=gregory]"),
            isInMonth: false,
          },
        ],
        isFirstOfMonth: false,
      },
    ],
  });
});

test("getWeekGroups - Gregorian", () => {
  const month = getCalendarMonth(
    Temporal,
    Temporal.PlainYearMonth.from({
      year: 2025,
      month: 5,
      calendar: "gregory",
    }),
  );

  const weekGroups = getWeekGroups(Temporal, month, new Intl.Locale("en-GB"));

  expect(weekGroups).toStrictEqual([
    {
      dateHeaders: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      locale: new Intl.Locale("en-GB"),
      weeks: [
        {
          dates: [
            {
              date: Temporal.PlainDate.from("2025-04-28[u-ca=gregory]"),
              isInMonth: false,
            },
            {
              date: Temporal.PlainDate.from("2025-04-29[u-ca=gregory]"),
              isInMonth: false,
            },
            {
              date: Temporal.PlainDate.from("2025-04-30[u-ca=gregory]"),
              isInMonth: false,
            },
            {
              date: Temporal.PlainDate.from("2025-05-01[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-02[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-03[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-04[u-ca=gregory]"),
              isInMonth: true,
            },
          ],
          isFirstOfMonth: true,
        },
        {
          dates: [
            {
              date: Temporal.PlainDate.from("2025-05-05[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-06[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-07[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-08[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-09[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-10[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-11[u-ca=gregory]"),
              isInMonth: true,
            },
          ],
          isFirstOfMonth: false,
        },
        {
          dates: [
            {
              date: Temporal.PlainDate.from("2025-05-12[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-13[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-14[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-15[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-16[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-17[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-18[u-ca=gregory]"),
              isInMonth: true,
            },
          ],
          isFirstOfMonth: false,
        },
        {
          dates: [
            {
              date: Temporal.PlainDate.from("2025-05-19[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-20[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-21[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-22[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-23[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-24[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-25[u-ca=gregory]"),
              isInMonth: true,
            },
          ],
          isFirstOfMonth: false,
        },
        {
          dates: [
            {
              date: Temporal.PlainDate.from("2025-05-26[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-27[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-28[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-29[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-30[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-05-31[u-ca=gregory]"),
              isInMonth: true,
            },
            {
              date: Temporal.PlainDate.from("2025-06-01[u-ca=gregory]"),
              isInMonth: false,
            },
          ],
          isFirstOfMonth: false,
        },
      ],
    },
  ]);
});
