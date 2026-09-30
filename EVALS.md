# Evals

The scorecard is only worth showing if its scores mean something. This file is how HardTalk checks the grader against human labels, what has been run, and what has not.

## Status

| What | Status |
| --- | --- |
| Gold set: 30 hand-labelled conversations | Done for the Workplace track (`evals/gold/`). Pitch Q&A, Interview and Debate have no gold set yet, so their grades are uncalibrated (D-084). |
| Metrics: quadratic-weighted kappa, agreement, run-to-run stability | Done, unit-tested against scikit-learn (`evals/__tests__/metrics.test.ts`) |
| Baseline ("always score 2") | Run, numbers below |
| Free local grader (qwen2.5 7B on Ollama), 1 run | Run on 30 September 2026, numbers below. It beats the baseline on every dimension, and is weakest on clarity and empathy. |
| Claude grader against the gold set, 3 runs | **Not run yet.** It needs an Anthropic API key, and none was available where this was built. `pnpm eval` produces the table below with the real numbers. |

That last row is the honest state of things. No grader numbers are shown here until they have been produced by `pnpm eval`.

## The gold set

`evals/gold/*.yaml` holds 10 conversations per scenario, 30 in total. Each is scored 1 to 4 on Clarity, Empathy, Ask made and Boundary held against the anchors in `data/rubrics/`. They were written to cover the scale and the cases a grader is most likely to get wrong:

- weak, medium and strong attempts at every difficulty level;
- long, padded turns that contain the right content (Clarity should drop for verbosity);
- forceful users who hold their position with no empathy (high Boundary, low Empathy);
- warm users who never make a request (high Empathy, Ask made 1);
- good openings that fold under pushback (high Clarity, Boundary 1).

Tests check that every score from 1 to 4 appears on every dimension, that each transcript opens with its scenario's real first line, and that none would trip the distress exit, since those conversations are never graded.

Limitation: all 30 were labelled by one person, the author, who also wrote the rubrics. That makes the labels consistent with the rubric text, but it is not inter-rater agreement. The next step is to have two more people label the same 30 blind and report their kappa with each other alongside the grader's.

## Method

`pnpm eval` grades every gold conversation through the same code path the app uses (`server/src/grader.ts` and the evidence gate in `src/grading/grade.ts`), three times, and reports per dimension:

- **Kappa**: quadratic-weighted Cohen's kappa between the grader and the gold labels. 1 is perfect agreement and 0 is chance. The quadratic weights mean a 1-vs-4 disagreement costs nine times a 1-vs-2.
- **Exact** and **within 1**: plain agreement rates, easier to read.
- **Identical across runs** and **mean SD**: how often three runs of the same conversation give the same score. The original plan called for grading at temperature 0; Claude Opus 5 does not accept sampling parameters, so stability is measured directly instead.
- How often the evidence gate had to retry, and how many scores it lowered to 1.

A grading that fails (a refusal, an API error, or output that breaks the schema twice) is recorded in the results file, and that conversation is left out of every metric for that invocation; the table says how many were excluded. A grader that fails mostly on hard conversations would look better than it is, so read the excluded count before the kappa.

Raw scores go to `evals/results/`. The baseline is deterministic and committed as `baseline.json`. Each model run gets its own timestamped file, so a later run never overwrites a paid one; those are git-ignored, so commit the one you quote here with `git add -f`. At list prices, three runs over 30 conversations with `claude-opus-5` should cost roughly $5 to $10, most of it output and thinking tokens; the system prompt is cached per scenario.

```sh
pnpm eval --baseline   # no key needed
pnpm eval --runs 1     # one pass, about a third of the cost
pnpm eval              # the full three runs
```

## Results

### Baseline: always score 2

A rater that ignores the conversation and gives 2 everywhere. Any grader worth shipping has to beat this by a wide margin; the "within 1" column shows why plain agreement alone is a weak measure.

| Dimension | Kappa | Exact | Within 1 |
| --- | --- | --- | --- |
| clarity | 0.00 | 17% | 53% |
| empathy | 0.00 | 20% | 87% |
| ask_made | 0.00 | 10% | 77% |
| boundary_held | 0.00 | 20% | 70% |

### Free local grader: qwen2.5 7B on Ollama

The grader HardTalk uses when there is no paid key (`MODEL_BASE_URL=http://localhost:11434/v1`, `GRADER_MODEL=qwen2.5:7b`), on an RTX 3050 laptop GPU. One run, so there is no stability figure. Raw scores: `evals/results/qwen2.5-7b-2026-09-30T16-37-42-494Z.json`.

| Dimension | Kappa | Exact | Within 1 |
| --- | --- | --- | --- |
| clarity | 0.33 | 40% | 73% |
| empathy | 0.30 | 30% | 83% |
| ask_made | 0.81 | 63% | 93% |
| boundary_held | 0.67 | 47% | 87% |

Evidence gate: 15 of 30 gradings needed the one retry, and 6 dimension scores were lowered to 1 for quotes the user never said. Median time per grading: 81 s with four gradings queued at once; a single grading in the app takes about 15 s.

What it means: the small model is close to the labels on the two concrete skills (did you make a clear ask, did you hold your boundary) and weak on the two that need judgement about tone (clarity by SBI, empathy by NVC). The evidence gate earns its place here: half the gradings quoted something that was not said, and code caught it.

### Claude grader

Not run yet. Paste the output of `pnpm eval` here.
