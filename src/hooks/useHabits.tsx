import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  count: number;
  notes: string | null;
  created_at: string;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  completedToday: boolean;
  weeklyProgress: boolean[];
}

export interface NewHabit {
  name: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  target_count?: number;
  color?: string;
  icon?: string;
}

export function useHabits() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const calculateStreak = (habitId: string, logs: HabitLog[]): number => {
    const habitLogs = logs
      .filter(log => log.habit_id === habitId)
      .sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());
    
    if (habitLogs.length === 0) return 0;

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Check if completed today or yesterday to start counting
    if (habitLogs[0].completed_date !== today && habitLogs[0].completed_date !== yesterday) {
      return 0;
    }

    for (let i = 0; i < habitLogs.length; i++) {
      const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = habitLogs.find(l => l.completed_date === expectedDate);
      
      if (log) {
        streak++;
      } else if (i === 0 && habitLogs[0].completed_date === yesterday) {
        // Allow starting from yesterday
        continue;
      } else {
        break;
      }
    }

    return streak;
  };

  const getWeeklyProgress = (habitId: string, logs: HabitLog[]): boolean[] => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return daysOfWeek.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return logs.some(log => log.habit_id === habitId && log.completed_date === dateStr);
    });
  };

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    
    try {
      const [habitsRes, logsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('completed_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      const logs = logsRes.data as HabitLog[];
      setHabitLogs(logs);

      const today = format(new Date(), 'yyyy-MM-dd');
      const habitsWithStreak = (habitsRes.data as Habit[]).map(habit => ({
        ...habit,
        currentStreak: calculateStreak(habit.id, logs),
        completedToday: logs.some(log => log.habit_id === habit.id && log.completed_date === today),
        weeklyProgress: getWeeklyProgress(habit.id, logs),
      }));

      setHabits(habitsWithStreak);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load habits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (newHabit: NewHabit) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: newHabit.name,
          description: newHabit.description || null,
          frequency: newHabit.frequency || 'daily',
          target_count: newHabit.target_count || 1,
          color: newHabit.color || '#3B82F6',
          icon: newHabit.icon || 'check',
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchHabits();
      toast({
        title: 'Habit created',
        description: 'Your new habit has been added',
      });
      
      return data as Habit;
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to add habit',
        variant: 'destructive',
      });
      return null;
    }
  };

  const toggleHabitComplete = async (habitId: string) => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const existingLog = habitLogs.find(
      log => log.habit_id === habitId && log.completed_date === today
    );

    try {
      if (existingLog) {
        // Remove completion
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLog.id);

        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: today,
          });

        if (error) throw error;
      }

      await fetchHabits();
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to update habit',
        variant: 'destructive',
      });
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHabits(prev => prev.filter(h => h.id !== id));
      toast({
        title: 'Habit deleted',
        description: 'Habit has been removed',
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete habit',
        variant: 'destructive',
      });
    }
  };

  return {
    habits,
    habitLogs,
    loading,
    addHabit,
    toggleHabitComplete,
    deleteHabit,
    refetch: fetchHabits,
  };
}
