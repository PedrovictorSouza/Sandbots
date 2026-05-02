export const FULL_UV_RECT = [0, 0, 1, 1];
export const WORLD_MARKER_HEIGHT = 0.04;
export const WORLD_MARKER_SIZE = [1.05, 1.05];
export const NPC_MARKER_SIZE = [0.9, 0.9];
export const NPC_MARKER_OFFSET = 1.65;
export const ACT_TWO_MONSTER_SIZE = [2.6, 2.42];
export const ACT_TWO_SQUIRTLE_POSITION = [17.8, 0.02, -10.4];
export const ACT_TWO_SQUIRTLE_SIZE = [2.24, 2.12];
export const ACT_TWO_BULBASAUR_SIZE = [2.26, 2.14];
export const ACT_TWO_CHARMANDER_SIZE = [2.18, 2.08];
export const ACT_TWO_POKEDEX_CACHE_POSITION = [9.65, 0.02, -8.65];
export const ACT_TWO_REPAIR_PLANT_POSITION = [28.4, 0.02, -4.4];
export const ACT_TWO_REPAIR_PLANT_SIZE = [2.8, 2.42];
export const GROUND_GRASS_SIZE = [1.18, 0.96];
export const GROUND_FLOWER_SIZE = [0.94, 0.72];

const SCENE_VERTEX_SOURCE = `
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;
  attribute vec3 aNormal;

  uniform mat4 uViewProjection;
  uniform vec3 uModelOffset;
  uniform float uModelScale;
  uniform float uModelHeight;
  uniform vec3 uInstanceOffset;
  uniform float uInstanceScale;
  uniform float uInstanceYaw;
  uniform float uInstancePitch;
  uniform float uInstanceRoll;
  uniform float uLocalYaw;
  uniform vec3 uLocalPivot;
  uniform float uSwayStrength;
  uniform float uJitterAmount;
  uniform vec2 uPixelSnap;
  uniform float uTime;

  varying vec2 vTexCoord;
  varying vec3 vWorldNormal;

  void main() {
    vec3 local = aPosition * uModelScale + uModelOffset;

    vec3 localPivot = uLocalPivot * uModelScale + uModelOffset;
    local -= localPivot;

    float localYawSine = sin(uLocalYaw);
    float localYawCosine = cos(uLocalYaw);
    vec3 normal = aNormal;

    local = vec3(
      local.x * localYawCosine - local.z * localYawSine,
      local.y,
      local.x * localYawSine + local.z * localYawCosine
    );
    normal = vec3(
      normal.x * localYawCosine - normal.z * localYawSine,
      normal.y,
      normal.x * localYawSine + normal.z * localYawCosine
    );

    local += localPivot;

    vec3 scaled = local * uInstanceScale;
    float heightFactor = clamp(scaled.y / max(uModelHeight * uInstanceScale, 0.001), 0.0, 1.0);
    scaled.x += uSwayStrength * heightFactor * heightFactor;
    float rollSine = sin(uInstanceRoll);
    float rollCosine = cos(uInstanceRoll);
    vec3 rolled = vec3(
      scaled.x * rollCosine - scaled.y * rollSine,
      scaled.x * rollSine + scaled.y * rollCosine,
      scaled.z
    );
    normal = vec3(
      normal.x * rollCosine - normal.y * rollSine,
      normal.x * rollSine + normal.y * rollCosine,
      normal.z
    );
    float pitchSine = sin(uInstancePitch);
    float pitchCosine = cos(uInstancePitch);
    vec3 pitched = vec3(
      rolled.x,
      rolled.y * pitchCosine - rolled.z * pitchSine,
      rolled.y * pitchSine + rolled.z * pitchCosine
    );
    normal = vec3(
      normal.x,
      normal.y * pitchCosine - normal.z * pitchSine,
      normal.y * pitchSine + normal.z * pitchCosine
    );
    float sine = sin(uInstanceYaw);
    float cosine = cos(uInstanceYaw);
    vec3 world = vec3(
      pitched.x * cosine - pitched.z * sine,
      pitched.y,
      pitched.x * sine + pitched.z * cosine
    ) + uInstanceOffset;
    normal = normalize(vec3(
      normal.x * cosine - normal.z * sine,
      normal.y,
      normal.x * sine + normal.z * cosine
    ));
    vec4 clip = uViewProjection * vec4(world, 1.0);

    float phase = uTime * 3.5 + world.x * 1.7 + world.y * 2.3 + world.z * 1.1;
    vec2 jitter = vec2(sin(phase), cos(phase * 0.83)) * (0.008 * uJitterAmount);

    clip.xy += jitter * clip.w;
    vec2 snapped = floor((clip.xy / clip.w) * uPixelSnap + 0.5) / uPixelSnap;
    clip.xy = snapped * clip.w;
    gl_Position = clip;
    vTexCoord = aTexCoord;
    vWorldNormal = normal;
  }
`;

const SCENE_FRAGMENT_SOURCE = `
  precision mediump float;

  uniform sampler2D uTexture;
  uniform float uBrightness;
  varying vec2 vTexCoord;
  varying vec3 vWorldNormal;

  void main() {
    vec4 texel = texture2D(uTexture, vTexCoord);
    if (texel.a < 0.02) {
      discard;
    }

    vec3 normal = normalize(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
    vec3 lightDirection = normalize(vec3(0.55, 0.78, 0.35));
    float light = dot(normal, lightDirection);
    float sideFace = 1.0 - smoothstep(0.45, 0.86, normal.y);
    float halfShadow = sideFace * (1.0 - smoothstep(0.05, 0.72, light));
    float deepShadow = sideFace * (1.0 - smoothstep(-0.34, 0.16, light));
    vec2 ditherCell = floor(gl_FragCoord.xy / 2.0);
    float checker = mod(ditherCell.x + ditherCell.y, 2.0);
    float solidShade = mix(1.0, 0.82, halfShadow);
    float ditherShade = mix(0.66, 0.78, checker);
    float shade = mix(solidShade, ditherShade, deepShadow);

    gl_FragColor = vec4(texel.rgb * shade * uBrightness, texel.a);
  }
`;

const SPRITE_VERTEX_SOURCE = `
  attribute vec2 aCorner;
  attribute vec2 aTexCoord;

  uniform mat4 uViewProjection;
  uniform vec3 uWorldPosition;
  uniform vec2 uSpriteSize;
  uniform vec3 uQuadRight;
  uniform vec3 uQuadUp;
  uniform vec4 uUvRect;
  uniform float uSpriteRotation;
  uniform vec2 uPixelSnap;

  varying vec2 vTexCoord;

  void main() {
    float rotationSine = sin(uSpriteRotation);
    float rotationCosine = cos(uSpriteRotation);
    vec2 rotatedCorner = vec2(
      aCorner.x * rotationCosine - aCorner.y * rotationSine,
      aCorner.x * rotationSine + aCorner.y * rotationCosine
    );
    vec3 world =
      uWorldPosition +
      uQuadRight * (rotatedCorner.x * uSpriteSize.x) +
      uQuadUp * (rotatedCorner.y * uSpriteSize.y);

    vec4 clip = uViewProjection * vec4(world, 1.0);
    vec2 snapped = floor((clip.xy / clip.w) * uPixelSnap + 0.5) / uPixelSnap;
    clip.xy = snapped * clip.w;
    gl_Position = clip;

    vTexCoord = vec2(
      mix(uUvRect.x, uUvRect.z, aTexCoord.x),
      mix(uUvRect.y, uUvRect.w, aTexCoord.y)
    );
  }
`;

const SPRITE_FRAGMENT_SOURCE = `
  precision mediump float;

  uniform sampler2D uSpriteTexture;
  uniform float uSpriteAlpha;
  varying vec2 vTexCoord;

  void main() {
    vec4 texel = texture2D(uSpriteTexture, vTexCoord);
    float alpha = texel.a * uSpriteAlpha;
    if (alpha < 0.03) {
      discard;
    }
    gl_FragColor = vec4(texel.rgb, alpha);
  }
`;

const SKY_VERTEX_SOURCE = `
  attribute vec2 aPosition;

  varying vec2 vScreenUv;

  void main() {
    vScreenUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const SKY_FRAGMENT_SOURCE = `
  precision mediump float;

  uniform sampler2D uSkyTexture;
  uniform float uSkyYaw;
  uniform float uSkyPitch;

  varying vec2 vScreenUv;

  const float PI = 3.14159265359;

  void main() {
    float horizontalSpan = 1.0;
    float u = fract(0.5 + (uSkyYaw / (PI * 2.0)) + (vScreenUv.x - 0.5) * horizontalSpan);
    float pitchOffset = clamp(uSkyPitch, -0.9, 0.9) * 0.12;
    float v = clamp(1.0 - vScreenUv.y + pitchOffset, 0.001, 0.999);

    gl_FragColor = texture2D(uSkyTexture, vec2(u, v));
  }
`;

export function createNoopWebGlContext() {
  let handleId = 0;
  const createHandle = (kind) => ({ kind, id: ++handleId });
  const noop = () => {};

  return {
    ARRAY_BUFFER: 0x8892,
    BLEND: 0x0BE2,
    CLAMP_TO_EDGE: 0x812F,
    COLOR_BUFFER_BIT: 0x4000,
    COMPILE_STATUS: 0x8B81,
    CULL_FACE: 0x0B44,
    DEPTH_BUFFER_BIT: 0x0100,
    DEPTH_TEST: 0x0B71,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    FLOAT: 0x1406,
    FRAGMENT_SHADER: 0x8B30,
    LINEAR: 0x2601,
    LINK_STATUS: 0x8B82,
    NEAREST: 0x2600,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    REPEAT: 0x2901,
    RGBA: 0x1908,
    SRC_ALPHA: 0x0302,
    STATIC_DRAW: 0x88E4,
    TEXTURE0: 0x84C0,
    TEXTURE_2D: 0x0DE1,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TRIANGLES: 0x0004,
    UNPACK_ALIGNMENT: 0x0CF5,
    UNSIGNED_BYTE: 0x1401,
    UNSIGNED_INT: 0x1405,
    UNSIGNED_SHORT: 0x1403,
    VERTEX_SHADER: 0x8B31,
    activeTexture: noop,
    attachShader: noop,
    bindBuffer: noop,
    bindTexture: noop,
    blendFunc: noop,
    bufferData: noop,
    clear: noop,
    clearColor: noop,
    compileShader: noop,
    createBuffer: () => createHandle("buffer"),
    createProgram: () => createHandle("program"),
    createShader: () => createHandle("shader"),
    createTexture: () => createHandle("texture"),
    deleteProgram: noop,
    deleteShader: noop,
    disable: noop,
    drawElements: noop,
    enable: noop,
    enableVertexAttribArray: noop,
    getAttribLocation: (_, name) => {
      if (name === "aTexCoord") {
        return 1;
      }

      if (name === "aNormal") {
        return 2;
      }

      return 0;
    },
    getProgramInfoLog: () => "",
    getProgramParameter: () => true,
    getShaderInfoLog: () => "",
    getShaderParameter: () => true,
    getUniformLocation: (_, name) => ({ name }),
    linkProgram: noop,
    pixelStorei: noop,
    shaderSource: noop,
    texImage2D: noop,
    texParameteri: noop,
    uniform1f: noop,
    uniform1i: noop,
    uniform2fv: noop,
    uniform3fv: noop,
    uniform4fv: noop,
    uniformMatrix4fv: noop,
    useProgram: noop,
    vertexAttribPointer: noop,
    viewport: noop
  };
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "Falha ao compilar shader");
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || "Falha ao linkar programa");
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

export function createWorldRenderingResources(gl) {
  const program = createProgram(gl, SCENE_VERTEX_SOURCE, SCENE_FRAGMENT_SOURCE);
  const attribs = {
    position: gl.getAttribLocation(program, "aPosition"),
    texCoord: gl.getAttribLocation(program, "aTexCoord"),
    normal: gl.getAttribLocation(program, "aNormal")
  };
  const uniforms = {
    viewProjection: gl.getUniformLocation(program, "uViewProjection"),
    modelOffset: gl.getUniformLocation(program, "uModelOffset"),
    modelScale: gl.getUniformLocation(program, "uModelScale"),
    modelHeight: gl.getUniformLocation(program, "uModelHeight"),
    instanceOffset: gl.getUniformLocation(program, "uInstanceOffset"),
    instanceScale: gl.getUniformLocation(program, "uInstanceScale"),
    instanceYaw: gl.getUniformLocation(program, "uInstanceYaw"),
    instancePitch: gl.getUniformLocation(program, "uInstancePitch"),
    instanceRoll: gl.getUniformLocation(program, "uInstanceRoll"),
    localYaw: gl.getUniformLocation(program, "uLocalYaw"),
    localPivot: gl.getUniformLocation(program, "uLocalPivot"),
    swayStrength: gl.getUniformLocation(program, "uSwayStrength"),
    jitterAmount: gl.getUniformLocation(program, "uJitterAmount"),
    pixelSnap: gl.getUniformLocation(program, "uPixelSnap"),
    time: gl.getUniformLocation(program, "uTime"),
    texture: gl.getUniformLocation(program, "uTexture"),
    brightness: gl.getUniformLocation(program, "uBrightness")
  };

  const spriteProgram = createProgram(gl, SPRITE_VERTEX_SOURCE, SPRITE_FRAGMENT_SOURCE);
  const spriteAttribs = {
    corner: gl.getAttribLocation(spriteProgram, "aCorner"),
    texCoord: gl.getAttribLocation(spriteProgram, "aTexCoord")
  };
  const spriteUniforms = {
    viewProjection: gl.getUniformLocation(spriteProgram, "uViewProjection"),
    worldPosition: gl.getUniformLocation(spriteProgram, "uWorldPosition"),
    spriteSize: gl.getUniformLocation(spriteProgram, "uSpriteSize"),
    quadRight: gl.getUniformLocation(spriteProgram, "uQuadRight"),
    quadUp: gl.getUniformLocation(spriteProgram, "uQuadUp"),
    uvRect: gl.getUniformLocation(spriteProgram, "uUvRect"),
    spriteRotation: gl.getUniformLocation(spriteProgram, "uSpriteRotation"),
    spriteAlpha: gl.getUniformLocation(spriteProgram, "uSpriteAlpha"),
    pixelSnap: gl.getUniformLocation(spriteProgram, "uPixelSnap"),
    spriteTexture: gl.getUniformLocation(spriteProgram, "uSpriteTexture")
  };

  const spriteQuadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spriteQuadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -0.5, 0.0, 0.0, 1.0,
      0.5, 0.0, 1.0, 1.0,
      -0.5, 1.0, 0.0, 0.0,
      0.5, 1.0, 1.0, 0.0
    ]),
    gl.STATIC_DRAW
  );

  const spriteQuadIndices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spriteQuadIndices);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([0, 1, 2, 2, 1, 3]),
    gl.STATIC_DRAW
  );

  const skyProgram = createProgram(gl, SKY_VERTEX_SOURCE, SKY_FRAGMENT_SOURCE);
  const skyAttribs = {
    position: gl.getAttribLocation(skyProgram, "aPosition")
  };
  const skyUniforms = {
    texture: gl.getUniformLocation(skyProgram, "uSkyTexture"),
    yaw: gl.getUniformLocation(skyProgram, "uSkyYaw"),
    pitch: gl.getUniformLocation(skyProgram, "uSkyPitch")
  };
  const skyQuadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyQuadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1
    ]),
    gl.STATIC_DRAW
  );

  const skyQuadIndices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyQuadIndices);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([0, 1, 2, 2, 1, 3]),
    gl.STATIC_DRAW
  );

  return {
    program,
    attribs,
    uniforms,
    spriteProgram,
    spriteAttribs,
    spriteUniforms,
    spriteQuadBuffer,
    spriteQuadIndices,
    skyProgram,
    skyAttribs,
    skyUniforms,
    skyQuadBuffer,
    skyQuadIndices
  };
}

export function loadImageAsset(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Nao foi possivel carregar ${url}`));
    image.src = url;
  });
}

function readAccessor(gltf, accessorIndex, binBuffer) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const typedArrayByComponent = {
    5121: Uint8Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
  };
  const componentCounts = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4
  };

  const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const length = accessor.count * componentCounts[accessor.type];
  const ArrayType = typedArrayByComponent[accessor.componentType];
  return new ArrayType(binBuffer, byteOffset, length);
}

function normalizeVector3(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;

  return [
    vector[0] / length,
    vector[1] / length,
    vector[2] / length
  ];
}

function createSequentialIndices(vertexCount) {
  const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
  const indices = new IndexArray(vertexCount);

  for (let index = 0; index < vertexCount; index += 1) {
    indices[index] = index;
  }

  return indices;
}

function buildFlatShadedInterleaved(positions, uvs, indices) {
  const vertexCount = indices.length;
  const interleaved = new Float32Array(vertexCount * 8);

  for (let triangleIndex = 0; triangleIndex < indices.length; triangleIndex += 3) {
    const sourceIndices = [
      indices[triangleIndex],
      indices[triangleIndex + 1],
      indices[triangleIndex + 2]
    ];
    const points = sourceIndices.map((sourceIndex) => [
      positions[sourceIndex * 3 + 0],
      positions[sourceIndex * 3 + 1],
      positions[sourceIndex * 3 + 2]
    ]);
    const edgeA = [
      points[1][0] - points[0][0],
      points[1][1] - points[0][1],
      points[1][2] - points[0][2]
    ];
    const edgeB = [
      points[2][0] - points[0][0],
      points[2][1] - points[0][1],
      points[2][2] - points[0][2]
    ];
    const normal = normalizeVector3([
      edgeA[1] * edgeB[2] - edgeA[2] * edgeB[1],
      edgeA[2] * edgeB[0] - edgeA[0] * edgeB[2],
      edgeA[0] * edgeB[1] - edgeA[1] * edgeB[0]
    ]);

    for (let vertexOffset = 0; vertexOffset < 3; vertexOffset += 1) {
      const sourceIndex = sourceIndices[vertexOffset];
      const targetIndex = triangleIndex + vertexOffset;
      const writeOffset = targetIndex * 8;

      interleaved[writeOffset + 0] = positions[sourceIndex * 3 + 0];
      interleaved[writeOffset + 1] = positions[sourceIndex * 3 + 1];
      interleaved[writeOffset + 2] = positions[sourceIndex * 3 + 2];
      interleaved[writeOffset + 3] = uvs[sourceIndex * 2 + 0] || 0;
      interleaved[writeOffset + 4] = uvs[sourceIndex * 2 + 1] || 0;
      interleaved[writeOffset + 5] = normal[0];
      interleaved[writeOffset + 6] = normal[1];
      interleaved[writeOffset + 7] = normal[2];
    }
  }

  return {
    interleaved,
    indices: createSequentialIndices(vertexCount)
  };
}

function createGLPrimitive(gl, interleaved, indices) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return {
    vertexBuffer,
    indexBuffer,
    indexCount: indices.length,
    indexType: indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
  };
}

function createTextureFromPicoData(gl, textureData) {
  const size = Math.round(Math.sqrt(textureData.pixels.length));
  const rgba = new Uint8Array(size * size * 4);
  const transparentIndex = textureData.transparent_color;

  for (let index = 0; index < textureData.pixels.length; index += 1) {
    const colorIndex = parseInt(textureData.pixels[index], 16);
    const color = textureData.colors[colorIndex];
    const offset = index * 4;

    rgba[offset + 0] = Math.round(color[0] * 255);
    rgba[offset + 1] = Math.round(color[1] * 255);
    rgba[offset + 2] = Math.round(color[2] * 255);
    rgba[offset + 3] = colorIndex === transparentIndex ? 0 : 255;
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    size,
    size,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    rgba
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return texture;
}

function createTextureFromImage(gl, image) {
  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}

function createTextureFromSource(gl, source, { filter = gl.NEAREST } = {}) {
  const texture = gl.createTexture();
  const textureFilter = filter || gl.NEAREST;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function createPlaceholderTokenCanvas({ glyph, color, ink }) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = color;
  context.fillRect(10, 10, 44, 44);

  context.fillStyle = "rgba(255, 255, 255, 0.14)";
  context.fillRect(14, 14, 36, 12);

  context.strokeStyle = "rgba(0, 0, 0, 0.25)";
  context.lineWidth = 4;
  context.strokeRect(10, 10, 44, 44);

  context.fillStyle = ink;
  context.font = "bold 28px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(glyph, canvas.width * 0.5, canvas.height * 0.58);

  return canvas;
}

function createGuideMonsterCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#fff3c4";
  context.beginPath();
  context.ellipse(66, 82, 28, 16, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#b26bff";
  context.beginPath();
  context.moveTo(28, 78);
  context.bezierCurveTo(18, 28, 48, 6, 68, 12);
  context.bezierCurveTo(86, 10, 104, 24, 102, 54);
  context.bezierCurveTo(110, 72, 102, 94, 82, 106);
  context.bezierCurveTo(64, 120, 42, 110, 34, 90);
  context.bezierCurveTo(24, 88, 20, 84, 28, 78);
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.32)";
  context.beginPath();
  context.ellipse(52, 36, 18, 10, -0.42, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#31224f";
  context.beginPath();
  context.arc(54, 58, 3.2, 0, Math.PI * 2);
  context.arc(74, 58, 3.2, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#7c3243";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(48, 74);
  context.quadraticCurveTo(65, 80, 84, 72);
  context.stroke();

  context.fillStyle = "#f6d254";
  context.beginPath();
  context.moveTo(44, 22);
  context.quadraticCurveTo(66, 6, 90, 22);
  context.lineTo(84, 30);
  context.quadraticCurveTo(66, 18, 50, 30);
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(63, 30, 108, 0.34)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(30, 86);
  context.quadraticCurveTo(18, 98, 26, 110);
  context.moveTo(98, 80);
  context.quadraticCurveTo(110, 96, 100, 112);
  context.stroke();

  return canvas;
}

function createOpeningShipCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(54, 42, 32, 0.32)";
  context.fillRect(27, 68, 44, 10);

  context.fillStyle = "#8d979b";
  context.fillRect(24, 26, 48, 34);
  context.fillStyle = "#657074";
  context.fillRect(24, 60, 48, 12);
  context.fillStyle = "#b9c8c8";
  context.fillRect(30, 20, 36, 12);
  context.fillStyle = "#f06c57";
  context.fillRect(30, 38, 18, 14);
  context.fillStyle = "#6ec7f5";
  context.fillRect(52, 34, 14, 12);

  context.fillStyle = "#41494d";
  context.fillRect(18, 48, 10, 18);
  context.fillRect(68, 48, 10, 18);
  context.fillStyle = "#e0e2d4";
  context.fillRect(38, 26, 20, 6);
  context.fillStyle = "rgba(255, 255, 255, 0.28)";
  context.fillRect(29, 28, 36, 6);

  context.strokeStyle = "#2d2626";
  context.lineWidth = 4;
  context.strokeRect(24, 26, 48, 46);

  return canvas;
}

function createSquirtlePlaceholderCanvas({ recovered = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = recovered ? "rgba(120, 227, 255, 0.26)" : "rgba(255, 214, 120, 0.16)";
  context.beginPath();
  context.ellipse(64, 104, 28, 12, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#9c6c48";
  context.beginPath();
  context.ellipse(64, 70, 26, 32, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#c8b38a";
  context.beginPath();
  context.ellipse(64, 72, 16, 22, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = recovered ? "#88deff" : "#75c6ee";
  context.beginPath();
  context.ellipse(64, 64, 22, 20, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = recovered ? "#9be7ff" : "rgba(255, 255, 255, 0.24)";
  context.beginPath();
  context.ellipse(56, 56, 8, 5, -0.5, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#2a4054";
  context.beginPath();
  context.arc(57, 63, 2.5, 0, Math.PI * 2);
  context.arc(71, 63, 2.5, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = recovered ? "#3d6e90" : "#5f6c77";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(56, 76);
  context.quadraticCurveTo(64, recovered ? 82 : 78, 72, 76);
  context.stroke();

  context.strokeStyle = "#75c6ee";
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(46, 82);
  context.lineTo(40, 96);
  context.moveTo(82, 82);
  context.lineTo(88, 96);
  context.moveTo(52, 44);
  context.lineTo(42, 30);
  context.moveTo(76, 44);
  context.lineTo(88, 30);
  context.stroke();

  context.strokeStyle = recovered ? "rgba(72, 194, 255, 0.9)" : "rgba(109, 193, 255, 0.42)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(92, 48);
  context.bezierCurveTo(112, 38, 114, 60, 102, 74);
  context.stroke();

  if (!recovered) {
    context.strokeStyle = "rgba(255, 245, 213, 0.86)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(28, 30);
    context.lineTo(38, 24);
    context.moveTo(26, 42);
    context.lineTo(38, 40);
    context.moveTo(30, 52);
    context.lineTo(40, 56);
    context.stroke();
  }

  return canvas;
}

function createBulbasaurPlaceholderCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(134, 230, 110, 0.22)";
  context.beginPath();
  context.ellipse(64, 102, 26, 10, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#6fd279";
  context.beginPath();
  context.ellipse(64, 68, 26, 20, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#4fb861";
  context.beginPath();
  context.ellipse(50, 74, 12, 16, -0.42, 0, Math.PI * 2);
  context.ellipse(78, 74, 12, 16, 0.42, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#2b6b34";
  context.beginPath();
  context.arc(54, 64, 3, 0, Math.PI * 2);
  context.arc(74, 64, 3, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#2b6b34";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(54, 78);
  context.quadraticCurveTo(64, 84, 74, 78);
  context.stroke();

  context.fillStyle = "#4cbf5a";
  context.beginPath();
  context.moveTo(64, 34);
  context.bezierCurveTo(48, 16, 30, 24, 24, 44);
  context.bezierCurveTo(42, 48, 56, 46, 64, 38);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(64, 34);
  context.bezierCurveTo(82, 14, 102, 24, 106, 46);
  context.bezierCurveTo(88, 48, 74, 46, 64, 38);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.22)";
  context.beginPath();
  context.ellipse(56, 54, 10, 5, -0.48, 0, Math.PI * 2);
  context.fill();

  return canvas;
}

function createCharmanderPlaceholderCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(244, 119, 54, 0.22)";
  context.beginPath();
  context.ellipse(64, 104, 28, 10, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#d76635";
  context.lineWidth = 11;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(82, 82);
  context.bezierCurveTo(108, 72, 98, 42, 112, 34);
  context.stroke();

  context.fillStyle = "#ef6a32";
  context.beginPath();
  context.ellipse(112, 31, 11, 16, 0.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffd95a";
  context.beginPath();
  context.ellipse(112, 34, 6, 9, 0.2, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ef8a45";
  context.beginPath();
  context.ellipse(64, 76, 24, 30, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffd79b";
  context.beginPath();
  context.ellipse(64, 82, 13, 18, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f59a50";
  context.beginPath();
  context.ellipse(64, 56, 24, 21, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(255, 237, 193, 0.5)";
  context.beginPath();
  context.ellipse(55, 48, 8, 5, -0.4, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#2b2521";
  context.beginPath();
  context.arc(56, 56, 2.6, 0, Math.PI * 2);
  context.arc(72, 56, 2.6, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#8b3b23";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(56, 69);
  context.quadraticCurveTo(64, 75, 72, 69);
  context.stroke();

  context.strokeStyle = "#dc6d35";
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(48, 92);
  context.lineTo(42, 104);
  context.moveTo(80, 92);
  context.lineTo(88, 104);
  context.stroke();

  return canvas;
}

function createRepairPlantUnitCanvas({ fixed = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = fixed ? "rgba(162, 255, 170, 0.26)" : "rgba(255, 212, 124, 0.18)";
  context.beginPath();
  context.ellipse(82, 132, 46, 16, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = fixed ? "#4d7d5a" : "#7a715f";
  context.fillRect(40, 96, 84, 18);

  context.fillStyle = fixed ? "#8ae39a" : "#9fa4a8";
  context.beginPath();
  context.moveTo(62, 96);
  context.lineTo(80, 52);
  context.lineTo(98, 96);
  context.closePath();
  context.fill();

  context.fillStyle = fixed ? "#66c57e" : "#69727c";
  context.beginPath();
  context.moveTo(80, 54);
  context.bezierCurveTo(56, 44, 42, 58, 40, 76);
  context.bezierCurveTo(58, 82, 72, 78, 80, 62);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(82, 60);
  context.bezierCurveTo(106, 42, 126, 54, 132, 76);
  context.bezierCurveTo(112, 84, 94, 82, 84, 68);
  context.closePath();
  context.fill();

  context.fillStyle = fixed ? "#c2f07c" : "#d06c58";
  context.beginPath();
  context.arc(80, 82, 11, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = fixed ? "#cffff4" : "#513f39";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(54, 108);
  context.lineTo(54, 130);
  context.moveTo(108, 108);
  context.lineTo(108, 130);
  context.stroke();

  context.strokeStyle = fixed ? "#7de0ff" : "#bd7b42";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(30, 106);
  context.lineTo(54, 98);
  context.moveTo(124, 98);
  context.lineTo(142, 84);
  context.stroke();

  if (fixed) {
    context.fillStyle = "rgba(219, 255, 215, 0.72)";
    context.beginPath();
    context.arc(44, 48, 8, 0, Math.PI * 2);
    context.arc(118, 40, 6, 0, Math.PI * 2);
    context.fill();
  } else {
    context.strokeStyle = "#5c4336";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(66, 74);
    context.lineTo(92, 90);
    context.moveTo(92, 74);
    context.lineTo(66, 90);
    context.stroke();
  }

  return canvas;
}

function createGroundGrassCanvas({ revived = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = revived ? "rgba(103, 215, 126, 0.20)" : "rgba(186, 118, 78, 0.14)";
  context.beginPath();
  context.ellipse(48, 72, 24, 8, 0, 0, Math.PI * 2);
  context.fill();

  const bladeColors = revived ?
    ["#84ef7d", "#49c55f", "#2e8b57"] :
    ["#b98c58", "#8c6442", "#5e4537"];
  const bladeAnchors = [
    { x: 24, y: 62, bend: -10, tipX: 20, tipY: 28 },
    { x: 34, y: 64, bend: -6, tipX: 30, tipY: 20 },
    { x: 46, y: 66, bend: -2, tipX: 44, tipY: 16 },
    { x: 58, y: 64, bend: 6, tipX: 62, tipY: 18 },
    { x: 70, y: 62, bend: 10, tipX: 76, tipY: 28 }
  ];

  bladeAnchors.forEach((blade, index) => {
    context.strokeStyle = bladeColors[index % bladeColors.length];
    context.lineWidth = revived ? 7 : 6;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(blade.x, blade.y);
    context.quadraticCurveTo(blade.x + blade.bend, 42, blade.tipX, blade.tipY);
    context.stroke();
  });

  context.strokeStyle = revived ? "rgba(223, 255, 207, 0.74)" : "rgba(245, 223, 177, 0.24)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(33, 41);
  context.lineTo(31, 27);
  context.moveTo(47, 34);
  context.lineTo(47, 19);
  context.moveTo(61, 39);
  context.lineTo(64, 24);
  context.stroke();

  return canvas;
}

function createGroundFlowerCanvas({ revived = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = revived ? "rgba(255, 220, 128, 0.16)" : "rgba(110, 74, 56, 0.12)";
  context.beginPath();
  context.ellipse(48, 72, 20, 7, 0, 0, Math.PI * 2);
  context.fill();

  const stems = [
    { x: 30, tipX: 28, tipY: 42 },
    { x: 44, tipX: 44, tipY: 34 },
    { x: 58, tipX: 61, tipY: 40 }
  ];

  context.strokeStyle = revived ? "#67b55e" : "#6b594d";
  context.lineWidth = 4;
  context.lineCap = "round";
  for (const stem of stems) {
    context.beginPath();
    context.moveTo(stem.x, 69);
    context.quadraticCurveTo(stem.x - 1, 52, stem.tipX, stem.tipY);
    context.stroke();
  }

  const petalColor = revived ? "#ffb8d3" : "#8c756a";
  const coreColor = revived ? "#ffe37e" : "#6d5d52";
  const blooms = [
    { x: 28, y: 40, scale: 0.92 },
    { x: 44, y: 32, scale: 1 },
    { x: 62, y: 38, scale: 0.9 }
  ];

  for (const bloom of blooms) {
    const radius = 7 * bloom.scale;
    context.fillStyle = petalColor;
    for (let index = 0; index < 5; index += 1) {
      const angle = (Math.PI * 2 * index) / 5;
      context.beginPath();
      context.ellipse(
        bloom.x + Math.cos(angle) * radius * 0.8,
        bloom.y + Math.sin(angle) * radius * 0.8,
        radius * 0.55,
        radius * 0.75,
        angle,
        0,
        Math.PI * 2
      );
      context.fill();
    }

    context.fillStyle = coreColor;
    context.beginPath();
    context.arc(bloom.x, bloom.y, radius * 0.36, 0, Math.PI * 2);
    context.fill();
  }

  return canvas;
}

export function createWorldTextureFactory(gl) {
  return {
    LINEAR: gl.LINEAR,

    fromCanvas(canvas) {
      return createTextureFromSource(gl, canvas);
    },

    fromImage(image, options) {
      return createTextureFromSource(gl, image, options);
    },

    buildMarkerTextureMap(itemDefs, worldMarkerStyles) {
      const textures = {};

      for (const definition of Object.values(itemDefs)) {
        textures[definition.id] = createTextureFromSource(
          gl,
          createPlaceholderTokenCanvas(definition)
        );
      }

      for (const [key, definition] of Object.entries(worldMarkerStyles)) {
        textures[key] = createTextureFromSource(
          gl,
          createPlaceholderTokenCanvas(definition)
        );
      }

      return textures;
    },

    createGuideMonsterTexture() {
      return createTextureFromSource(gl, createGuideMonsterCanvas());
    },

    createOpeningShipTexture() {
      return createTextureFromSource(gl, createOpeningShipCanvas());
    },

    createSquirtleTexture(options) {
      return createTextureFromSource(gl, createSquirtlePlaceholderCanvas(options));
    },

    createBulbasaurTexture() {
      return createTextureFromSource(gl, createBulbasaurPlaceholderCanvas());
    },

    createCharmanderTexture() {
      return createTextureFromSource(gl, createCharmanderPlaceholderCanvas());
    },

    createRepairPlantTexture(options) {
      return createTextureFromSource(gl, createRepairPlantUnitCanvas(options));
    },

    createGroundGrassTexture(options) {
      return createTextureFromSource(gl, createGroundGrassCanvas(options));
    },

    createGroundFlowerTexture(options) {
      return createTextureFromSource(gl, createGroundFlowerCanvas(options));
    }
  };
}

function computeModelBounds(primitives) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (const primitive of primitives) {
    const data = primitive.positions;
    for (let index = 0; index < data.length; index += 3) {
      min[0] = Math.min(min[0], data[index + 0]);
      min[1] = Math.min(min[1], data[index + 1]);
      min[2] = Math.min(min[2], data[index + 2]);
      max[0] = Math.max(max[0], data[index + 0]);
      max[1] = Math.max(max[1], data[index + 1]);
      max[2] = Math.max(max[2], data[index + 2]);
    }
  }

  return { min, max };
}

function resolveModelAssetPath(basePath, uri) {
  if (!uri) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(uri) || uri.startsWith("/")) {
    return uri;
  }

  return `${basePath}${uri}`;
}

export async function loadPicoModel({
  gl,
  gltfPath,
  txtPath,
  onStatus
}) {
  onStatus?.(`Carregando ${gltfPath}...`);

  const [gltf, picoData] = await Promise.all([
    fetch(gltfPath).then((response) => {
      if (!response.ok) {
        throw new Error(`Nao foi possivel carregar ${gltfPath}`);
      }
      return response.json();
    }),
    fetch(txtPath).then((response) => {
      if (!response.ok) {
        throw new Error(`Nao foi possivel carregar ${txtPath}`);
      }
      return response.json();
    })
  ]);

  const basePath = gltfPath.includes("/") ?
    gltfPath.slice(0, gltfPath.lastIndexOf("/") + 1) :
    "./";
  const resolvedTexturePath = gltf.images?.[gltf.textures?.[0]?.source || 0]?.uri ?
    resolveModelAssetPath(
      basePath,
      gltf.images[gltf.textures?.[0]?.source || 0].uri
    ) :
    null;
  const [binBuffer, textureImage] = await Promise.all([
    fetch(`${basePath}${gltf.buffers[0].uri}`).then((response) => {
      if (!response.ok) {
        throw new Error(`Nao foi possivel carregar ${gltf.buffers[0].uri}`);
      }
      return response.arrayBuffer();
    }),
    resolvedTexturePath ?
      loadImageAsset(resolvedTexturePath).catch(() => null) :
      Promise.resolve(null)
  ]);

  const primitives = [];
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      const positions = readAccessor(gltf, primitive.attributes.POSITION, binBuffer);
      const texcoords = readAccessor(gltf, primitive.attributes.TEXCOORD_0, binBuffer);
      const indices = readAccessor(gltf, primitive.indices, binBuffer);
      const flatMesh = buildFlatShadedInterleaved(positions, texcoords, indices);
      primitives.push({
        ...createGLPrimitive(gl, flatMesh.interleaved, flatMesh.indices),
        positions
      });
    }
  }

  const bounds = computeModelBounds(primitives);
  const center = [
    (bounds.min[0] + bounds.max[0]) * 0.5,
    (bounds.min[1] + bounds.max[1]) * 0.5,
    (bounds.min[2] + bounds.max[2]) * 0.5
  ];
  const size = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2]
  ];
  const scale = 3.8 / Math.max(size[0], size[1], size[2]);

  return {
    primitives,
    texture: textureImage ?
      createTextureFromImage(gl, textureImage) :
      createTextureFromPicoData(gl, picoData.texture),
    offset: [
      -center[0] * scale,
      -bounds.min[1] * scale,
      -center[2] * scale
    ],
    scale,
    size: [
      size[0] * scale,
      size[1] * scale,
      size[2] * scale
    ]
  };
}

export async function loadTexturedModel({
  gl,
  gltfPath,
  binPath = null,
  texturePath = null,
  normalizedSize = 3.8,
  onStatus
}) {
  onStatus?.(`Carregando ${gltfPath}...`);

  const gltf = await fetch(gltfPath).then((response) => {
    if (!response.ok) {
      throw new Error(`Nao foi possivel carregar ${gltfPath}`);
    }
    return response.json();
  });

  const basePath = gltfPath.includes("/") ?
    gltfPath.slice(0, gltfPath.lastIndexOf("/") + 1) :
    "./";
  const resolvedBinPath = binPath ||
    resolveModelAssetPath(basePath, gltf.buffers[0].uri);
  const resolvedTexturePath = texturePath ||
    resolveModelAssetPath(
      basePath,
      gltf.images?.[gltf.textures?.[0]?.source || 0]?.uri
    );

  const [binBuffer, textureImage] = await Promise.all([
    fetch(resolvedBinPath).then((response) => {
      if (!response.ok) {
        throw new Error(`Nao foi possivel carregar ${resolvedBinPath}`);
      }
      return response.arrayBuffer();
    }),
    loadImageAsset(resolvedTexturePath)
  ]);

  const primitives = [];
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      const positions = readAccessor(gltf, primitive.attributes.POSITION, binBuffer);
      const texcoords = readAccessor(gltf, primitive.attributes.TEXCOORD_0, binBuffer);
      const indices = readAccessor(gltf, primitive.indices, binBuffer);
      const flatMesh = buildFlatShadedInterleaved(positions, texcoords, indices);
      primitives.push({
        ...createGLPrimitive(gl, flatMesh.interleaved, flatMesh.indices),
        positions
      });
    }
  }

  const bounds = computeModelBounds(primitives);
  const center = [
    (bounds.min[0] + bounds.max[0]) * 0.5,
    (bounds.min[1] + bounds.max[1]) * 0.5,
    (bounds.min[2] + bounds.max[2]) * 0.5
  ];
  const size = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2]
  ];
  const scale = normalizedSize / Math.max(size[0], size[1], size[2]);

  return {
    primitives,
    texture: createTextureFromImage(gl, textureImage),
    offset: [
      -center[0] * scale,
      -bounds.min[1] * scale,
      -center[2] * scale
    ],
    scale,
    size: [
      size[0] * scale,
      size[1] * scale,
      size[2] * scale
    ]
  };
}
