import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  priority: string;
  category?: string;
  status: string;
  created_at: string;
}

interface HistoricalData {
  completedTasks: number;
  averageCompletionTime: number;
  categoryPerformance: Record<string, number>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks, historicalData } = await req.json() as { 
      tasks: Task[]; 
      historicalData?: HistoricalData 
    };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date().toISOString().split('T')[0];
    
    const systemPrompt = `You are an AI task prioritization assistant for CogniTask AI. Your job is to analyze tasks and assign priority scores based on:
1. Deadline urgency (tasks due today or overdue get highest priority)
2. Original priority setting (high > medium > low)
3. Time of day for time-sensitive tasks
4. Historical completion patterns if provided
5. Task dependencies and logical ordering

For each task, provide a priority score from 0-100 and a brief reasoning.
Today's date is: ${today}

${historicalData ? `Historical context:
- User has completed ${historicalData.completedTasks} tasks
- Average completion time: ${historicalData.averageCompletionTime} hours
- Category performance: ${JSON.stringify(historicalData.categoryPerformance)}` : ''}

Respond with a JSON array of objects with this structure:
[{"id": "task_id", "score": 85, "reasoning": "Due today, high priority marked"}]

Be concise with reasoning (max 50 characters).`;

    const userPrompt = `Analyze and prioritize these tasks:\n${JSON.stringify(tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      due_date: t.due_date,
      due_time: t.due_time,
      priority: t.priority,
      category: t.category,
      status: t.status
    })), null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse the JSON response
    let priorities;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        priorities = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: generate basic priorities based on due dates
      priorities = tasks.map(task => {
        let score = 50;
        if (task.priority === 'high') score += 25;
        if (task.priority === 'low') score -= 15;
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          const now = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue <= 0) score += 30;
          else if (daysUntilDue <= 1) score += 20;
          else if (daysUntilDue <= 3) score += 10;
        }
        return {
          id: task.id,
          score: Math.min(100, Math.max(0, score)),
          reasoning: task.due_date && new Date(task.due_date) <= new Date() ? "Overdue task" : `${task.priority} priority`
        };
      });
    }

    return new Response(JSON.stringify({ priorities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI prioritize error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
