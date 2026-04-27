function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Nao foi possivel carregar ${url}`));
    image.src = url;
  });
}

function isChromaPixel(red, green, blue) {
  const isGreen = Math.abs(red - 0) <= 12 && Math.abs(green - 254) <= 16 && Math.abs(blue - 46) <= 16;
  const isMagenta = Math.abs(red - 255) <= 16 && Math.abs(green - 16) <= 20 && Math.abs(blue - 250) <= 20;
  return isGreen || isMagenta;
}

function createKeyedCanvas(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    if (isChromaPixel(data[index], data[index + 1], data[index + 2])) {
      data[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function normalizeCollisionResult(result) {
  if (result && typeof result === "object") {
    return {
      blocked: Boolean(result.blocked),
      landingY: Number.isFinite(result.landingY) ? result.landingY : null
    };
  }

  return {
    blocked: Boolean(result),
    landingY: null
  };
}

export function createStaticController() {
  return {
    getIntent() {
      return {
        movement: [0, 0, 0],
        moving: false,
        facing: "down",
      };
    },
  };
}

export async function createCharacterFactory({
  spriteSheetUrl,
  idleUrl,
  walkColumns = 3,
  walkRows = 4,
  walkFrameDuration = 0.12,
  directionRows = {
    left: 0,
    right: 1,
    up: 2,
    down: 3,
  },
}) {
  const [spriteSheetImage, idleImage] = await Promise.all([
    loadImage(spriteSheetUrl),
    loadImage(idleUrl),
  ]);

  const walkSheet = createKeyedCanvas(spriteSheetImage);
  const idleSheet = createKeyedCanvas(idleImage);

  const sharedAssets = {
    walk: {
      canvas: walkSheet,
      width: walkSheet.width,
      height: walkSheet.height,
      frameWidth: walkSheet.width / walkColumns,
      frameHeight: walkSheet.height / walkRows,
      frameDuration: walkFrameDuration,
      directionRows,
    },
    idle: {
      canvas: idleSheet,
      width: idleSheet.width,
      height: idleSheet.height,
      frameWidth: idleSheet.width,
      frameHeight: idleSheet.height,
    },
  };

  return {
    getSharedAssets() {
      return sharedAssets;
    },

    createCharacter({
      id,
      position = [0, 0, 0],
      speed = 3,
      runSpeedMultiplier = 1.55,
      runAcceleration = 10,
      worldHeight = 1.4,
      controller = createStaticController(),
      collisionTest = null,
    } = {}) {
      const baseGroundY = position[1] || 0;
      const state = {
        id: id || `character-${Math.random().toString(36).slice(2, 8)}`,
        position: [...position],
        facing: "down",
        pattern: "idle",
        animationTime: 0,
        currentSpeed: 0,
        verticalVelocity: 0,
        groundY: baseGroundY,
      };

      function resolveIntent() {
        const fallback = {
          movement: [0, 0, 0],
          moving: false,
          facing: state.facing,
        };
        return controller?.getIntent?.() || fallback;
      }

      return {
        get id() {
          return state.id;
        },

        getPosition() {
          return [...state.position];
        },

        update(deltaTime) {
          const intent = resolveIntent();
          const movement = [...intent.movement];
          const length = Math.hypot(movement[0], movement[2]) || 0;
          const grounded = state.position[1] <= state.groundY + 0.001;

          if (intent.jumping && grounded) {
            state.verticalVelocity = 7.2;
          }

          if (!grounded || state.verticalVelocity > 0) {
            state.verticalVelocity -= 15.5 * deltaTime;
            state.position[1] = Math.max(
              state.groundY,
              state.position[1] + state.verticalVelocity * deltaTime
            );

            if (state.position[1] === state.groundY) {
              state.verticalVelocity = 0;
            }
          }

          if (!length || !intent.moving) {
            state.pattern = "idle";
            state.animationTime = 0;
            state.currentSpeed = 0;
            return;
          }

          movement[0] /= length;
          movement[2] /= length;
          if (state.currentSpeed === 0) {
            state.currentSpeed = speed;
          }
          const targetSpeed = speed * (intent.running ? runSpeedMultiplier : 1);
          const speedDelta = targetSpeed - state.currentSpeed;
          const maxSpeedDelta = runAcceleration * deltaTime;
          const nextSpeedDelta = Math.max(-maxSpeedDelta, Math.min(maxSpeedDelta, speedDelta));
          state.currentSpeed += nextSpeedDelta;

          const nextPosition = [
            state.position[0] + movement[0] * state.currentSpeed * deltaTime,
            state.position[1],
            state.position[2] + movement[2] * state.currentSpeed * deltaTime,
          ];

          const collision = normalizeCollisionResult(
            collisionTest ? collisionTest(nextPosition, state.id) : false
          );
          if (!collision.blocked) {
            if (collision.landingY !== null && state.verticalVelocity <= 0.8) {
              nextPosition[1] = collision.landingY;
              state.groundY = collision.landingY;
              state.verticalVelocity = 0;
            } else if (collision.landingY === null && state.groundY > baseGroundY) {
              state.groundY = baseGroundY;
            }
            state.position = nextPosition;
          }

          state.facing = intent.facing || state.facing;
          state.pattern = "walk";
          state.animationTime += deltaTime;
        },

        getRenderState() {
          let sheetKey = "idle";
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = sharedAssets.idle.frameWidth;
          let sourceHeight = sharedAssets.idle.frameHeight;

          if (state.pattern === "walk") {
            const frameSequence = [0, 1, 2, 1];
            const frameIndex = frameSequence[
              Math.floor(state.animationTime / sharedAssets.walk.frameDuration) % frameSequence.length
            ];
            sheetKey = "walk";
            sourceX = frameIndex * sharedAssets.walk.frameWidth;
            sourceY = sharedAssets.walk.directionRows[state.facing] * sharedAssets.walk.frameHeight;
            sourceWidth = sharedAssets.walk.frameWidth;
            sourceHeight = sharedAssets.walk.frameHeight;
          }

          const sheet = sharedAssets[sheetKey];

          return {
            textureKey: sheetKey,
            position: [...state.position],
            size: [worldHeight * (sourceWidth / sourceHeight), worldHeight],
            uvRect: [
              sourceX / sheet.width,
              sourceY / sheet.height,
              (sourceX + sourceWidth) / sheet.width,
              (sourceY + sourceHeight) / sheet.height,
            ],
          };
        },
      };
    },
  };
}
