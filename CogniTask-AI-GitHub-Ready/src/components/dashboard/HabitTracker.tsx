import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HabitWithStreak } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { Target, Flame, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HabitTrackerProps {
  habits: HabitWithStreak[];
  onToggleHabit: (id: string) => void;
}

const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HabitTracker({ habits, onToggleHabit }: HabitTrackerProps) {
  const topHabits = habits.slice(0, 3);

  return (
    <Card className="card-glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          Habit Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No habits yet. Start tracking!
          </p>
        ) : (
          topHabits.map((habit) => (
            <div
              key={habit.id}
              className="p-3 rounded-xl bg-muted/30 border border-border/50 animate-fade-in"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  <Target className="w-6 h-6" style={{ color: habit.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{habit.name}</span>
                    {habit.currentStreak >= 3 && (
                      <div className="flex items-center gap-1 text-warning text-xs">
                        <Flame className="w-3 h-3" />
                        {habit.currentStreak} Days!
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {habit.completedToday ? 'Completed today!' : 'Not completed yet'}
                  </p>
                </div>
                <Checkbox
                  checked={habit.completedToday}
                  onCheckedChange={() => onToggleHabit(habit.id)}
                  className="h-6 w-6"
                />
              </div>

              {/* Weekly Progress */}
              <div className="flex items-center gap-1">
                {daysOfWeek.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-7 rounded flex items-center justify-center text-xs font-medium transition-all",
                      habit.weeklyProgress[i]
                        ? "text-white"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                    style={habit.weeklyProgress[i] ? { backgroundColor: habit.color } : {}}
                  >
                    {habit.weeklyProgress[i] ? <Check className="w-3 h-3" /> : day}
                  </div>
                ))}
              </div>

              {habit.currentStreak >= 5 && (
                <div className="mt-3 text-center">
                  <p className="text-sm font-medium text-success">
                    🎉 Excellent Streak!
                  </p>
                </div>
              )}
            </div>
          ))
        )}

        <Link to="/habits">
          <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
            View All Habits
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
