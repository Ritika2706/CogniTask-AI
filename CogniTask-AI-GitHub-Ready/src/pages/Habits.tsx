import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AddHabitDialog } from '@/components/habits/AddHabitDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Flame, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Habits() {
  const { user, loading: authLoading } = useAuth();
  const { habits, loading, addHabit, toggleHabitComplete, deleteHabit } = useHabits();
  const [showAddHabit, setShowAddHabit] = useState(false);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout title="Habits">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">Track your daily habits and build streaks</p>
        <Button onClick={() => setShowAddHabit(true)} className="btn-gradient-primary"><Plus className="w-4 h-4 mr-1" />New Habit</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : habits.length === 0 ? (
        <Card className="card-glass"><CardContent className="py-12 text-center text-muted-foreground">No habits yet. Create your first habit!</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => (
            <Card key={habit.id} className="card-glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: habit.color + '20' }}>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: habit.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{habit.name}</h3>
                      {habit.currentStreak > 0 && (
                        <div className="flex items-center gap-1 text-warning text-sm">
                          <Flame className="w-4 h-4" />{habit.currentStreak} day streak!
                        </div>
                      )}
                    </div>
                  </div>
                  <Checkbox checked={habit.completedToday} onCheckedChange={() => toggleHabitComplete(habit.id)} className="h-6 w-6" />
                </div>
                <div className="flex gap-1 mb-3">
                  {daysOfWeek.map((day, i) => (
                    <div key={i} className={cn("flex-1 h-8 rounded flex items-center justify-center text-xs font-medium", habit.weeklyProgress[i] ? "text-white" : "bg-muted/50 text-muted-foreground")} style={habit.weeklyProgress[i] ? { backgroundColor: habit.color } : {}}>
                      {habit.weeklyProgress[i] ? <Check className="w-3 h-3" /> : day[0]}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteHabit(habit.id)} className="w-full text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <AddHabitDialog open={showAddHabit} onOpenChange={setShowAddHabit} onSubmit={addHabit} />
    </DashboardLayout>
  );
}
