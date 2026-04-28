const DEFAULT_UV_RECT = Object.freeze([0, 0, 1, 1]);

function createColliderGizmoCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 230, 0, 0.34)";
  context.fillRect(4, 4, 56, 56);
  context.strokeStyle = "rgba(255, 30, 30, 0.95)";
  context.lineWidth = 5;
  context.strokeRect(5.5, 5.5, 53, 53);
  context.strokeStyle = "rgba(255, 255, 255, 0.92)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(8, 8);
  context.lineTo(56, 56);
  context.moveTo(56, 8);
  context.lineTo(8, 56);
  context.stroke();
  context.fillStyle = "rgba(255, 0, 0, 0.98)";
  context.fillRect(28, 28, 8, 8);

  return canvas;
}

function createColliderLabelCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 32;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0.72)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(255, 230, 0, 0.95)";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
  context.fillStyle = "#fff1a8";
  context.font = "bold 14px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("COLLIDER", canvas.width * 0.5, canvas.height * 0.5);

  return canvas;
}

function createSquareGizmoBillboard(texture, collider) {
  const sizeX = (collider.size?.[0] || 1) + (collider.padding || 0) * 2;
  const sizeZ = (collider.size?.[2] || 1) + (collider.padding || 0) * 2;
  const size = Math.max(sizeX, sizeZ, 1);
  const surfaceY = collider.surfaceY ?? collider.position?.[1] ?? 0;

  return {
    texture,
    position: [collider.position[0], surfaceY + 0.08, collider.position[2]],
    size: [size, size],
    uvRect: DEFAULT_UV_RECT
  };
}

function createLabelBillboard(texture, collider) {
  const surfaceY = collider.surfaceY ?? collider.position?.[1] ?? 0;

  return {
    texture,
    position: [collider.position[0], surfaceY + 1.1, collider.position[2]],
    size: [2.2, 0.72],
    uvRect: DEFAULT_UV_RECT
  };
}

export function createColliderGizmoTextures(worldTextureFactory) {
  return {
    collider: worldTextureFactory.fromCanvas(createColliderGizmoCanvas()),
    label: worldTextureFactory.fromCanvas(createColliderLabelCanvas())
  };
}

export function getColliderGizmoBillboards({ colliders = [], textures = null } = {}) {
  if (!textures?.collider || !textures?.label || !Array.isArray(colliders)) {
    return [];
  }

  const billboards = [];
  for (const collider of colliders) {
    if (!collider?.blocksPlayer || !Array.isArray(collider.position)) {
      continue;
    }

    billboards.push(createSquareGizmoBillboard(textures.collider, collider));
    billboards.push(createLabelBillboard(textures.label, collider));
  }

  return billboards;
}
