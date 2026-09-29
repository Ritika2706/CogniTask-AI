import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  start_date: string | null;
  end_date: string | null;
  repeat_frequency: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  reminder_enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  ai_priority_score: number | null;
  ai_reasoning: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewTask {
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  start_date?: string;
  end_date?: string;
  repeat_frequency?: 'none' | 'daily' | 'weekly' | 'monthly';
  reminder_enabled?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [prioritizing, setPrioritizing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('ai_priority_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (newTask: NewTask) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTask.title,
          description: newTask.description || null,
          due_date: newTask.due_date || null,
          due_time: newTask.due_time || null,
          start_date: newTask.start_date || null,
          end_date: newTask.end_date || null,
          repeat_frequency: newTask.repeat_frequency || null,
          reminder_enabled: newTask.reminder_enabled || false,
          priority: newTask.priority || 'medium',
          category: newTask.category || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data as Task, ...prev]);
      toast({
        title: 'Task created',
        description: 'Your task has been added successfully',
      });
      
      // Trigger AI prioritization after adding
      setTimeout(() => prioritizeTasks(), 500);
      
      return data as Task;
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: 'Failed to add task',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === id ? data as Task : t));
      return data as Task;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Task deleted',
        description: 'Task has been removed',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const prioritizeTasks = async () => {
    if (!user || tasks.length === 0) return;
    
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    if (pendingTasks.length === 0) return;

    setPrioritizing(true);
    try {
      const response = await supabase.functions.invoke('ai-prioritize', {
        body: {
          tasks: pendingTasks,
          historicalData: {
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            averageCompletionTime: 2,
            categoryPerformance: {}
          }
        }
      });

      if (response.error) throw response.error;

      const { priorities } = response.data;
      
      // Update tasks with AI scores
      for (const priority of priorities) {
        await supabase
          .from('tasks')
          .update({
            ai_priority_score: priority.score,
            ai_reasoning: priority.reasoning
          })
          .eq('id', priority.id);
      }

      await fetchTasks();
      toast({
        title: 'AI Prioritization Complete',
        description: 'Tasks have been re-prioritized based on deadlines and importance',
      });
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
      toast({
        title: 'AI Prioritization Failed',
        description: 'Using default priority order',
        variant: 'destructive',
      });
    } finally {
      setPrioritizing(false);
    }
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(id, { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    });
  };

  return {
    tasks,
    loading,
    prioritizing,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    prioritizeTasks,
    refetch: fetchTasks,
  };
}
