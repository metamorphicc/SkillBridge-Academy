export const QUALIFICATION_STEPS = [
  {
    key: "goal",
    prompt: "What is the student's main learning goal?",
    quickReplies: ["Change career", "Improve current role", "Explore options"],
  },
  {
    key: "level",
    prompt: "What is their current level?",
    quickReplies: ["Beginner", "Already practicing", "Experienced"],
  },
  {
    key: "start",
    prompt: "When do they want to start?",
    quickReplies: ["Within 7 days", "This month", "In 1-2 months", "Not sure yet"],
  },
  {
    key: "format",
    prompt: "Which format sounds best?",
    quickReplies: ["Group", "Individual consultation", "Not sure"],
  },
  {
    key: "budget",
    prompt: "Are they ready to discuss budget or payment options?",
    quickReplies: ["Ready to discuss", "Need price first", "Just browsing"],
  },
  {
    key: "contactTime",
    prompt: "When is a good time for the manager to contact them?",
    quickReplies: ["Today", "Tomorrow", "This week"],
  },
];

export function nextQuestion(answers) {
  return QUALIFICATION_STEPS.find((step) => !answers[step.key]) || null;
}

export function previousAnsweredQuestion(answers) {
  return [...QUALIFICATION_STEPS].reverse().find((step) => answers[step.key]) || null;
}

export function questionIndex(question) {
  const index = QUALIFICATION_STEPS.findIndex((step) => step.key === question?.key);
  return index < 0 ? 0 : index + 1;
}
