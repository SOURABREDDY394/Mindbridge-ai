import { useMemo, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Wind,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type MoodLabel = 'Happy' | 'Okay' | 'Stressed' | 'Sad' | 'Angry' | 'Tired';

type Analysis = {
  detectedMood: MoodLabel;
  possibleReason: string;
  emotions: string[];
  message: string;
  actions: string[];
  prompt: string;
  safetyAlert: boolean;
};

type OllamaGenerateResponse = {
  response?: string;
};

const safetyLine =
  'MindBridge AI is not a replacement for therapy or medical diagnosis. It is a supportive reflection tool for emotional awareness and self-care.';

const moods: Array<{ label: MoodLabel; value: number }> = [
  { label: 'Happy', value: 6 },
  { label: 'Okay', value: 5 },
  { label: 'Stressed', value: 3 },
  { label: 'Sad', value: 2 },
  { label: 'Angry', value: 2.5 },
  { label: 'Tired', value: 3.5 },
];

const baseTrend = [
  { day: 'Mon', mood: 4.2, label: 'Okay' },
  { day: 'Tue', mood: 3.3, label: 'Tired' },
  { day: 'Wed', mood: 2.4, label: 'Sad' },
  { day: 'Thu', mood: 3.1, label: 'Stressed' },
  { day: 'Fri', mood: 4.8, label: 'Okay' },
  { day: 'Sat', mood: 5.6, label: 'Happy' },
];

const concerningTerms = [
  'suicide',
  'kill myself',
  'end my life',
  'self harm',
  'hurt myself',
  'not want to live',
  'die',
];

const moodSignals: Record<MoodLabel, string[]> = {
  Happy: [
    'happy',
    'enjoy',
    'enjoyed',
    'great',
    'good',
    'amazing',
    'excited',
    'calm',
    'content',
    'proud',
    'fun',
    'peaceful',
    'better',
  ],
  Okay: ['okay', 'fine', 'normal', 'alright', 'manageable', 'neutral'],
  Stressed: ['stress', 'stressed', 'overwhelmed', 'pressure', 'deadline', 'workload', 'exam', 'busy'],
  Sad: ['sad', 'lonely', 'alone', 'cry', 'upset', 'hopeless', 'low'],
  Angry: ['angry', 'irritated', 'frustrated', 'annoyed', 'mad'],
  Tired: ['tired', 'sleepy', 'exhausted', 'drained', 'burnout', 'fatigue'],
};

function hasSafetyConcern(text: string) {
  const content = text.toLowerCase();
  return concerningTerms.some((term) => content.includes(term));
}

function inferMoodFromJournal(text: string, selectedMood: MoodLabel): MoodLabel {
  const content = text.toLowerCase();
  const scoredMoods = moods.map(({ label }) => ({
    label,
    score: moodSignals[label].reduce(
      (total, term) => total + (content.includes(term) ? 1 : 0),
      0,
    ),
  }));
  const bestMood = scoredMoods.reduce((best, mood) => (mood.score > best.score ? mood : best));

  return bestMood.score > 0 ? bestMood.label : selectedMood;
}

function analyzeJournal(text: string, selectedMood: MoodLabel): Analysis {
  const content = text.toLowerCase();
  const safetyAlert = hasSafetyConcern(text);
  const inferredMood = inferMoodFromJournal(text, selectedMood);

  if (safetyAlert) {
    return {
      detectedMood: 'Sad',
      possibleReason: 'Serious emotional distress',
      emotions: ['distress', 'fear', 'overwhelm', 'loneliness'],
      message:
        'Please talk to a trusted person immediately or contact local emergency/help services.',
      actions: [
        'Move near someone you trust right now',
        'Contact local emergency/help services',
        'Avoid staying alone while the feeling is intense',
      ],
      prompt: 'Who is the safest person you can contact immediately?',
      safetyAlert: true,
    };
  }

  if (inferredMood === 'Happy') {
    return {
      detectedMood: 'Happy',
      possibleReason: 'Positive experience or enjoyable moment',
      emotions: ['enjoyment', 'calm', 'contentment'],
      message:
        'It sounds like you had a genuinely enjoyable moment. Notice what made it feel good, because those details can help you understand what supports your wellbeing.',
      actions: [
        'Write one thing that made the event enjoyable',
        'Save the memory as a positive note for later',
        'Share the good moment with someone trusted',
      ],
      prompt: 'What part of today would you like to remember?',
      safetyAlert: false,
    };
  }

  if (
    inferredMood === 'Stressed' ||
    content.includes('college') ||
    content.includes('internship') ||
    content.includes('work')
  ) {
    return {
      detectedMood: 'Stressed',
      possibleReason: 'Workload pressure',
      emotions: ['stress', 'burnout', 'confusion', 'mental tiredness'],
      message:
        'You seem stressed and mentally tired. It makes sense to feel this way when college work and internship pressure are competing for your attention.',
      actions: [
        'Take a 10-minute break',
        'Write 3 priorities for the next study block',
        'Talk to someone trusted before the pressure builds up',
      ],
      prompt: 'What is one deadline that needs attention first?',
      safetyAlert: false,
    };
  }

  if (inferredMood === 'Sad' || content.includes('lonely') || content.includes('alone')) {
    return {
      detectedMood: 'Sad',
      possibleReason: 'Feeling disconnected',
      emotions: ['sadness', 'loneliness', 'uncertainty'],
      message:
        'You may be carrying a quiet kind of loneliness. Writing it down is a useful first step, and you do not have to solve the whole feeling at once.',
      actions: [
        'Send one simple message to a trusted person',
        'Step outside or change your environment for a few minutes',
        'Write one thing you wish someone understood today',
      ],
      prompt: 'Who feels easiest to reach out to today?',
      safetyAlert: false,
    };
  }

  return {
    detectedMood: inferredMood,
    possibleReason: 'General emotional check-in',
    emotions: ['reflection', 'tiredness', 'uncertainty'],
    message:
      'You seem to be processing a lot. A calm reflection and one small next step may help the day feel more manageable.',
    actions: ['Drink water and pause for two minutes', 'Write one controllable task', 'Set a gentle sleep reminder'],
    prompt: 'What is one small thing you can control right now?',
    safetyAlert: false,
  };
}

function gemmaPrompt(text: string, selectedMood: MoodLabel) {
  return `Analyze this student wellness journal. Be calm, brief, supportive, and non-medical.
Selected mood button, if any: ${selectedMood}
Important: infer detectedMood mainly from the journal text. If the student says they enjoyed something, had fun, felt good, or had a positive experience, detectedMood should usually be Happy or Okay, not Stressed.
Journal text: ${text}

Return valid JSON only:
{
  "detectedMood": "Happy | Okay | Stressed | Sad | Angry | Tired",
  "possibleReason": "short reason",
  "emotions": ["emotion", "emotion", "emotion"],
  "message": "supportive reflection, not medical advice",
  "actions": ["action 1", "action 2", "action 3"],
  "prompt": "one reflection question",
  "safetyAlert": false
}`;
}

function extractJson(content: string) {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Gemma response did not include JSON.');
  }

  return JSON.parse(content.slice(start, end + 1));
}

function normalizeGemmaAnalysis(raw: unknown, fallback: Analysis): Analysis {
  const data = raw as Partial<Analysis>;
  const moodLabels = moods.map((mood) => mood.label);
  const detectedMood = moodLabels.includes(data.detectedMood as MoodLabel)
    ? (data.detectedMood as MoodLabel)
    : fallback.detectedMood;

  return {
    detectedMood,
    possibleReason:
      typeof data.possibleReason === 'string' && data.possibleReason.trim()
        ? data.possibleReason
        : fallback.possibleReason,
    emotions:
      Array.isArray(data.emotions) && data.emotions.length
        ? data.emotions.slice(0, 5).map(String)
        : fallback.emotions,
    message:
      typeof data.message === 'string' && data.message.trim() ? data.message : fallback.message,
    actions:
      Array.isArray(data.actions) && data.actions.length
        ? data.actions.slice(0, 4).map(String)
        : fallback.actions,
    prompt: typeof data.prompt === 'string' && data.prompt.trim() ? data.prompt : fallback.prompt,
    safetyAlert: Boolean(data.safetyAlert),
  };
}

async function analyzeWithGemma4(text: string, selectedMood: MoodLabel): Promise<Analysis> {
  const fallback = analyzeJournal(text, selectedMood);

  if (hasSafetyConcern(text)) {
    return fallback;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  const response = await fetch('/ollama/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'gemma4:latest',
      stream: false,
      format: 'json',
      prompt: gemmaPrompt(text, selectedMood),
      options: {
        temperature: 0.3,
        num_ctx: 2048,
        num_predict: 260,
      },
    }),
  });
  window.clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Ollama request failed with ${response.status}`);
  }

  const payload = (await response.json()) as OllamaGenerateResponse;
  const content = payload.response;

  if (!content) {
    throw new Error('Ollama returned an empty response.');
  }

  const gemmaAnalysis = normalizeGemmaAnalysis(extractJson(content), fallback);
  const journalMood = inferMoodFromJournal(text, selectedMood);

  if (journalMood !== selectedMood && gemmaAnalysis.detectedMood === selectedMood) {
    return {
      ...gemmaAnalysis,
      detectedMood: fallback.detectedMood,
      possibleReason: fallback.possibleReason,
      emotions: fallback.emotions,
    };
  }

  return gemmaAnalysis;
}

export default function App() {
  const [selectedMood, setSelectedMood] = useState<MoodLabel>('Okay');
  const [journal, setJournal] = useState(
    'Today I feel overwhelmed because of college work and internship pressure.',
  );
  const [analysis, setAnalysis] = useState<Analysis>(() =>
    analyzeJournal('Today I feel overwhelmed because of college work and internship pressure.', 'Okay'),
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState('Ready to call local Ollama model gemma4:latest.');

  const trend = useMemo(() => {
    const currentMood = moods.find((mood) => mood.label === analysis.detectedMood)?.value ?? 3;
    return [...baseTrend, { day: 'Today', mood: currentMood, label: analysis.detectedMood }];
  }, [analysis.detectedMood]);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setAiStatus('Calling local Ollama model gemma4:latest...');

    try {
      const gemmaAnalysis = await analyzeWithGemma4(journal, selectedMood);
      setAnalysis(gemmaAnalysis);
      setAiStatus(
        gemmaAnalysis.safetyAlert
          ? 'Safety message shown from local guardrail.'
          : 'Response generated with local Ollama model gemma4:latest.',
      );
    } catch (error) {
      setAnalysis(analyzeJournal(journal, selectedMood));
      setAiStatus(
        error instanceof Error
          ? `Using fallback demo analysis because Ollama was unavailable: ${error.message}`
          : 'Using fallback demo analysis because Ollama was unavailable.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f1d1] text-[#101214]">
      <section className="relative overflow-hidden border-b-[5px] border-black bg-[#fff1a8]">
        <div className="absolute -left-16 top-10 h-40 w-40 rotate-45 bg-[#5fe0bf]" />
        <div className="absolute -right-16 top-28 h-44 w-44 rotate-45 border-[18px] border-black bg-white" />
        <div className="absolute bottom-8 left-6 h-16 w-28 -rotate-12 bg-[#ffd344]" />
        <div className="absolute right-[18%] top-14 text-6xl font-black text-[#2f8f6c]">∞</div>

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <div className="mb-5 inline-flex rounded-full border-[3px] border-black bg-white px-4 py-2 text-sm font-black shadow-[4px_4px_0_#111]">
              Powered by local Ollama · gemma4:latest
            </div>
            <p className="mindbridge-poster-title text-6xl font-black uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">
              Be a
              <span className="ml-3 text-[#40a66f]">Mind</span>
            </p>
            <h1 className="mindbridge-poster-title mt-2 text-6xl font-black uppercase leading-[0.88] text-[#f0cd42] sm:text-7xl lg:text-8xl">
              Bridge!
            </h1>
            <p className="mt-8 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
              A Gemma 4-powered mental wellness companion that helps students understand emotions,
              reflect safely, and take small positive actions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#demo"
                className="rounded-2xl border-[4px] border-black bg-[#2f8f6c] px-6 py-3 text-base font-black text-white shadow-[5px_5px_0_#111]"
              >
                Try the Demo
              </a>
              <a
                href="#dashboard"
                className="rounded-2xl border-[4px] border-black bg-white px-6 py-3 text-base font-black shadow-[5px_5px_0_#111]"
              >
                View Mood Trend
              </a>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border-[5px] border-black bg-white p-5 shadow-[8px_8px_0_#111]">
              <h2 className="text-3xl font-black text-[#2f8f6c]">Daily Check-in</h2>
              <p className="mt-3 text-lg font-bold leading-7">
                Pick a mood, write freely, and understand what you feel.
              </p>
              <Brain className="mx-auto mt-8 h-24 w-24 text-[#121212]" aria-hidden="true" />
            </div>
            <div className="rounded-[1.6rem] border-[5px] border-black bg-white p-5 shadow-[8px_8px_0_#111] sm:mt-20">
              <p className="text-xl font-black leading-7">Gemma 4 support with calm next steps</p>
              <p className="mt-3 text-6xl font-black text-[#2f8f6c]">24/7</p>
              <Wind className="mx-auto mt-7 h-20 w-20 text-[#f0cd42]" aria-hidden="true" />
            </div>
            <div className="sm:col-span-2">
              <div className="mx-auto max-w-lg rotate-[-2deg] rounded-[50%] border-[5px] border-black bg-white px-8 py-4 text-center text-3xl font-black leading-tight shadow-[5px_5px_0_#111]">
                And Small Positive Actions!
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#2f8f6c]">
              MindBridge AI
            </p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black uppercase leading-none sm:text-5xl">
              Write how you feel. Get a safer first reflection.
            </h2>
          </div>
          <div className="rounded-2xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black shadow-[5px_5px_0_#111]">
            {safetyLine}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.5rem] border-[4px] border-black bg-white p-5 shadow-[7px_7px_0_#111]">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f8f6c]">
                Daily Mood Check-in
              </p>
              <h3 className="mt-2 text-2xl font-black">How are you feeling today?</h3>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setSelectedMood(mood.label)}
                    className={`min-h-12 rounded-xl border-[3px] px-3 py-2 text-sm font-black transition ${
                      selectedMood === mood.label
                        ? 'border-black bg-[#f0cd42] shadow-[3px_3px_0_#111]'
                        : 'border-black bg-[#f7f7f0] hover:bg-[#e7fff7]'
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>

              <label className="mt-5 block text-sm font-black" htmlFor="journal">
                Journal Input
              </label>
              <textarea
                id="journal"
                value={journal}
                onChange={(event) => setJournal(event.target.value)}
                className="mt-2 min-h-40 w-full resize-none rounded-2xl border-[3px] border-black bg-[#fffdf0] p-4 text-base font-semibold leading-7 outline-none focus:bg-white"
                placeholder="Write freely about what you are feeling today."
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-[#2f8f6c] px-5 py-2.5 text-sm font-black text-white shadow-[4px_4px_0_#111] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#111] disabled:opacity-70"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {isAnalyzing ? 'Asking Gemma 4...' : 'Analyze with Gemma 4'}
              </button>
              <p className="mt-3 text-sm font-bold leading-6 text-[#4b4f49]">{aiStatus}</p>
            </div>

            <div
              className={`rounded-[1.5rem] border-[4px] border-black p-5 shadow-[7px_7px_0_#111] ${
                analysis.safetyAlert ? 'bg-[#ffe4dd]' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f8f6c]">
                    Gemma 4 Response
                  </p>
                  <h3 className="mt-2 text-2xl font-black">Detected mood: {analysis.detectedMood}</h3>
                </div>
                <CheckCircle2 className="h-7 w-7 text-[#2f8f6c]" aria-hidden="true" />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm font-black">Possible reason</p>
                  <p className="mt-1 text-lg font-black text-[#2f8f6c]">{analysis.possibleReason}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.emotions.map((emotion) => (
                    <span
                      key={emotion}
                      className="rounded-xl border-[3px] border-black bg-[#fff6c9] px-3 py-1.5 text-sm font-black"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
                <p className="rounded-2xl border-[3px] border-black bg-[#e7fff7] p-4 text-base font-bold leading-7">
                  {analysis.message}
                </p>
                <div>
                  <p className="text-sm font-black">Suggested action</p>
                  <ul className="mt-2 space-y-2">
                    {analysis.actions.map((action) => (
                      <li key={action} className="flex gap-2 text-sm font-bold leading-6">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#e15d49]" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
        </div>

        <div id="dashboard" className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[1.5rem] border-[4px] border-black bg-white p-5 shadow-[7px_7px_0_#111]">
              <h3 className="text-2xl font-black">Last 7 days mood trend</h3>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#2f8f6c" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2f8f6c" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#101214" strokeDasharray="4 4" opacity={0.18} />
                    <XAxis dataKey="day" tick={{ fill: '#101214', fontSize: 12, fontWeight: 800 }} />
                    <YAxis
                      domain={[1, 6]}
                      ticks={[1, 2, 3, 4, 5, 6]}
                      tick={{ fill: '#101214', fontSize: 12, fontWeight: 800 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '3px solid #101214',
                        fontWeight: 800,
                      }}
                      formatter={(value) => [`Score ${value}`, 'Mood']}
                    />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke="#2f8f6c"
                      strokeWidth={4}
                      fill="url(#moodGradient)"
                      activeDot={{ r: 7, fill: '#e15d49', stroke: '#101214', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[1.5rem] border-[4px] border-black bg-white p-5 shadow-[7px_7px_0_#111]">
              <h3 className="text-2xl font-black">Reflection Prompts</h3>
              <div className="mt-3 space-y-3">
                {[analysis.prompt, 'What is one small thing you can control right now?', 'Who can you talk to today?'].map(
                  (prompt) => (
                    <div
                      key={prompt}
                      className="rounded-2xl border-[3px] border-black bg-[#fff6c9] p-4 text-sm font-black leading-6"
                    >
                      {prompt}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-4 rounded-2xl border-[3px] border-black bg-[#111317] p-4 text-sm font-bold leading-6 text-white">
                We are not trying to replace therapists. We are building the first safe step between
                feeling overwhelmed and asking for help.
              </div>
            </div>
        </div>
      </section>

      <section className="border-t-[5px] border-black bg-[#111317] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border-[4px] border-white bg-[#2f8f6c] p-5 shadow-[7px_7px_0_#000]">
            <HeartPulse className="mb-4 h-9 w-9" aria-hidden="true" />
            <h3 className="text-2xl font-black">Problem</h3>
            <p className="mt-3 text-sm font-bold leading-6">
              Students often feel stressed, anxious, lonely, or overwhelmed but do not know how to
              explain it clearly.
            </p>
          </div>
          <div className="rounded-[1.5rem] border-[4px] border-white bg-[#f0cd42] p-5 text-[#101214] shadow-[7px_7px_0_#000]">
            <Sparkles className="mb-4 h-9 w-9" aria-hidden="true" />
            <h3 className="text-2xl font-black">Gemma 4 Use</h3>
            <p className="mt-3 text-sm font-bold leading-6">
              Gemma 4 understands journal text, detects emotional tone, generates supportive
              reflections, and suggests safe coping actions.
            </p>
          </div>
          <div className="rounded-[1.5rem] border-[4px] border-white bg-white p-5 text-[#101214] shadow-[7px_7px_0_#000]">
            <ShieldCheck className="mb-4 h-9 w-9 text-[#2f8f6c]" aria-hidden="true" />
            <h3 className="text-2xl font-black">Safety</h3>
            <p className="mt-3 text-sm font-bold leading-6">
              MindBridge AI is not a replacement for therapy or medical diagnosis. It is a
              supportive reflection tool for emotional awareness and self-care.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
