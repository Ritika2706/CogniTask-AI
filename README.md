# CogniTask AI

CogniTask AI is a final-year engineering group project for intelligent personal task planning and productivity management.

## Overview

The application combines task management, habit tracking, productivity reporting, Supabase-backed authentication and data storage, and AI-assisted task prioritization.

The AI prioritization workflow considers factors such as deadline urgency, user-defined priority, time sensitivity, historical completion patterns, and task ordering. The AI service returns a priority score with a short explanation and includes a fallback prioritization path when the AI response cannot be parsed.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, PostgreSQL, Edge Functions)
- Recharts
- Vitest

## Main Features

- User authentication
- Task creation and management
- AI-assisted task prioritization
- Habit tracking
- Daily schedule / priority views
- Productivity reports and analytics
- Supabase Row Level Security policies

## Project Structure

```text
src/
  components/       Reusable UI and feature components
  hooks/            Authentication, tasks, habits and productivity hooks
  integrations/     Supabase client and generated types
  pages/            Application pages
  lib/              Shared utilities
supabase/
  functions/        Supabase Edge Functions
  migrations/       Database schema and policies
public/              Static assets
```
