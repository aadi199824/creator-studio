import Calendar from "@/components/calendar/calendar";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Content Calendar
        </h1>

        <p className="text-gray-500">
          Plan and manage your scheduled content.
        </p>
      </div>

      <Calendar />
    </div>
  );
}