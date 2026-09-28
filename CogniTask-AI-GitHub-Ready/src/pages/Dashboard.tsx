import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useProductivity } from '@/hooks/useProductivity';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DailySchedule } from '@/components/dashboard/DailySchedule';
import { PriorityTasks } from '@/components/dashboard/PriorityTasks';
import { HabitTracker } from '@/components/dashboard/HabitTracker';
import { ProductivityInsights } from '@/components/dashboard/ProductivityInsights';
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading: tasksLoading, addTask, toggleComplete, prioritizing, prioritizeTasks } = useTasks();
  const { habits, toggleHabitComplete } = useHabits();
  const { stats } = useProductivity();
  const [showAddTask, setShowAddTask] = useState(false);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Plan your tasks and stay productive!</h2>
          <p className="text-muted-foreground">AI-powered prioritization helps you focus on what matters</p>
        </div>
        <Button onClick={prioritizeTasks} disabled={prioritizing} variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          {prioritizing ? 'Prioritizing...' : 'AI Prioritize'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <DailySchedule tasks={tasks} onAddTask={() => setShowAddTask(true)} />
            <PriorityTasks tasks={tasks} onToggleComplete={toggleComplete} />
          </div>
          <HabitTracker habits={habits} onToggleHabit={toggleHabitComplete} />
        </div>
        <div className="space-y-6">
          <ProductivityInsights stats={stats} />
        </div>
      </div>

      <AddTaskDialog open={showAddTask} onOpenChange={setShowAddTask} onSubmit={addTask} />
    </DashboardLayout>
  );
}
