"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import type { NavigateAction } from "react-big-calendar";
import moment from "moment";
import "moment/locale/zh-cn";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale("zh-cn");

const localizer = momentLocalizer(moment);

export type CourseForCalendar = {
  id: string;
  name: string;
  code?: string;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
  instructorName?: string;
  cohortName?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  instructorName?: string;
  cohortName?: string;
  resource?: { courseId: string; color: string };
};

const COURSE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function parseTimeHHmm(s: string): [number, number] {
  const [h, m] = s.split(":").map(Number);
  return [h ?? 0, m ?? 0];
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function generateEvents(courses: CourseForCalendar[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let colorIndex = 0;

  for (const course of courses) {
    const {
      id,
      name,
      startDate,
      endDate,
      dayOfWeek,
      startTime,
      endTime,
      instructorName,
      cohortName,
    } = course;

    if (
      startDate == null ||
      endDate == null ||
      dayOfWeek == null ||
      startTime == null ||
      endTime == null
    ) {
      continue;
    }

    const semesterStart = new Date(startDate);
    const semesterEnd = new Date(endDate);
    const [startH, startM] = parseTimeHHmm(startTime);
    const [endH, endM] = parseTimeHHmm(endTime);
    const color = COURSE_COLORS[colorIndex % COURSE_COLORS.length];
    colorIndex += 1;

    const title = [name, cohortName].filter(Boolean).join(" · ");
    let d = toDateOnly(semesterStart);

    while (d <= semesterEnd) {
      if (d.getDay() === dayOfWeek) {
        const start = new Date(d);
        start.setHours(startH, startM, 0, 0);
        const end = new Date(d);
        end.setHours(endH, endM, 0, 0);
        events.push({
          id: `${id}-${d.toISOString().slice(0, 10)}`,
          title,
          start,
          end,
          instructorName: instructorName ?? undefined,
          cohortName: cohortName ?? undefined,
          resource: { courseId: id, color },
        });
      }
      d = addDays(d, 1);
    }
  }

  return events;
}

function eventStyleGetter(event: CalendarEvent) {
  const color = event.resource?.color ?? "#3b82f6";
  return {
    style: {
      backgroundColor: color,
      borderLeft: `4px solid ${color}`,
    },
  };
}

/** Custom event block: 课程名 + 教师 + 班级 */
function CustomEventComponent({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex flex-col text-xs p-1 leading-tight min-h-[2.5rem]">
      <div className="font-bold border-b border-white/20 mb-1 pb-0.5 truncate">
        {event.title}
      </div>
      <div className="opacity-90 truncate">
        👨‍🏫 教师: {event.instructorName ?? "—"}
      </div>
      <div className="opacity-90 truncate">
        🏫 班级: {event.cohortName ?? "—"}
      </div>
    </div>
  );
}

/** Custom toolbar so "今天 / 上一页 / 下一页" and view buttons correctly trigger onNavigate/onView. */
function CourseCalendarToolbar({
  date,
  view,
  views,
  label,
  onNavigate,
  onView,
  localizer,
}: {
  date: Date;
  view: View;
  views: View[];
  label: string;
  onNavigate: (action: NavigateAction, newDate?: Date) => void;
  onView: (view: View) => void;
  localizer: { messages: Record<string, string> };
}) {
  const messages = localizer.messages ?? {};
  return (
    <div
      className="rbc-toolbar flex flex-wrap items-center justify-center gap-2 py-2"
      style={{ position: "relative", zIndex: 20 }}
      role="toolbar"
    >
      <span className="rbc-btn-group inline-flex">
        <button
          type="button"
          onClick={() => onNavigate("TODAY")}
          className="relative z-[21] cursor-pointer rounded border border-gray-300 bg-white px-4 py-1.5 hover:bg-gray-100"
        >
          {messages.today ?? "今天"}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("PREV")}
          className="relative z-[21] cursor-pointer rounded border border-gray-300 bg-white px-4 py-1.5 hover:bg-gray-100"
        >
          {messages.previous ?? "上一页"}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("NEXT")}
          className="relative z-[21] cursor-pointer rounded border border-gray-300 bg-white px-4 py-1.5 hover:bg-gray-100"
        >
          {messages.next ?? "下一页"}
        </button>
      </span>
      <span className="rbc-toolbar-label flex-1 px-2 text-center font-medium">
        {label}
      </span>
      {views.length > 1 && (
        <span className="rbc-btn-group inline-flex">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              className={`relative z-[21] cursor-pointer rounded border px-4 py-1.5 ${
                view === v
                  ? "border-blue-600 bg-blue-100 text-blue-800"
                  : "border-gray-300 bg-white hover:bg-gray-100"
              }`}
            >
              {messages[v] ?? v}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}

interface CourseCalendarProps {
  courses: CourseForCalendar[];
  defaultView?: View;
  height?: number;
}

export function CourseCalendar({
  courses,
  defaultView = "week",
  height = 500,
}: CourseCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentView, setCurrentView] = useState<View>(defaultView);

  const events = useMemo(() => generateEvents(courses), [courses]);

  const min = useMemo(
    () => new Date(2020, 0, 1, 6, 0, 0),
    []
  );
  const max = useMemo(
    () => new Date(2020, 0, 1, 22, 0, 0),
    []
  );

  const handleNavigate = useCallback(
    (newDate: Date, _view: View, _action: NavigateAction) => {
      setCurrentDate(newDate);
    },
    []
  );

  const handleView = useCallback((newView: View) => {
    setCurrentView(newView);
  }, []);

  return (
    <div
      className="course-calendar-wrapper relative isolate [&_.rbc-time-slot]:min-h-[3rem] [&_.rbc-event]:text-xs [&_.rbc-event]:overflow-visible [&_.rbc-event-content]:leading-tight"
      style={{ minHeight: height }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        date={currentDate}
        view={currentView}
        onNavigate={handleNavigate}
        onView={handleView}
        views={["month", "week", "day"]}
        min={min}
        max={max}
        eventPropGetter={eventStyleGetter}
        style={{ height }}
        components={{
          toolbar: CourseCalendarToolbar,
          event: CustomEventComponent,
        }}
        messages={{
          today: "今天",
          previous: "上一页",
          next: "下一页",
          month: "月",
          week: "周",
          day: "日",
          agenda: "议程",
          date: "日期",
          time: "时间",
          event: "事件",
          noEventsInRange: "该范围内暂无课程",
        }}
      />
    </div>
  );
}
