# MindBridge AI

A Gemma 4-powered mental wellness companion that helps students understand their emotions, reflect safely, and get guided support.

MindBridge AI is not a replacement for therapy or medical diagnosis. It is a supportive reflection tool for emotional awareness and self-care.

## Problem Statement

Many students feel stressed, anxious, lonely, or overwhelmed but do not always know how to explain what they are feeling. Some students hesitate to talk to others immediately. They need a safe first step where they can write freely, understand their mood, and get simple supportive guidance.

## Solution

MindBridge AI lets users write how they feel. The app uses Gemma 4 through local Ollama to analyze the journal text gently and provide:

- Mood understanding
- Emotion breakdown
- Supportive reflection
- Safe next-step suggestions
- Reflection prompts
- Mood trend dashboard
- Emergency safety message for concerning text

If the user writes something seriously concerning, the app shows:

```text
Please talk to a trusted person immediately or contact local emergency/help services.
```

## How Gemma 4 Is Used

Gemma 4 is used to understand the user's journal text, detect emotional tone, generate supportive reflections, and suggest safe coping actions.

The app sends the journal entry to a local Ollama model:

```text
gemma4:latest
```

Gemma 4 returns structured JSON containing:

- Detected mood
- Possible reason
- Emotion tags
- Supportive message
- Suggested actions
- Reflection prompt
- Safety flag

The app also includes local safety guardrails and local mood inference so the selected mood button does not override the user's journal text.

## Demo Features

- Daily mood check-in: Happy, Okay, Stressed, Sad, Angry, Tired
- Journal input for free-form reflection
- Gemma 4-powered response
- Mood dashboard with a 7-day Recharts trend
- Reflection prompts
- Emergency safety message
- One-page comic-inspired website design

## Tech Stack

- Frontend: React, TypeScript, Vite
- Styling: Tailwind CSS
- AI: Gemma 4 through Ollama
- Charts: Recharts
- Icons: Lucide React
- Deployment targets: Vercel for frontend, Render or another backend host if a deployed Ollama-backed API is needed

## Run Locally

Install dependencies:

```bash
npm install
```

Start Ollama:

```bash
ollama serve
```

Make sure Gemma 4 is available:

```bash
ollama list
```

If needed, pull the model:

```bash
ollama pull gemma4:latest
```

Start the app:

```bash
npm run dev -- --host 0.0.0.0
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Safety and Privacy Notes

- No API keys are required for the local Ollama demo.
- Do not commit API keys, tokens, or secrets.
- The Vite dev server proxies `/ollama` requests to local Ollama at `http://127.0.0.1:11434`.
- A deployed Vercel frontend cannot directly access Ollama running on a local laptop. For deployment, use a backend service that can securely reach an Ollama server or replace it with a hosted model API.

## Pitch Line

We are not trying to replace therapists. We are building the first safe step between feeling overwhelmed and asking for help. Gemma 4 helps users reflect, understand their emotions, and take small positive actions.
