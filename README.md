<div align="center">

<img src="assets/icon.png" alt="" width="96" height="96" />

# HardTalk

**Practise the conversation before you have it.**

A mobile app where a panel of AI personas pushes back on your interview answers, your pitch, your debate
or a hard talk at work, out loud. Then it scores you with quotes of your own words, and shows the score
move when you try again.

<a href="https://youtu.be/3SPjLVNXbgo"><img src="docs/media/demo-thumbnail.jpg" alt="Watch the HardTalk demo on YouTube: a real session on an Android phone" width="720" /></a>

**[▶ Watch the demo](https://youtu.be/3SPjLVNXbgo)** · [Download the video and images](https://github.com/Prashant-thakur77/HardTalk/releases/tag/shipaton-2026)

[![RevenueCat Shipaton 2026: Next Gen Award entry](https://img.shields.io/badge/RevenueCat_Shipaton_2026-Next_Gen_Award_entry-F25A5A)](#built-for-revenuecat-shipaton-2026)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-2563EB)](LICENSE)
[![Mock mode: zero keys](https://img.shields.io/badge/mock_mode-zero_keys,_zero_network-16A34A)](#see-it-in-60-seconds)
[![Recorded live on Android](https://img.shields.io/badge/recorded_live-Android_phone-3DDC84?logo=android&logoColor=white)](https://youtu.be/3SPjLVNXbgo)

**App** &nbsp;
[![Expo SDK 57](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)](https://docs.expo.dev/)
[![React Native 0.86](https://img.shields.io/badge/React_Native-0.86-087EA4?logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![Expo Router](https://img.shields.io/badge/Expo_Router-file_routes-000020?logo=expo&logoColor=white)](app/)
[![expo-audio](https://img.shields.io/badge/expo--audio-mic_and_playback-000020?logo=expo&logoColor=white)](src/voice/)
[![EAS Build](https://img.shields.io/badge/EAS_Build-development_build-4630EB?logo=expo&logoColor=white)](eas.json)

**Voice and AI** &nbsp;
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-voice_agents-111111)](docs/DEVICE.md)
[![LiveKit WebRTC](https://img.shields.io/badge/LiveKit-WebRTC-FF6352?logo=webrtc&logoColor=white)](src/voice/elevenlabs.ts)
[![Claude](https://img.shields.io/badge/Claude-grader_and_drafter-D97757?logo=anthropic&logoColor=white)](data/prompts/grader.yaml)
[![Ollama](https://img.shields.io/badge/Ollama-free_local_grader-000000?logo=ollama&logoColor=white)](server/src/models.ts)
[![Gemini](https://img.shields.io/badge/Gemini-OpenAI--compatible-8E75B2?logo=googlegemini&logoColor=white)](server/.env.example)

**Payments** &nbsp;
[![RevenueCat](https://img.shields.io/badge/RevenueCat-purchases_and_paywalls-F25A5A)](docs/REVENUECAT.md)
[![Test Store](https://img.shields.io/badge/RevenueCat-Test_Store-F25A5A)](docs/REVENUECAT.md)

**Server and quality** &nbsp;
[![Node.js](https://img.shields.io/badge/Node.js-20-5FA04E?logo=nodedotjs&logoColor=white)](server/)
[![Hono](https://img.shields.io/badge/Hono-server-E36002?logo=hono&logoColor=white)](server/)
[![zod](https://img.shields.io/badge/zod-4-3E67B1?logo=zod&logoColor=white)](src/grading/rubric.schema.ts)
[![YAML](https://img.shields.io/badge/data-YAML-CB171E?logo=yaml&logoColor=white)](data/)
[![Vitest](https://img.shields.io/badge/tests-1,391_passing-6E9F18?logo=vitest&logoColor=white)](#checks)
[![ESLint](https://img.shields.io/badge/ESLint-zero_warnings-4B32C3?logo=eslint&logoColor=white)](#checks)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](package.json)

</div>

### A real session, on a real phone

Recorded on an Android development build: live interviewer voices, a vague first try, a retry, and a RevenueCat Test Store purchase.

<table>
  <tr>
    <td align="center" width="25%"><img src="docs/screens/live/1-brief.jpg" alt="The brief: Priya, Tom and Grace, what each will ask about, level L2" width="190" /><br /><sub><b>1. Meet the room</b></sub></td>
    <td align="center" width="25%"><img src="docs/screens/live/2-live-session.jpg" alt="The live session with captions under each interviewer" width="190" /><br /><sub><b>2. Say it out loud</b></sub></td>
    <td align="center" width="25%"><img src="docs/screens/live/3-first-try-9.jpg" alt="First try scorecard: 9 out of 16, nobody won over" width="190" /><br /><sub><b>3. First try: 9 / 16</b></sub></td>
    <td align="center" width="25%"><img src="docs/screens/live/4-retry-16.jpg" alt="Retry scorecard: 16 out of 16, 9 to 16, all three won over" width="190" /><br /><sub><b>4. Retry: 9 → 16</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screens/live/5-revenuecat-paywall.jpg" alt="RevenueCat paywall with Annual and Monthly plans" width="190" /><br /><sub><b>5. RevenueCat paywall</b></sub></td>
    <td align="center"><img src="docs/screens/live/6-test-store-purchase.jpg" alt="RevenueCat Test Store purchase sheet" width="190" /><br /><sub><b>6. Test Store purchase</b></sub></td>
    <td align="center"><img src="docs/screens/live/7-panel-from-posting.jpg" alt="A panel built from a pasted job posting: Sunny, Milo and Lila" width="190" /><br /><sub><b>7. A panel from a real posting</b></sub></td>
    <td align="center"><sub>Full-size images, the cover and the video are in the <a href="https://github.com/Prashant-thakur77/HardTalk/releases/tag/shipaton-2026">release</a>.</sub></td>
  </tr>
</table>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/charts/retry-dark.svg" />
    <img src="docs/charts/retry-light.svg" alt="One real session, skill by skill: answered first 2 to 4, structured story 3 to 4, evidence 2 to 4, ownership and learning 2 to 4; total 9 to 16, and the panel went from won over 0 of 3 to 3 of 3" width="760" />
  </picture>
</p>

## What it is

HardTalk is the practice panel you don't have. It is for the spoken moments you only get one shot at: your first job interview, the Q&A after your first pitch, a debate, or telling a teammate their PR is blocking the release. It is built for students and people early in their careers, who rarely have a room of experienced people to rehearse with.

You say it out loud to a room of AI personas who push back, each with their own face, voice and line of questioning. Then you get a scorecard that quotes your own words as the evidence for every score, and one better line to try. You try again and see the score move.

- **Every score shows its evidence.** A score above 1 must quote something you actually said, and code (not the model) throws out any quote you didn't say.
- **The rubrics are open.** Fourteen anchored rubrics in `data/rubrics/`, each citing a named framework (SBI, Nonviolent Communication, Crucial Conversations, STAR, the Pyramid Principle, SPIN Selling, Toulmin and more).
- **A panel, not a chatbot.** An investor who likes you, one who doubts the model, an advisor who asks what stops a copycat. The brief tells you what each will ask about.
- **See who you won over.** Each person on the panel judges only the skills they care about: the investor weighs your evidence and how you handle objections, the engineer weighs your specifics. The scorecard shows who you won over, who is unsure and who is unconvinced, worked out from the same evidence-checked scores, and who changed their mind after your retry.
- **Bring the real one (Pro).** Paste the job posting you are applying to, your pitch, or the motion, and HardTalk drafts a panel for that exact moment: who is in the room, what each will push on, and what you need to leave with.
- **The whole loop works with a screen reader and no audio**, and saying "stop" ends it at once, unscored.

Mock mode, with no keys, replays the same loop in a browser:

![HardTalk in mock mode: the brief for a three-investor pitch panel, the replayed conversation, a retry from 6 to 14 that wins over all three, the Pro paywall, and a panel drafted from the sample pitch](docs/demo.gif)

## At a glance

| | |
| --- | --- |
| **Problem** | The interviews, pitches and hard talks that shape an early career are spoken, high-stakes and one-shot, and there is nobody to rehearse with. |
| **Who pays** | Final-year students, new graduates and student founders with a real conversation coming up. |
| **Product** | A voiced AI panel that pushes back, a scorecard grounded in quotes of your own words, and a retry that shows the score move. |
| **Why it is different** | A panel with different stances, not one chatbot; fourteen open rubrics that each cite a named framework; code, not the model, rejects any quote you didn't say. |
| **Revenue** | Freemium through RevenueCat, entitlement `pro`: Weekly $2.99, Monthly $4.99, Annual $29.99. The paywall opens at two real boundaries only. |
| **Status** | Run live on an Android development build on 1 October 2026: real voices, real grading with quoted evidence, a 9 → 16 retry and a RevenueCat Test Store purchase ([video](https://youtu.be/3SPjLVNXbgo)). Not on a store yet; no users or revenue yet. Mock mode runs the whole loop with no keys. |

## Business value

**Who.** Final-year students and new graduates before their first interviews, student founders before their first investor Q&A, and new graduates before their first hard conversation at work. That is about 1.97 million US bachelor's graduates a year ([NCES, 2022–23](https://nces.ed.gov/programs/digest/d24/tables/dt24_322.20.asp)) and about 10.7 million graduates a year in India ([AISHE 2021–22](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1999713)).

**The pain.** Hiring now takes about 20 interviews per hire, up from 14 in 2021 ([Gem, 2025](https://www.gem.com/blog/10-takeaways-from-the-2025-recruiting-benchmarks-report)). Interview anxiety goes with lower interview performance (r = −.19 across studies; [Powell, Stanley & Brown, 2018](https://psycnet.apa.org/fulltext/2018-44232-001.pdf)), and a third of Americans fear public speaking ([Chapman, 2025](https://www.chapman.edu/wilkinson/research-centers/babbie-center/_files/2025/Key-Findings-Survey-of-America-Fears-2025.pdf)).

**What people use today.** A career coach (about $207 an hour, [Career Sidekick](https://careersidekick.com/career-coach-cost/)), paid mock interviews, a friend, or nothing. Google's free Interview Warmup was retired in 2026 ([reported by Four Leaf](https://four-leaf.ai/blog/google-interview-warmup)), and Poised is shutting down on 8 October 2026 ([notice on its site](https://www.poised.com/)).

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/charts/price-dark.svg" />
    <img src="docs/charts/price-light.svg" alt="Monthly price in US dollars: HardTalk Pro 4.99, Yoodli 8 to 20, Final Round AI from 25, Big Interview 39, VirtualSpeech 45; a career coach is about 207 dollars an hour" width="760" />
  </picture>
</p>

| | Focus | Price (Sept 2026) | Where HardTalk differs |
| --- | --- | --- | --- |
| [Yoodli](https://yoodli.ai/pricing) | Speech coaching and AI roleplays | Free (5 sessions), $8–20/mo | A panel with different stances, and scores that quote you |
| [Final Round AI](https://www.finalroundai.com/) | A live copilot during real interviews | From $25/mo | Builds the skill before, instead of feeding answers during |
| [VirtualSpeech](https://virtualspeech.com/pricing) | VR soft-skills courses | $45/mo | Mobile, student-priced, open rubrics |
| [PitchDesk](https://pitchdesk.in/) | AI investor panel for pitches | Per-minute packs | Also interviews, debates and work; evidence-checked scores |
| [Big Interview](https://www.biginterview.com/pricing/personal) | Video lessons and AI feedback | $39 a month | A live, voiced conversation that pushes back |

**Business model.** Free: every built-in scenario and three graded sessions. Pro through RevenueCat: a **Weekly** plan ($2.99 a week, renewing until you cancel) for one real conversation coming up, because practice comes in bursts; monthly ($4.99) and annual ($29.99) for people who keep practising. That is below the Education category's median prices ($9.99 a month, $44.99 a year) in RevenueCat's [State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps-2026-education), which also puts freemium apps at about 2.1% of downloads converting to paid within 35 days: the number to beat.

**Closing the loop.** After you practise one of your own scenarios, the app asks how the real conversation went (it went well, mixed, not this time), and your progress shows it beside your scores. It stays on the device.

**What is not proven yet.** The live loop has run end to end on the developer's own phone, once, on camera. There are no users, no revenue and no measured cost per live session yet, and Restore Purchases has not been filmed (see [DEFECTS.md](DEFECTS.md)). Simulated interview practice has raised job-offer odds in studies of adjacent populations ([pooled analysis, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11232528/)); HardTalk has not been measured, so it claims only practice, not offers.

## See it in 60 seconds

```sh
pnpm install
pnpm dev        # then press w for the browser, or scan the QR code with Expo Go
```

That is mock mode, and it needs no API keys, no microphone and no network. It replays recorded conversations through the same screens, captions and scorecard as the live app, reads each persona's lines aloud with the device's own speech engine at their own pitch, and a “Mock replay” label says so on the home screen, the brief, every session and every scorecard. Node 20 and pnpm 10 are the only requirements.

## What happens in a session

1. Pick a track and a conversation:

   | Track | Built-in conversation | Who is in the room | Scored on |
   | --- | --- | --- | --- |
   | Workplace | A teammate's PR is blocking the release; saying no to your manager's extra project; pushing back on mid-sprint scope | One colleague | Clarity (SBI), Empathy (NVC), Ask made, Boundary held (Crucial Conversations) |
   | Pitch Q&A | Questions after your seed pitch | Maya (who pays, retention), Leo (the team), Kenji (what stops a copycat) | Answered first, Evidence, Objections, Next step (SPIN Selling) |
   | Interview | Your first engineering interview; a summer internship at a startup | Priya (a time it failed), Tom (the technical why), Grace (why this team); Ravi (what you actually built), Nora (how you knew what users wanted), Ben (why a startup) | Answered first, Structured story (STAR), Evidence, Ownership |
   | Debate | AI assistants in programming exams | Daniel (against), Aisha (moderator), Mateo (how would it be checked) | Clear claim, Rebuttal, Fair to the other side, Held your ground |

2. Read the brief: who is in the room, whose side they are on, and what each will ask about. Pick how hard they push back: L1, L2 or L3. The lead persona's face changes with the level.
3. Talk, or type if you would rather not use audio. Everyone has a goal, the lead has a hidden objection, and the conversation ends when it reaches its stop condition or after six of your turns. Captions run for every speaker, under their name and face. Saying or typing "stop" ends it at once, unscored.
4. Read the scorecard. The track's four rubrics are each scored 1 to 4, every score above 1 quotes something you actually said, and each comes with one line to try next time. Your key line (your ask, your close, your result or your claim) is pulled out at the top.
5. Retry. The scorecard shows each score before and after, side by side.

Three graded sessions are free, in any track. Pro (the RevenueCat `pro` entitlement) adds unlimited grading, progress history, and your own scenarios: paste the real job posting, pitch or motion and a panel is drafted for it (`POST /scenario/draft`, prompt in `data/prompts/drafter.yaml`), or describe it in five answers. The paywall opens in exactly two places: starting a fourth graded session, and tapping "Create your own scenario". At the session limit its copy names the conversation you are starting and how your score has moved on it ("Keep practising 'Your teammate's PR is blocking the release'. Your score on it so far: 7 → 14 out of 16."); at "Create your own scenario" it says why you would write one. The words come from `data/paywall.yaml` and reach RevenueCat's paywall as custom variables. The free sessions are counted on the device, so deleting your history does not reset them; reinstalling does, because there are no accounts. Restore purchases is on the home screen and on the paywall.

## How it works

| Layer | Technology | Where |
| --- | --- | --- |
| App | Expo SDK 57 development build, React Native 0.86, expo-router, TypeScript strict | `app/`, `src/` |
| Voice | ElevenLabs conversational agents over WebRTC (`@elevenlabs/react-native`, pinned), one voice per person | `src/voice/` |
| Audio | `expo-audio`, `expo-speech` for mock mode, `expo-haptics` | `src/voice/mock.ts` |
| Purchases | RevenueCat (`react-native-purchases`, `react-native-purchases-ui`), entitlement `pro`, remote paywall with custom variables | `src/purchases/` |
| Grading and drafting | Claude with structured JSON output by default, or any OpenAI-compatible model (Gemini, a local Ollama model), always a different family from the persona | `server/src/models.ts`, `server/src/grader.ts` |
| Server | Hono on Node, about 600 lines: token minting, grading, drafting, safety check, rate limit | `server/` |
| Data | YAML validated by zod 4, shared by the app and the server | `data/` |
| Storage | On the device only (AsyncStorage); no accounts | `src/attempts/` |
| Tests | Vitest unit tests, ESLint with zero warnings | `pnpm test`, `pnpm lint` |

```mermaid
flowchart LR
  App["Expo app<br/>src/voice/VoiceProvider.ts"] -- "POST /voice/token" --> Server["/server (Hono)"]
  Server -- "short-lived token" --> App
  App <-- "WebRTC audio" --> Persona["ElevenLabs agent<br/>persona and panel on Gemini,<br/>one voice per person"]
  App -- "POST /grade (transcript)" --> Server
  App -- "POST /scenario/draft (pasted text, Pro)" --> Server
  Server -- "structured JSON" --> Grader["Claude grader"]
  Server -- "evidence-checked grade" --> App
```

The app never holds a provider key. `/server` mints a short-lived ElevenLabs conversation token and runs the grader. The persona and the grader are deliberately different model families (Gemini inside ElevenLabs, Claude for grading), so the grader never marks its own roleplay.

Scores have to be grounded. `src/grading/evidence.ts` checks that every quote behind a score above 1 appears in one of the user's own turns as whole words, and is either a full sentence or at least three words long. The grader gets one retry with the bad quotes named; anything still ungrounded is lowered to 1 and the scorecard says why. Mock mode runs its recorded grades through the same check. A recorded grade only describes the recorded lines, so a typed mock conversation in your own words is not scored at all, and does not use a free session; only live mode grades your own words.

## Where to look

| Path | What is there |
| --- | --- |
| `data/tracks/*.yaml` | The four tracks: the room the persona is in, what the grader grades, the four rubrics and the key line |
| `data/rubrics/*.yaml` | Fourteen rubrics with anchored 1–4 descriptors, each citing a named framework and its source |
| `data/scenarios/*.yaml` | Each persona's goal, hidden objection, tone, face, voice, what they ask about, L1–L3 behaviour and stop condition, plus the panel |
| `data/prompts/` | The persona prompt template and the grader instructions with weak, medium and strong calibration examples |
| `src/grading/` | Grade schema, evidence gate, retry-then-downgrade orchestration, prompt assembly |
| `src/voice/` | `VoiceProvider` interface, the ElevenLabs provider (with panel voices split by speaker) and the mock replay read aloud on the device |
| `src/ui/Face.tsx` | The drawn persona faces: SVG, no image assets, blinking and talking, stilled by Reduce Motion |
| `src/purchases/` | RevenueCat entitlement, paywall with scenario-aware custom variables, restore, and the two paywall gates |
| `src/safety/`, `data/safety.yaml` | Stop word, distress exit, crisis resources, disclaimer |
| `server/` | Token minting, grading, panel drafting, safety refusal and a per-client rate limit, about 600 lines |
| `evals/` | 30 hand-labelled workplace conversations and `pnpm eval`, which measures the grader against them ([EVALS.md](EVALS.md)); the other tracks have no gold set yet |
| `app/` | Screens: scenarios, brief, live session, scorecard, paywall (mock mode), progress history, your own scenario |

Rubrics, scenarios and prompts are YAML so they can be read and reviewed without reading code. The app and the server validate them against the same zod schemas, and `pnpm test` fails if any file drifts from its schema.

## Safety and accessibility

The persona pushes back professionally and never more than the level allows. Every line you say is checked for distress on the device, and in live mode again on the server by a model; either one ends the roleplay, skips scoring and shows crisis lines. The persona and the grader are told to watch for it too, and `/grade` refuses to score a flagged transcript. Saved transcripts are kept only on the device and can be deleted; in live mode the conversation is sent to ElevenLabs to run it and to Anthropic to grade it. Details and limits: [SAFETY.md](SAFETY.md).

Everything can be done by typing with a screen reader on and no audio. Turn changes are announced with the persona muted while the screen reader talks, there are haptics on each turn, a pace setting for the persona's voice, and contrast is checked by tests. The WCAG 2.2 mapping, including what is not covered yet, is in [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Running it for real

Live mode needs a development build on a phone (Expo Go cannot load the WebRTC modules), an ElevenLabs agent, a grading model (an Anthropic API key, or free: a Gemini key or a local Ollama model) and a RevenueCat Test Store key. The walkthroughs are [docs/DEVICE.md](docs/DEVICE.md) and [docs/REVENUECAT.md](docs/REVENUECAT.md). In short:

```sh
cp server/.env.example server/.env   # ElevenLabs key and agent ID, plus a grading model (see the file)
cp .env.example .env.local           # set EXPO_PUBLIC_MOCK=0, your computer's LAN IP, the RevenueCat test_ key
pnpm start:server                    # grading + token minting on :8787
pnpm android                         # builds and installs the dev build in live mode
```

## Checks

```sh
pnpm test        # unit tests: schemas, data files, evidence gate, grader retry, server routes, both voice providers
pnpm lint        # zero warnings
pnpm typecheck   # TypeScript strict
pnpm eval        # grader vs hand labels: kappa, agreement, run-to-run stability (needs a key; --baseline does not)
```

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/charts/calibration-dark.svg" />
    <img src="docs/charts/calibration-light.svg" alt="Grader agreement with human labels, quadratic weighted kappa: clarity 0.33, empathy 0.30, ask made 0.81, boundary held 0.67; the always-2 baseline is 0 on every skill" width="760" />
  </picture>
</p>

[EVALS.md](EVALS.md) explains the gold set and the metrics, and is explicit about what has not been run yet.

## Built for RevenueCat Shipaton 2026

HardTalk is my entry for the **Next Gen Award** (student category) of RevenueCat Shipaton 2026. Where to check each judging criterion:

| Criterion | Where to look |
| --- | --- |
| Working and real | [See it in 60 seconds](#see-it-in-60-seconds) in mock mode; the live setup in [docs/DEVICE.md](docs/DEVICE.md); what has not run live yet in [DEFECTS.md](DEFECTS.md) |
| Code quality | This README, the MIT [LICENSE](LICENSE), the architecture above, [Checks](#checks), and data kept in YAML under `data/` |
| Thoughtful RevenueCat use | [`src/purchases/`](src/purchases/), [`data/paywall.yaml`](data/paywall.yaml) and [docs/REVENUECAT.md](docs/REVENUECAT.md): entitlement `pro`, two paywall gates, copy that names your scenario and score, entitlement flips live, Restore Purchases |
| Does it matter | [The business case](#business-value), fourteen framework-cited rubrics in [`data/rubrics/`](data/rubrics/), the evidence gate, [SAFETY.md](SAFETY.md) and [ACCESSIBILITY.md](ACCESSIBILITY.md) |

### How this was built
 I built it with Claude Code in a loop: build one phase, then a separate reviewer pass acting as a tired, hostile judge clones the repo, tries to run it and scores it against the four judging criteria. The reviews are in [`review/`](review/), every finding is in [DEFECTS.md](DEFECTS.md), the score history is in [SCORECARD.md](SCORECARD.md), and [PLAN.md](PLAN.md) is re-planned from the scores after each round. [CLAUDE.md](CLAUDE.md) holds the rules the loop follows.

## Licence

MIT. See [LICENSE](LICENSE).
