"use client";

import { useEffect, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

import { CalendarService } from "@/lib/services/calendar.service";

export default function Calendar() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } =
      await CalendarService.getScheduledContent();

    if (error) {
      console.error(error);
      return;
    }

    const calendarEvents =
      (data ?? []).map((item) => ({
        id: item.id,
        title: item.topic,
        start: item.scheduled_at,
        extendedProps: {
          platform: item.platform,
          status: item.status,
          brand: item.brands?.name,
        },
      }));

    setEvents(calendarEvents);
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
    <FullCalendar
  plugins={[
    dayGridPlugin,
    timeGridPlugin,
    listPlugin,
    interactionPlugin,
  ]}
  initialView="dayGridMonth"
  timeZone="local"
  headerToolbar={{
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,listWeek",
  }}
  eventTimeFormat={{
    hour: "numeric",
    minute: "2-digit",
    meridiem: "short",
  }}
  height="auto"
  selectable
  editable={false}
  events={events}
/>
    </div>
  );
}