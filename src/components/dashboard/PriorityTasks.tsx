import { AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

interface PriorityTasksProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
}

export function PriorityTasks({ tasks, onToggleComplete }: PriorityTasksProps) {
  const priorityTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => (b.ai_priority_score || 0) - (a.ai_priority_score || 0))
    .slice(0, 5);

  const getDueLabel = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    if (isToday(date)) return { text: 'Due Today', className: 'text-destructive' };
    if (isTomorrow(date)) return { text: 'Due Tomorrow', className: 'text-warning' };
    if (isPast(date)) return { text: 'Overdue', className: 'text-destructive font-bold' };
    return { text: format(date, 'MMM d'), className: 'text-muted-foreground' };
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-destructive bg-destructive/5';
      case 'medium':
        return 'border-l-warning bg-warning/5';
      case 'low':
        return 'border-l-success bg-success/5';
      default:
        return 'border-l-muted';
    }
  };

  return (
    <Card className="card-glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          Priority Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priorityTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending tasks. Great job! 🎉
          </p>
        ) : (
          priorityTasks.map((task) => {
            const dueLabel = getDueLabel(task.due_date);
            return (
              <div
                key={task.id}
                className={cn(
                  "p-3 rounded-lg border-l-4 transition-all hover:shadow-sm animate-fade-in",
                  getPriorityStyles(task.priority)
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => onToggleComplete(task.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{task.title}</span>
                      {task.ai_priority_score && task.ai_priority_score > 70 && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          AI Priority
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs capitalize",
                          task.priority === 'high' && 'border-destructive text-destructive',
                          task.priority === 'medium' && 'border-warning text-warning',
                          task.priority === 'low' && 'border-success text-success'
                        )}
                      >
                        {task.priority} Priority
                      </Badge>
                      {dueLabel && (
                        <span className={cn("flex items-center gap-1", dueLabel.className)}>
                          <Clock className="w-3 h-3" />
                          {dueLabel.text}
                        </span>
                      )}
                    </div>
                    {task.ai_reasoning && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        AI: {task.ai_reasoning}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
