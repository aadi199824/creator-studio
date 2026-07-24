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
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);

  async function handleSchedule() {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);

    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours);
    scheduledDate.setMinutes(minutes);
    scheduledDate.setSeconds(0);

    setLoading(true);

    const { error } =
      await CalendarService.scheduleContent(
        contentId,
        scheduledDate.toISOString()
      );

    setLoading(false);

    if (error) {
      toast.error("Failed to schedule content.");
      return;
    }

    toast.success("Content scheduled successfully.");

    onScheduled();
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
            Schedule "{topic}" for publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Date
            </label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />

                  {date
                    ? format(date, "PPP")
                    : "Pick a date"}
                </Button>
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
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            onClick={handleSchedule}
            disabled={loading}
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