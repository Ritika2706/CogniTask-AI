import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, Task } from '@/hooks/useTasks';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles, Loader2, Calendar, Clock, Repeat, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading, addTask, toggleComplete, deleteTask, prioritizing, prioritizeTasks } = useTasks();
  const { playSuccess, playReminder } = useNotificationSound();
  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Play reminder sound for tasks due soon
  useEffect(() => {
    const checkDueTasks = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status !== 'completed' && task.reminder_enabled && task.due_date && task.due_time) {
          const dueDateTime = new Date(`${task.due_date}T${task.due_time}`);
          const timeDiff = dueDateTime.getTime() - now.getTime();
          // Play reminder if task is due within 15 minutes
          if (timeDiff > 0 && timeDiff <= 15 * 60 * 1000) {
            playReminder();
          }
        }
      });
    };
    
    checkDueTasks();
    const interval = setInterval(checkDueTasks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks, playReminder]);

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== 'completed') {
      playSuccess();
    }
    await toggleComplete(taskId);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const filteredTasks = tasks.filter(t => filter === 'all' ? true : filter === 'completed' ? t.status === 'completed' : t.status !== 'completed');

  return (
    <DashboardLayout title="Tasks">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={prioritizeTasks} disabled={prioritizing} variant="outline" size="sm"><Sparkles className="w-4 h-4 mr-1" />{prioritizing ? 'Working...' : 'AI Prioritize'}</Button>
          <Button onClick={() => setShowAddTask(true)} className="btn-gradient-primary"><Plus className="w-4 h-4 mr-1" />Add Task</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filteredTasks.length === 0 ? (
        <Card className="card-glass"><CardContent className="py-12 text-center text-muted-foreground">No tasks found. Add your first task!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <Card key={task.id} className={cn("card-glass transition-all", task.status === 'completed' && 'opacity-60')}>
              <CardContent className="p-4 flex items-center gap-4">
                <Checkbox checked={task.status === 'completed'} onCheckedChange={() => handleToggleComplete(task.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("font-medium", task.status === 'completed' && 'line-through')}>{task.title}</span>
                    <Badge variant="outline" className={cn("text-xs capitalize", task.priority === 'high' && 'border-destructive text-destructive', task.priority === 'medium' && 'border-warning text-warning', task.priority === 'low' && 'border-success text-success')}>{task.priority}</Badge>
                    {task.ai_priority_score && task.ai_priority_score > 70 && <Badge variant="secondary" className="text-xs">AI: {task.ai_priority_score}</Badge>}
                    {task.repeat_frequency && task.repeat_frequency !== 'none' && (
                      <Badge variant="outline" className="text-xs capitalize flex items-center gap-1">
                        <Repeat className="w-3 h-3" />{task.repeat_frequency}
                      </Badge>
                    )}
                    {task.reminder_enabled && (
                      <Bell className="w-3 h-3 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {task.start_date && task.end_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d')}
                      </span>
                    )}
                    {task.due_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {format(new Date(task.due_date), 'MMM d')}</span>}
                    {task.due_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.due_time}</span>}
                    {task.category && <Badge variant="secondary" className="text-xs capitalize">{task.category}</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <AddTaskDialog open={showAddTask} onOpenChange={setShowAddTask} onSubmit={addTask} />
    </DashboardLayout>
  );
}
