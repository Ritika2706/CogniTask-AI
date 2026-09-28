import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Task } from '@/hooks/useTasks';

interface DailyScheduleProps {
  tasks: Task[];
  onAddTask: () => void;
}

const timeSlots = [
  { time: '8:00 AM', label: '8:00' },
  { time: '10:00 AM', label: '10:00' },
  { time: '1:00 PM', label: '13:00' },
  { time: '3:00 PM', label: '15:00' },
];

const categoryColors: Record<string, string> = {
  work: 'bg-primary',
  study: 'bg-accent',
  exercise: 'bg-success',
  personal: 'bg-warning',
  general: 'bg-muted-foreground',
};

export function DailySchedule({ tasks, onAddTask }: DailyScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    return isSameDay(new Date(task.due_date), currentDate);
  });

  const getTasksForTimeSlot = (timeLabel: string) => {
    return todayTasks.filter(task => {
      if (!task.due_time) return false;
      const hour = parseInt(task.due_time.split(':')[0]);
      const slotHour = parseInt(timeLabel.split(':')[0]);
      return hour >= slotHour && hour < slotHour + 2;
    });
  };

  return (
    <Card className="card-glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Daily Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Today, {format(currentDate, 'EEE MMM d')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week Calendar */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, currentDate);
            return (
              <button
                key={i}
                onClick={() => setCurrentDate(day)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg transition-all",
                  isSelected && "bg-primary text-primary-foreground",
                  isToday && !isSelected && "bg-primary/10 text-primary",
                  !isSelected && !isToday && "hover:bg-muted"
                )}
              >
                <span className="text-xs">{format(day, 'EEE')}</span>
                <span className={cn(
                  "text-lg font-semibold",
                  isSelected && "text-primary-foreground"
                )}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-center gap-2 mb-4 p-4 bg-muted/50 rounded-xl">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span className="text-3xl font-display font-bold">
            {format(new Date(), 'h:mm')}<span className="text-lg">{format(new Date(), 'a')}</span>
          </span>
        </div>

        {/* Task Slots */}
        <div className="space-y-2 mb-4">
          {timeSlots.map((slot, i) => {
            const slotTasks = getTasksForTimeSlot(slot.label);
            const task = slotTasks[0] || todayTasks[i];
            return (
              <div
                key={slot.time}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded",
                  task ? categoryColors[task.category || 'general'] + ' text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {slot.time}
                </span>
                <span className="text-sm font-medium flex-1 truncate">
                  {task?.title || '—'}
                </span>
              </div>
            );
          })}
        </div>

        <Button onClick={onAddTask} className="w-full btn-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </CardContent>
    </Card>
  );
}
