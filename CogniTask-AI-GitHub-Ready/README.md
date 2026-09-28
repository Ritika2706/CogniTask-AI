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

## Local Setup

### 1. Requirements

Install Node.js and npm.

### 2. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd CogniTask-AI
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file from `.env.example` and add the Supabase project values for your own environment.

```bash
cp .env.example .env
```

On Windows, you can also create `.env` manually using the same variable names.

### 5. Start the application

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

### 7. Run tests

```bash
npm test
```

## Important Security Note

Do not commit `.env` files, API secrets, service-role keys, passwords, or other credentials. Only `.env.example` should be stored in GitHub.

## Academic Project

This repository contains a final-year engineering group project. Team members and their individual contributions should be credited in the repository according to the team's final project documentation.
