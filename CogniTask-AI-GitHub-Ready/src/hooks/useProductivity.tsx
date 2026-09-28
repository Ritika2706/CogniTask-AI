import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export interface ProductivityStats {
  tasksCompleted: number;
  productiveHours: number;
  habitsCompleted: number;
  weeklyTaskData: { day: string; work: number; study: number; exercise: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  dailyStats: { date: string; tasks: number; score: number }[];
}

export function useProductivity() {
  const [stats, setStats] = useState<ProductivityStats>({
    tasksCompleted: 0,
    productiveHours: 0,
    habitsCompleted: 0,
    weeklyTaskData: [],
    categoryBreakdown: [],
    dailyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const sevenDaysAgo = subDays(new Date(), 6);
      
      // Fetch completed tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', thirtyDaysAgo);

      if (tasksError) throw tasksError;

      // Fetch habit logs
      const { data: habitLogs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_date', thirtyDaysAgo);

      if (logsError) throw logsError;

      // Calculate category breakdown
      const categoryCount: Record<string, number> = {};
      tasks?.forEach(task => {
        const cat = task.category || 'general';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const categoryColors: Record<string, string> = {
        work: '#3B82F6',
        study: '#10B981',
        exercise: '#F59E0B',
        personal: '#8B5CF6',
        general: '#6B7280',
      };

      const categoryBreakdown = Object.entries(categoryCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: categoryColors[name] || '#6B7280',
      }));

      // Calculate weekly task data
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
      const weeklyTaskData = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = tasks?.filter(t => 
          t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === dateStr
        ) || [];
        
        return {
          day: format(day, 'EEE'),
          work: dayTasks.filter(t => t.category === 'work').length,
          study: dayTasks.filter(t => t.category === 'study').length,
          exercise: dayTasks.filter(t => t.category === 'exercise').length,
        };
      });

      // Daily stats for chart
      const dailyStats = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = tasks?.filter(t => 
          t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === dateStr
        ).length || 0;
        
        const dayHabits = habitLogs?.filter(l => l.completed_date === dateStr).length || 0;
        
        return {
          date: format(day, 'dd'),
          tasks: dayTasks,
          score: Math.min(100, (dayTasks * 15) + (dayHabits * 10)),
        };
      });

      // Calculate today's habit completion
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayHabits = habitLogs?.filter(l => l.completed_date === today).length || 0;

      setStats({
        tasksCompleted: tasks?.length || 0,
        productiveHours: Math.round((tasks?.length || 0) * 0.75),
        habitsCompleted: todayHabits,
        weeklyTaskData,
        categoryBreakdown,
        dailyStats,
      });
    } catch (error) {
      console.error('Error fetching productivity stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
