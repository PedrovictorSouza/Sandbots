export const INTRO_STEPS = [
  {
    id: "wake-1",
    type: "dialogue",
    pose: "sleeping",
    text: "Impact confirmed. Wake up, Builder. Your capsule is the only one still answering.",
  },
  {
    id: "memory-crash",
    type: "carousel",
    pose: "awake",
    slideIndex: 2,
    text: "The colony ship broke apart during entry. The planet is damaged, but still viable if we move now.",
  },
  {
    id: "builder-recall",
    type: "gender",
    pose: "awake",
    text: "Before the capsule opens, identify the Builder who woke up.",
  },
  {
    id: "builder-confirm",
    type: "confirm",
    pose: "awake",
    text: "Review this Builder before we unlock the capsule.",
  },
  {
    id: "builder-editor",
    type: "editor",
    pose: "awake",
    text: "Good. Adjust anything you need. Once we leave this capsule, the mission begins.",
  },
];
