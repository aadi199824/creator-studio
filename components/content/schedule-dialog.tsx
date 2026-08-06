"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CalendarService } from "@/lib/services/calendar.service";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  topic: string;
  onScheduled: () => void;
}

export default function ScheduleDialog({
  open,
  onOpenChange,
  contentId,
  topic,
  onScheduled,
}: ScheduleDialogProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);

  async function handleSchedule() {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    if (!time) {
      toast.error("Please select a time.");
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      toast.error("Please select a valid time.");
      return;
    }

    const scheduledDate = new Date(date);

    scheduledDate.setHours(
      hours,
      minutes,
      0,
      0
    );

    try {
      setLoading(true);

      const { error } =
        await CalendarService.scheduleContent(
          contentId,
          scheduledDate.toISOString()
        );

      if (error) {
        console.error(
          "Schedule Content Error:",
          error
        );

        toast.error(
          "Failed to schedule content."
        );

        return;
      }

      toast.success(
        "Content scheduled successfully."
      );

      onScheduled();

      onOpenChange(false);

      // Reset form
      setDate(undefined);
      setTime("10:00");
    } catch (error) {
      console.error(
        "Schedule Content Error:",
        error
      );

      toast.error(
        "Failed to schedule content."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Schedule Content
          </DialogTitle>

          <DialogDescription>
            Schedule &quot;{topic}&quot; for
            publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Date
            </label>

            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left"
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />

                {date
                  ? format(date, "PPP")
                  : "Pick a date"}
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Time
            </label>

            <input
              type="time"
              value={time}
              onChange={(e) =>
                setTime(e.target.value)
              }
              className="w-full rounded-md border p-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSchedule}
            disabled={loading || !date}
          >
            {loading
              ? "Scheduling..."
              : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}