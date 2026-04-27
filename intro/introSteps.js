export const INTRO_STEPS = [
  {
    id: "wake-1",
    type: "dialogue",
    pose: "sleeping",
    text: "Hey. Wake up, little Builder. Your core survived the fall.",
  },
  {
    id: "wake-2",
    type: "dialogue",
    pose: "awake",
    text: "Easy now. Your systems are still rebooting. You were inside the last capsule.",
  },
  {
    id: "memory-signal",
    type: "carousel",
    pose: "awake",
    slideIndex: 0,
    text: "This is the final signal from Earth. It was sent before the mission went silent.",
  },
  {
    id: "memory-earth",
    type: "carousel",
    pose: "awake",
    slideIndex: 1,
    text: "These archives hold what remains of our old world: forests, oceans, cities, creatures... everything we could save.",
  },
  {
    id: "memory-crash",
    type: "carousel",
    pose: "awake",
    slideIndex: 2,
    text: "The ship broke apart during entry. The other Builder capsules are scattered across this planet.",
  },
  {
    id: "builder-recall",
    type: "gender",
    pose: "awake",
    text: "Before we move, I need to identify your Builder frame. Which model woke up?",
  },
  {
    id: "builder-confirm",
    type: "confirm",
    pose: "awake",
    text: "Got it. So this is the form your core chose?",
  },
  {
    id: "builder-editor",
    type: "editor",
    pose: "awake",
    text: "Good. Adjust anything you need. Once we leave this capsule, the mission begins.",
  },
];