import { useMemo, useState } from "react";

interface PlainDate<TTemporal extends Temporal<TTemporal>> {
  get day(): number;

  get month(): number;

  get dayOfWeek(): number;

  toPlainYearMonth(): InstanceType<TTemporal["PlainYearMonth"]>;

  get daysInWeek(): number;

  subtract(options: { days: number }): InstanceType<TTemporal["PlainDate"]>;

  add(options: { days: number }): InstanceType<TTemporal["PlainDate"]>;

  withCalendar(calendar: string): InstanceType<TTemporal["PlainDate"]>;

  toLocaleString(
    locale: string,
    options: {
      weekday: "short";
    },
  ): string;

  equals(other: InstanceType<TTemporal["PlainDate"]>): boolean;
}

interface PlainYearMonth<TTemporal extends Temporal<TTemporal>> {
  get daysInMonth(): number;

  get month(): number;
  get year(): number;

  toPlainDate(options: { day: number }): InstanceType<TTemporal["PlainDate"]>;

  subtract(options: {
    months: number;
  }): InstanceType<TTemporal["PlainYearMonth"]>;

  add(options: { months: number }): InstanceType<TTemporal["PlainYearMonth"]>;

  equals(other: InstanceType<TTemporal["PlainYearMonth"]>): boolean;
}

interface Temporal<TTemporal extends Temporal<TTemporal>> {
  PlainDate: {
    new (
      isoYear: number,
      isoMonth: number,
      isoDay: number,
    ): PlainDate<TTemporal>;
    compare(
      a: InstanceType<TTemporal["PlainDate"]>,
      b: InstanceType<TTemporal["PlainDate"]>,
    ): number;
  };
  PlainYearMonth: {
    new (isoYear: number, isoMonth: number): PlainYearMonth<TTemporal>;
    from(options: {
      year: number;
      month: number;
      calendar?: string;
    }): InstanceType<TTemporal["PlainYearMonth"]>;
  };
}

export interface CalendarDate<TTemporal extends Temporal<TTemporal>> {
  readonly isInMonth: boolean;
  readonly date: InstanceType<TTemporal["PlainDate"]>;
}

export interface CalendarWeek<TTemporal extends Temporal<TTemporal>> {
  readonly isFirstOfMonth: boolean;
  readonly dates: CalendarDate<TTemporal>[];
}

export interface CalendarMonth<TTemporal extends Temporal<TTemporal>> {
  readonly month: InstanceType<TTemporal["PlainYearMonth"]>;
  readonly weeks: CalendarWeek<TTemporal>[];
}

export interface CalendarWeekGroup<TTemporal extends Temporal<TTemporal>> {
  readonly locale: Intl.Locale;
  readonly dateHeaders: string[];
  readonly weeks: CalendarWeek<TTemporal>[];
}

function monthInCalendar<TTemporal extends Temporal<TTemporal>>(
  Temporal: TTemporal,
  month: InstanceType<TTemporal["PlainYearMonth"]>,
  calendar: string,
): InstanceType<TTemporal["PlainYearMonth"]> {
  return Temporal.PlainYearMonth.from({
    year: month.year,
    month: month.month,
    calendar,
  });
}

function getCalendar(locale: Intl.Locale): string {
  return locale.calendar ?? (locale as any).getCalendars?.()?.[0] ?? "gregory";
}

export function getCalendarMonth<TTemporal extends Temporal<TTemporal>>(
  Temporal: TTemporal,
  month: InstanceType<TTemporal["PlainYearMonth"]>,
): CalendarMonth<TTemporal> {
  const firstDay = month.toPlainDate({ day: 1 });
  const lastDay = month.toPlainDate({ day: month.daysInMonth });
  const firstDayOnCalendar = firstDay.subtract({
    days: firstDay.dayOfWeek - 1,
  });
  const lastDayOnCalendar = lastDay.add({
    days: lastDay.daysInWeek - lastDay.dayOfWeek,
  });

  const weeks: CalendarWeek<TTemporal>[] = [];
  for (
    let date = firstDayOnCalendar;
    Temporal.PlainDate.compare(date, lastDayOnCalendar) < 0;
    date = date.add({ days: date.daysInWeek })
  ) {
    const dates: CalendarDate<TTemporal>[] = [];
    for (let i = 0; i < date.daysInWeek; i++) {
      const day = date.add({ days: i });
      dates.push({
        isInMonth: day.toPlainYearMonth().equals(month),
        date: day,
      });
    }
    weeks.push({
      isFirstOfMonth: date === firstDayOnCalendar,
      dates,
    });
  }

  return {
    month,
    weeks,
  };
}

export function getWeekGroups<TTemporal extends Temporal<TTemporal>>(
  Temporal: TTemporal,
  month: CalendarMonth<TTemporal>,
  locale: Intl.Locale,
): CalendarWeekGroup<TTemporal>[] {
  const weekGroups: CalendarWeekGroup<TTemporal>[] = [];

  for (const week of month.weeks) {
    const dateHeaders = week.dates.map((date) =>
      date.date
        .withCalendar(getCalendar(locale))
        .toLocaleString(locale.baseName, { weekday: "short" }),
    );
    const last = weekGroups.at(-1);
    if (
      last &&
      last.dateHeaders.length === dateHeaders.length &&
      last.dateHeaders.every((header, i) => header === dateHeaders[i])
    ) {
      last.weeks.push(week);
      continue;
    }
    weekGroups.push({
      locale,
      dateHeaders,
      weeks: [week],
    });
  }

  return weekGroups;
}

type DateRangePickerDate<TTemporal extends Temporal<TTemporal>> = {
  readonly date: InstanceType<TTemporal["PlainDate"]>;
  readonly isInMonth: boolean;
  readonly isSelected: boolean;
  readonly isBoundaryDate: boolean;
  readonly isStartDate: boolean;
  readonly isEndDate: boolean;
  onSelect(): void;
};

type DateRangePickerWeek<TTemporal extends Temporal<TTemporal>> = {
  readonly dates: DateRangePickerDate<TTemporal>[];
  readonly isFirstOfMonth: boolean;
};

type DateRangePickerWeekGroup<TTemporal extends Temporal<TTemporal>> = {
  readonly locale: Intl.Locale;
  readonly dateHeaders: string[];
  readonly weeks: DateRangePickerWeek<TTemporal>[];
};

type DateRangePickerMonth<TTemporal extends Temporal<TTemporal>> = {
  readonly month: InstanceType<TTemporal["PlainYearMonth"]>;
  readonly groups: DateRangePickerWeekGroup<TTemporal>[];
};

interface DateRangePicker<TTemporal extends Temporal<TTemporal>> {
  goToPreviousMonth(): void;

  goToNextMonth(): void;

  readonly months: DateRangePickerMonth<TTemporal>[];

  readonly month: DateRangePickerMonth<TTemporal>;
}

interface DateRangePickerOptionsBase<TTemporal extends Temporal<TTemporal>> {
  Temporal: TTemporal;
  locale: Intl.Locale;
  /** @default 1 */
  numberOfMonths?: number;
  /** @default false */
  singleDatePicker?: boolean;
}

interface DateRangePickerOptions<TTemporal extends Temporal<TTemporal>>
  extends DateRangePickerOptionsBase<TTemporal> {
  dateRange: readonly [
    InstanceType<TTemporal["PlainDate"]>,
    InstanceType<TTemporal["PlainDate"]>,
  ];
  onDateRangeChange: (
    dateRange: [
      InstanceType<TTemporal["PlainDate"]>,
      InstanceType<TTemporal["PlainDate"]>,
    ],
  ) => void;
}

interface DatePickerOptions<TTemporal extends Temporal<TTemporal>>
  extends DateRangePickerOptionsBase<TTemporal> {
  date: InstanceType<TTemporal["PlainDate"]>;
  onDateChange: (date: InstanceType<TTemporal["PlainDate"]>) => void;
}

export function useDateRangePicker<TTemporal extends Temporal<TTemporal>>({
  Temporal,
  dateRange,
  onDateRangeChange,
  locale,
  numberOfMonths = 1,
  singleDatePicker = false,
}: DateRangePickerOptions<TTemporal>) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    dateRange[0].toPlainYearMonth(),
  );

  const calendar = useMemo(() => getCalendar(locale), [locale]);

  const months = useMemo(() => {
    const months: DateRangePickerMonth<TTemporal>[] = [];
    const initialMonthOffset = -Math.floor((numberOfMonths - 1) / 2);

    const visibleMonthInCalendar = monthInCalendar(Temporal, visibleMonth, calendar);

    for (
      let monthOffset = initialMonthOffset;
      monthOffset < numberOfMonths;
      monthOffset++
    ) {
      const month = visibleMonthInCalendar.add({ months: monthOffset });
      const calendarMonth = getCalendarMonth(Temporal, month);
      const weekGroups = getWeekGroups(Temporal, calendarMonth, locale).map(
        (weekGroup) => ({
          ...weekGroup,
          weeks: weekGroup.weeks.map((week) => ({
            ...week,
            dates: week.dates.map((date) => ({
              ...date,
              date: date.date.withCalendar(calendar),
              isSelected: dateRange.some((selectedDate) =>
                selectedDate.equals(date.date),
              ),
              isBoundaryDate: dateRange.some((selectedDate) =>
                selectedDate.equals(date.date),
              ),
              isStartDate: dateRange[0].equals(date.date),
              isEndDate: dateRange[1].equals(date.date),
              onSelect() {
                // TODO: Nulls?
                onDateRangeChange(
                  dateRange[0].equals(date.date)
                    ? [dateRange[1], dateRange[1]]
                    : [date.date, dateRange[1]],
                );
              },
            })),
          })),
        }),
      );
      months.push({
        month,
        groups: weekGroups,
      });
    }
    return months;
  }, [visibleMonth, dateRange, onDateRangeChange, calendar]);
  return useMemo<DateRangePicker<TTemporal>>(
    () => ({
      goToPreviousMonth() {
        setVisibleMonth((month) => month.subtract({ months: 1 }));
      },
      goToNextMonth() {
        setVisibleMonth((month) => month.add({ months: 1 }));
      },
      months,
      month: months[Math.floor((numberOfMonths - 1) / 2)],
    }),
    [months, setVisibleMonth],
  );
}

export function useDatePicker<TTemporal extends Temporal<TTemporal>>({
  date,
  onDateChange,
  ...rest
}: DatePickerOptions<TTemporal>) {
  const dateRange = useMemo(() => [date, date] as const, [date]);
  const onDateRangeChange = useMemo(
    () =>
      (
        dateRange: [
          InstanceType<TTemporal["PlainDate"]>,
          InstanceType<TTemporal["PlainDate"]>,
        ],
      ) => {
        onDateChange(dateRange[0]);
      },
    [onDateChange],
  );
  return useDateRangePicker({
    dateRange,
    onDateRangeChange,
    ...rest,
  });
}
