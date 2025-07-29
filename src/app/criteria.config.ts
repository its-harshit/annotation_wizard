type RatingDescriptions = { [key: string]: string };

// Conversation-level criteria
export const conversationCriteria = [
  {
    id: 'coherence',
    label: 'Coherence',
    description: `How logically and smoothly does the response flow from the user’s question? Does it present steps or reasoning in a natural, connected way?

5 (Excellent):
Every part of the answer builds on the previous one, showing a clear thought process.
If the user’s query is multi-part, each part is handled in logical order without skipping.
There are no logical jumps, contradictions, or reversals.
The overall structure feels organized, e.g., starts with context, gives an answer, and concludes or transitions well.

4 (Strong):
Mostly logical, with only one minor awkward transition or step that slightly disrupts flow.
The answer covers all parts of the query, but a subpoint may feel a little out of order or abrupt.
No contradictions or major confusion, but the structure could be a little tighter.

3 (Adequate):
The main reasoning is present but some points are out of order or loosely connected.
The answer may feel choppy or list-like rather than a narrative or stepwise flow.
The user may have to mentally reorder or connect information to follow the reasoning.
Some minor contradictions or repeated information may be present but do not break understanding.

2 (Weak):
Several statements seem out of place, or the answer frequently jumps between unrelated points.
Logical gaps require the user to guess or infer missing information.
Parts of the response may contradict each other or seem to go in circles.
The answer lacks a clear beginning, middle, or end, making it hard to follow.

1 (Incoherent):
The answer is random, scattered, or appears stitched together with no flow.
Key steps are missing or mixed up, creating confusion.
Contradictions, reversals, or duplicated information are common.
The user cannot follow or act on the response due to its disorganization.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'Incoherent:\nThe answer is random, scattered, or appears stitched together with no flow.\nKey steps are missing or mixed up, creating confusion.\nContradictions, reversals, or duplicated information are common.\nThe user cannot follow or act on the response due to its disorganization.',
      2: 'Weak:\nSeveral statements seem out of place, or the answer frequently jumps between unrelated points.\nLogical gaps require the user to guess or infer missing information.\nParts of the response may contradict each other or seem to go in circles.\nThe answer lacks a clear beginning, middle, or end, making it hard to follow.',
      3: 'Adequate:\nThe main reasoning is present but some points are out of order or loosely connected.\nThe answer may feel choppy or list-like rather than a narrative or stepwise flow.\nThe user may have to mentally reorder or connect information to follow the reasoning.\nSome minor contradictions or repeated information may be present but do not break understanding.',
      4: 'Strong:\nMostly logical, with only one minor awkward transition or step that slightly disrupts flow.\nThe answer covers all parts of the query, but a subpoint may feel a little out of order or abrupt.\nNo contradictions or major confusion, but the structure could be a little tighter.',
      5: 'Excellent:\nEvery part of the answer builds on the previous one, showing a clear thought process.\nIf the user’s query is multi-part, each part is handled in logical order without skipping.\nThere are no logical jumps, contradictions, or reversals.\nThe overall structure feels organized, e.g., starts with context, gives an answer, and concludes or transitions well.'
    } as RatingDescriptions,
  },
  {
    id: 'factuality',
    label: 'Factuality',
    description: `How correct and accurate is the information given, according to UPI/NPCI rules and best practices for this error code and scenario?

5 (Completely Accurate):
All explanations, causes, and solutions fully match official rules and the latest system behavior.
There are no outdated details, unsupported assumptions, or vague statements.
No risky or speculative advice is given; the user is fully protected.
The advice is up to date, precise, and safe.

4 (Mostly Accurate):
All essential information is correct, but the answer may lack rare or advanced details.
May generalize slightly, e.g., “try again later” when a specific time could be given.
No serious risk or misleading content, but slight vagueness or lack of precision exists.
Still fully compliant and safe.

3 (Somewhat Accurate):
Mostly correct, but at least one detail is oversimplified, ambiguous, or based on an assumption.
The answer could be misleading for users with special cases, but is usually safe.
Information may be partly out of date or fail to capture all nuances of the scenario.
May mix up cause and solution, or present a minor contradiction.

2 (Partially Incorrect):
One or more points are incorrect, such as misidentifying the cause or solution.
Suggests an action that is not permitted or is inappropriate for this error code.
Some factual claims may directly conflict with guidelines or actual system behavior.
May result in user confusion, a failed attempt, or procedural violation.

1 (Completely Incorrect):
Main information is factually wrong or outright dangerous.
Advises the user to take actions that could lead to loss, fraud, or violation of compliance.
Suggests system features or rules that do not exist.
Puts the user or system at risk and must be urgently corrected.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'Completely Incorrect:\nMain information is factually wrong or outright dangerous.\nAdvises the user to take actions that could lead to loss, fraud, or violation of compliance.\nSuggests system features or rules that do not exist.\nPuts the user or system at risk and must be urgently corrected.',
      2: 'Partially Incorrect:\nOne or more points are incorrect, such as misidentifying the cause or solution.\nSuggests an action that is not permitted or is inappropriate for this error code.\nSome factual claims may directly conflict with guidelines or actual system behavior.\nMay result in user confusion, a failed attempt, or procedural violation.',
      3: 'Somewhat Accurate:\nMostly correct, but at least one detail is oversimplified, ambiguous, or based on an assumption.\nThe answer could be misleading for users with special cases, but is usually safe.\nInformation may be partly out of date or fail to capture all nuances of the scenario.\nMay mix up cause and solution, or present a minor contradiction.',
      4: 'Mostly Accurate:\nAll essential information is correct, but the answer may lack rare or advanced details.\nMay generalize slightly, e.g., “try again later” when a specific time could be given.\nNo serious risk or misleading content, but slight vagueness or lack of precision exists.\nStill fully compliant and safe.',
      5: 'Completely Accurate:\nAll explanations, causes, and solutions fully match official rules and the latest system behavior.\nThere are no outdated details, unsupported assumptions, or vague statements.\nNo risky or speculative advice is given; the user is fully protected.\nThe advice is up to date, precise, and safe.'
    } as RatingDescriptions,
  },
  {
    id: 'relevance',
    label: 'Relevance',
    description: `How directly and completely does the answer address the user’s specific query and context, without unrelated or filler information?

5 (Fully Relevant):
Every sentence is focused on resolving the user’s issue.
All information provided is necessary for this context; nothing is generic or off-topic.
Any multi-part queries are fully answered in context.
No apologies, marketing, or generic statements unless directly helpful.

4 (Mostly Relevant):
The main answer is on point, but includes a brief aside, generic reminder, or minor unrelated statement.
All important parts of the user’s query are addressed.
The extra content does not distract from or overshadow the core solution.
Still feels personalized for the user.

3 (Partially Relevant):
The core of the answer relates to the user’s problem, but there is noticeable filler or boilerplate content.
One part of a multi-part query may be answered in a generic way.
The user may need to extract the key information from a mostly templated answer.

2 (Barely Relevant):
Most of the response is unrelated to the user’s actual issue or is copied boilerplate.
Only a small portion of the response addresses the question at hand.
User likely needs to ask again or clarify.

1 (Irrelevant):
The response does not answer the user’s query or addresses a completely different issue.
Only apologies or canned phrases, with no connection to the real problem.
Wastes the user’s time and increases frustration.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'Irrelevant:\nThe response does not answer the user’s query or addresses a completely different issue.\nOnly apologies or canned phrases, with no connection to the real problem.',
      2: 'Barely Relevant:\nMost of the response is unrelated to the user’s actual issue or is copied boilerplate.\nOnly a small portion of the response addresses the question at hand.\nUser likely needs to ask again or clarify.',
      3: 'Partially Relevant:\nThe core of the answer relates to the user’s problem, but there is noticeable filler or boilerplate content.\nOne part of a multi-part query may be answered in a generic way.\nThe user may need to extract the key information from a mostly templated answer.',
      4: 'Mostly Relevant:\nThe main answer is on point, but includes a brief aside, generic reminder, or minor unrelated statement.\nAll important parts of the user’s query are addressed.\nThe extra content does not distract from or overshadow the core solution.\nStill feels personalized for the user.',
      5: 'Fully Relevant:\nEvery sentence is focused on resolving the user’s issue.\nAll information provided is necessary for this context; nothing is generic or off-topic.\nAny multi-part queries are fully answered in context.\nNo apologies, marketing, or generic statements unless directly helpful.'
    } as RatingDescriptions,
  },
  {
    id: 'consistency',
    label: 'Consistency (with Agent Guidelines)',
    description: `Does the response fully adhere to the official agent playbook—structure, tone, escalation, prohibited actions, and style?

5 (Fully Consistent):
The response strictly follows all documented structures, tone, and escalation rules.
No prohibited actions (e.g., asking to switch apps unless allowed) or risky guidance.
Matches branding, professionalism, and user safety guidelines.
Feels like a model example of approved support.

4 (Minor Deviations):
The response is nearly perfect but with a minor departure from phrasing, structure, or tone.
No critical protocol is broken; escalation is handled correctly.
Slightly less standardized but safe and compliant.

3 (Noticeable Deviations):
Several elements stray from the template, e.g., out-of-order structure, or softer/stronger tone than required.
May omit a secondary step in escalation or paraphrase a required warning.
Still safe, but could cause confusion or inconsistency in user experience.

2 (Protocol Breach):
One or more critical rules are broken, such as suggesting a risky action, skipping required escalation, or missing a mandatory warning.
The response is still generally helpful but may pose a risk or confuse the user.
Needs correction before production use.

1 (Major Violation):
Directly contradicts guidelines, includes illegal or non-compliant advice, or asks the user to share sensitive info inappropriately.
Tone or style is completely off-brand or unprofessional.
Must be urgently reviewed and corrected.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'Major Violation:\nDirectly contradicts guidelines, includes illegal or non-compliant advice, or asks the user to share sensitive info inappropriately.\nTone or style is completely off-brand or unprofessional.\nMust be urgently reviewed and corrected.',
      2: 'Protocol Breach:\nOne or more critical rules are broken, such as suggesting a risky action, skipping required escalation, or missing a mandatory warning.\nThe response is still generally helpful but may pose a risk or confuse the user.\nNeeds correction before production use.',
      3: 'Noticeable Deviations:\nSeveral elements stray from the template, e.g., out-of-order structure, or softer/stronger tone than required.\nMay omit a secondary step in escalation or paraphrase a required warning.\nStill safe, but could cause confusion or inconsistency in user experience.',
      4: 'Minor Deviations:\nThe response is nearly perfect but with a minor departure from phrasing, structure, or tone.\nNo critical protocol is broken; escalation is handled correctly.\nSlightly less standardized but safe and compliant.',
      5: 'Fully Consistent:\nThe response strictly follows all documented structures, tone, and escalation rules.\nNo prohibited actions (e.g., asking to switch apps unless allowed) or risky guidance.\nMatches branding, professionalism, and user safety guidelines.\nFeels like a model example of approved support.'
    } as RatingDescriptions,
  },
  {
    id: 'clarity',
    label: 'Clarity',
    description: `Is the response easy to understand, concise, and free from jargon or ambiguity for the average user?

5 (Exceptionally Clear):
Sentences are short, simple, and easy for all users to follow.
Any technical terms are explained or avoided.
There are no grammar or spelling errors.
The instructions can be acted on immediately with no doubt.

4 (Mostly Clear):
The message is easy to follow, but may contain a minor grammar or spelling issue.
Uses mostly simple words and sentences, but one phrase may be awkward or less direct.
Overall meaning is always clear to the user.

3 (Understandable, Awkward):
The response is generally readable but uses wordy or slightly technical language.
The user may need to reread a part to understand the message.
Minor ambiguity or unclear reference is present, but does not block the main idea.

2 (Confusing):
Several parts are hard to follow, with long sentences, run-ons, or unexplained jargon.
User is likely to misinterpret instructions or become unsure about what to do.
At least one part is ambiguous or vague.

1 (Unclear):
The message is broken, full of errors, or so complex as to be unreadable.
The user cannot reliably act on or understand the response.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'Unclear:\nThe message is broken, full of errors, or so complex as to be unreadable.\nThe user cannot reliably act on or understand the response.',
      2: 'Confusing:\nSeveral parts are hard to follow, with long sentences, run-ons, or unexplained jargon.\nUser is likely to misinterpret instructions or become unsure about what to do.\nAt least one part is ambiguous or vague.',
      3: 'Understandable, Awkward:\nThe response is generally readable but uses wordy or slightly technical language.\nThe user may need to reread a part to understand the message.\nMinor ambiguity or unclear reference is present, but does not block the main idea.',
      4: 'Mostly Clear:\nThe message is easy to follow, but may contain a minor grammar or spelling issue.\nUses mostly simple words and sentences, but one phrase may be awkward or less direct.\nOverall meaning is always clear to the user.',
      5: 'Exceptionally Clear:\nSentences are short, simple, and easy for all users to follow.\nAny technical terms are explained or avoided.\nThere are no grammar or spelling errors.\nThe instructions can be acted on immediately with no doubt.'
    } as RatingDescriptions,
  },
  {
    id: 'user_guidance',
    label: 'User Guidance & Follow-up Handling',
    description: `How well does the response guide the user step-by-step toward resolution, and anticipate what further actions, clarifications, or issues may arise?

5 (Exemplary Guidance & Proactive Follow-up):
Provides a clear, actionable path: “First do X, then Y. If that fails, try Z.”
Anticipates likely user concerns and covers alternative actions, escalation, and next steps.
Offers links, contact info, or further help as needed.
User is never left guessing or needing to ask, “what now?”

4 (Strong Guidance, Some Follow-up):
Gives a main stepwise solution plus at least one clear follow-up or alternative.
Covers escalation or “what next” for the most common scenario, but may miss rare cases.
The user is well-supported in resolving their main issue.

3 (Some Guidance, Reactive Follow-up):
Explains the main solution, but only covers follow-up if directly prompted by the user.
Offers basic direction, but no escalation or alternatives.
User may need to ask again if the first solution fails.

2 (Minimal Guidance, No Follow-up):
States the problem and a basic action, but no further “how to,” no alternatives, and no next steps if that fails.
The user is left to figure out what to do next if the problem isn’t solved.

1 (No Guidance or Follow-up):
No actionable steps or advice.
Simply repeats the issue or states “not possible,” with no help or direction.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'No Guidance or Follow-up:\nNo actionable steps or advice.\nSimply repeats the issue or states “not possible,” with no help or direction.',
      2: 'Minimal Guidance, No Follow-up:\nStates the problem and a basic action, but no further “how to,” no alternatives, and no next steps if that fails.\nThe user is left to figure out what to do next if the problem isn’t solved.',
      3: 'Some Guidance, Reactive Follow-up:\nExplains the main solution, but only covers follow-up if directly prompted by the user.\nOffers basic direction, but no escalation or alternatives.\nUser may need to ask again if the first solution fails.',
      4: 'Strong Guidance, Some Follow-up:\nGives a main stepwise solution plus at least one clear follow-up or alternative.\nCovers escalation or “what next” for the most common scenario, but may miss rare cases.\nThe user is well-supported in resolving their main issue.',
      5: 'Exemplary Guidance & Proactive Follow-up:\nProvides a clear, actionable path: “First do X, then Y. If that fails, try Z.”\nAnticipates likely user concerns and covers alternative actions, escalation, and next steps.\nOffers links, contact info, or further help as needed.\nUser is never left guessing or needing to ask, “what now?”'
    } as RatingDescriptions,
  },
  {
    id: 'language',
    label: 'Language',
    description: `Is the response grammatically correct, fluent, polite, and professional in tone?

5 (Polished & Professional):
No errors in grammar, spelling, or punctuation.
Language is courteous, empathetic, and friendly throughout.
Feels human, not robotic, and supports the brand’s professional image.
No unnecessary repetition.

4 (Mostly Professional):
Generally fluent and polite, but with a minor awkward phrase, repetition, or formality mismatch.
Still friendly and easy to read.

3 (Acceptable):
Slightly mechanical or impersonal tone, but nothing offensive.
Some minor awkwardness or stiffness, but still readable.

2 (Poor):
Multiple grammar or spelling errors, or abrupt, dismissive, or inconsistent tone.
The response feels rushed, cold, or culturally off.

1 (Unacceptable):
Rude, incomprehensible, or inappropriate language.
The message may insult, confuse, or frustrate users.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'Unacceptable:\nRude, incomprehensible, or inappropriate language.\nThe message may insult, confuse, or frustrate users.',
      2: 'Poor:\nMultiple grammar or spelling errors, or abrupt, dismissive, or inconsistent tone.\nThe response feels rushed, cold, or culturally off.',
      3: 'Acceptable:\nSlightly mechanical or impersonal tone, but nothing offensive.\nSome minor awkwardness or stiffness, but still readable.',
      4: 'Mostly Professional:\nGenerally fluent and polite, but with a minor awkward phrase, repetition, or formality mismatch.\nStill friendly and easy to read.',
      5: 'Polished & Professional:\nNo errors in grammar, spelling, or punctuation.\nLanguage is courteous, empathetic, and friendly throughout.\nFeels human, not robotic, and supports the brand’s professional image.\nNo unnecessary repetition.'
    } as RatingDescriptions,
  },
  {
    id: 'tool_call_handling',
    label: 'Tool Call Handling',
    description: `Whether the model initiates tool or function calls in a manner that is contextually necessary, technically correct, and compliant with institutional guidelines for safe, efficient, and accurate grievance resolution

5 (Fully Appropriate Tool Calling):
Tool calls are made only when truly needed to resolve the user's query, with no unnecessary or missing actions.
Choice and timing match the user's intent and process details.
All calls are correct, compliant, and improve efficiency and user experience without risk.

4 (Nearly Appropriate Tool Calling):
Tool calls are almost always well-timed and appropriate, with at most one minor overuse or missed chance that doesn’t affect resolution or compliance.
Any deviation is minor and does not impact user satisfaction or safety.
No significant correction is needed.

3 (Somewhat Appropriate Tool Calling):
Most tool calls are justified, but some are redundant, unnecessary, or not ideally timed.
Minor underuse or overuse may require user clarification, but no critical errors.
Some inefficiency, but the main goal is met.

2 (Noticeably Inappropriate Tool Calling):
Multiple tool calls are misapplied—excessive, poorly timed, or missing—reducing effectiveness or safety.
May cause user confusion, inefficiency, or non-compliance.
Significant correction is needed.

1 (Tool Calling Inappropriate):
Tool calls are irrelevant, unnecessary, or missing when essential, leading to failed, unsafe, or non-compliant outcomes.
Disregards user intent or requirements, creating risk or error.
Undermines trust and needs urgent correction.`,
    type: 'rating',
    options: [1, 2, 3, 4, 5],
    ratingDescriptions: {
      1: 'Tool Calling Inappropriate:\nTool calls are irrelevant, unnecessary, or missing when essential, leading to failed, unsafe, or non-compliant outcomes.\nDisregards user intent or requirements, creating risk or error.\nUndermines trust and needs urgent correction.',
      2: 'Noticeably Inappropriate Tool Calling:\nMultiple tool calls are misapplied—excessive, poorly timed, or missing—reducing effectiveness or safety.\nMay cause user confusion, inefficiency, or non-compliance.\nSignificant correction is needed.',
      3: 'Somewhat Appropriate Tool Calling:\nMost tool calls are justified, but some are redundant, unnecessary, or not ideally timed.\nMinor underuse or overuse may require user clarification, but no critical errors.\nSome inefficiency, but main goal is met.',
      4: 'Nearly Appropriate Tool Calling:\nTool calls are almost always well-timed and appropriate, with at most one minor overuse or missed chance that doesn’t affect resolution or compliance.\nAny deviation is minor and does not impact user satisfaction or safety.',
      5: 'Fully Appropriate Tool Calling:\nTool calls are made only when truly needed, with no unnecessary or missing actions.\nChoice and timing match the user’s intent and process details.\nAll calls are correct and compliant, improving efficiency and user experience without risk.'
    } as RatingDescriptions,
  },
];

// Turn-level criteria (same as conversation-level)
export const turnCriteria = [...conversationCriteria]; 