export const TALK_DISTANCE = 4.2;
export const INSPECT_DISTANCE = 2.25;
export const REPAIR_DISTANCE = 2.1;
export const SQUIRTLE_NOTICE_DISTANCE = 5.4;
export const SQUIRTLE_TALK_DISTANCE = 1.85;
export const FOLLOW_SPEED = 2.05;
export const CAMERA_LOOK_COMPLETE_DELAY = 0.9;
export const NAME_CHAR_LIMIT = 12;

export const OPENING_LINE = "Hohohoh! I've found quite the haul today!";
export const SQUIRTLE_HELP_LINE = "nnng...Wa...water...";

export const NAME_KEYBOARD_ROWS = [
  ["#", "[", "]", "$", "%", "^", "&", "*", "(", ")", "_"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "@"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "\""],
  ["Z", "X", "C", "V", "B", "N", "M", "<", ">", "+", "="]
];

const TANGROWTH_NAME = "Tangrowth";

const HUMAN_CHOICES = [
  { id: "human", label: "Sure am!" },
  { id: "nope", label: "Nope" }
];

const POKEDEX_REACTION_CHOICES = [
  { id: "really", label: "Really?" },
  { id: "awww", label: "Awww..." }
];

const POKEDEX_CHOICES = [
  { id: "want-it", label: "I want it!" },
  { id: "junky", label: "It's kinda junky" }
];

const TRAINER_MEMORY_CHOICES = [
  { id: "yep", label: "Yep" },
  { id: "bingo", label: "Bingo!" }
];

const NAME_CONFIRM_CHOICES = [
  { id: "betcha", label: "You betcha!" },
  { id: "nope", label: "Uhh, nope..." }
];

const WORLD_QUESTION_CHOICES = [
  { id: "humans", label: "What happened to the humans?" },
  { id: "world", label: "What happened to this world?" }
];

export function getActTwoTutorialFollowTarget(state) {
  if (state.followTargetId === "overlook") {
    return {
      id: "overlook",
      destination: [18.6, 0.02, -12.4],
      title: state.followTargetReached ? "Catch Up" : "Follow Tangrowth",
      eyebrow: "Escort",
      copy: state.followTargetReached
        ? "Tangrowth stopped ahead. Move closer to keep talking."
        : "Tangrowth is heading deeper into the ruins. Keep up.",
      nextConversation: "overlookInfo"
    };
  }

  if (state.followTargetId === "plant") {
    return {
      id: "plant",
      destination: [
        state.repairPlantPosition[0] - 2.15,
        state.repairPlantPosition[1],
        state.repairPlantPosition[2] - 0.85
      ],
      title: state.followTargetReached ? "Catch Up" : "Follow Tangrowth",
      eyebrow: "Escort",
      copy: state.followTargetReached
        ? "Tangrowth found the object. Walk up to him."
        : "Tangrowth spotted something ahead. Follow him to the object.",
      nextConversation: "repairIntro"
    };
  }

  return null;
}

export function getActTwoTutorialConversation(conversationId, state) {
  switch (conversationId) {
    case "intro":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Wh-What was that? Who's there?!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Gadzooks! what in the world is a human doing here?! I din't think there were any left!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Hm? There's sometning curious about you... Are you Really a human?",
          choices: HUMAN_CHOICES,
          responseKey: "humanClaim"
        }
      ];
    case "reveal":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "those simples eyes... that slack mouth... Hrm?! wait a moment..."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Are you a Ditto?! My, what an impressive transformation!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Huum, what's that sound? where it is comming from?!"
        }
      ];
    case "squirtleDiscovery":
      return [
        {
          speaker: "Squirtle",
          text: SQUIRTLE_HELP_LINE
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Well, I'll be gobsmacked! if it isn't a Squirtle! And the'yre nearly all dried up!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Here I thought Squirtle were supposed to have an excellent command of water..."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Isin't there anything we can do to help?!"
        }
      ];
    case "squirtleHelp":
      return [
        {
          speaker: "Squirtle",
          text: "Rrrgh... Usually i can spray all the water i want..."
        },
        {
          speaker: "Squirtle",
          text: "Ahh, if only there were...another healthy squirtle around to help me..."
        }
      ];
    case "transformUnlock":
      return [
        {
          speaker: "",
          text: "You used Transform!"
        },
        {
          speaker: "",
          text: "You learned Water gun!"
        }
      ];
    case "waterGunPrompt":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "I must say, I've seen better transformations in my time... but it looks like you can use Squirtle's move!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Can you use that move to squirtle?"
        }
      ];
    case "squirtleSaved":
      return [
        {
          speaker: "Squirtle",
          text: "Im saved, thank you! i really though i was done for"
        },
        {
          speaker: "Squirtle",
          text: "I owe you my life..."
        },
        {
          speaker: "Squirtle",
          text: "Huh? Something's beeping..."
        }
      ];
    case "afterPokedexIntro":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Oho! looks like that pokedex still works after all!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "though, it truly has veen an age since I last saw any other Pokemon"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "That Pokedex days of being useful may be long gone",
          choices: POKEDEX_REACTION_CHOICES,
          responseKey: "pokedexReaction"
        }
      ];
    case "afterPokedexHope":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "But that was then! Things have changed!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "I'd come to believe this world was down to a population of one-me."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "But today, out of nowhere, I met the two of you! Hope springs a new!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "By the way, where in the world have you two been up until now?"
        }
      ];
    case "squirtlePast":
      return [
        {
          speaker: "Squirtle",
          text: "Hum... I don't really remember too well..."
        },
        {
          speaker: "Squirtle",
          text: "I aways used to take naps next to a nice, celar pond."
        },
        {
          speaker: "Squirtle",
          text: "But this time...I woke up here, flat on the ground. Maybe i slept a little too much."
        }
      ];
    case "wastelandReply":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Is that so? Facinating..."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "But this whole area's a total wasteland. I dont know of any ponds around here..."
        }
      ];
    case "groundGreening":
      return [
        {
          speaker: "Squirtle",
          text: "Forget about that, look at this!"
        },
        {
          speaker: "Squirtle",
          text: "See, the ground around here turned green!"
        },
        {
          speaker: "Squirtle",
          text: "I bet it grew because you sprayed water around here! That's so awesome!"
        }
      ];
    case "waterRequest":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Oho... It's true! the ground was parched, but now it's sprung back to life! It's only a bit, but it works just like it did in the good old days!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Name... It seems you might have some sort of mysterious power."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "What do you say? Will you water the ground and plants around here for us?"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "If you do, this place could become so much nicer to live in-like it was before!"
        }
      ];
    case "squirtleAgreement":
      return [
        {
          speaker: "Squirtle",
          text: "Yeah, great idea!"
        }
      ];
    case "pokedex":
      return [
        {
          speaker: "",
          text: "You found a Pokedex! it's even quipped with a camera that can take selfies!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Oho! that's a pokedex i found ages ago!",
          choices: POKEDEX_CHOICES,
          responseKey: "pokedexChoice"
        }
      ];
    case "trainerMemory":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Your human transformation really is quite impressove, you know."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "And now that you have a pokedex, you just look like a pokemon trainer"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "could it be you've base that look of yours on your own Trainer?",
          choices: TRAINER_MEMORY_CHOICES,
          responseKey: "trainerLookChoice"
        }
      ];
    case "trainerMemoryFinale":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Hohoho! im's sure you and your trainer must have been splendid partners"
        }
      ];
    case "namePrompt":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Do you have a name?"
        }
      ];
    case "nameConfirm":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: `Ahhh, so you were called "${state.responses.playerName || state.playerName || "Ditto"}"?`,
          choices: NAME_CONFIRM_CHOICES,
          responseKey: "nameConfirmation"
        }
      ];
    case "worldQuestion":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "It's been quite some time i dont see an human around here",
          choices: WORLD_QUESTION_CHOICES,
          responseKey: "worldQuestion"
        }
      ];
    case "comeWithMe":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Ohh, you dont know what's happened here? Right then. Come with me."
        }
      ];
    case "overlookInfo":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Humans used to live here, but now it's... well, what you see."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "The grass is dead, there is dust all over the place..."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "What's tht on the ground over there? could it be a robot?!",
          cameraFocusTarget: "repairPlant"
        }
      ];
    case "goSee":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "let's go see!"
        }
      ];
    case "repairIntro":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Oh, it's a plant! it needs to be fixed!"
        }
      ];
    default:
      return [];
  }
}
