import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductivityStats } from '@/hooks/useProductivity';
import { TrendingUp, CheckCircle2, Clock, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface ProductivityInsightsProps {
  stats: ProductivityStats;
}

export function ProductivityInsights({ stats }: ProductivityInsightsProps) {
  const statCards = [
    { 
      icon: CheckCircle2, 
      value: stats.tasksCompleted, 
      label: 'Tasks Completed',
      color: 'text-success'
    },
    { 
      icon: Clock, 
      value: stats.productiveHours, 
      label: 'Productive Hours',
      color: 'text-primary'
    },
    { 
      icon: Target, 
      value: stats.habitsCompleted, 
      label: 'Days Habit Met',
      color: 'text-warning'
    },
  ];

  return (
    <Card className="card-glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Productivity Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {statCards.map((stat, i) => (
            <div 
              key={i}
              className="text-center p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold">{stat.value}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mini Chart */}
        {stats.dailyStats.length > 0 && (
          <div className="h-20 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyStats}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {stats.dailyStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.score > 50 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <Link to="/reports">
          <Button className="w-full btn-gradient-primary">
            View Reports
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
