import { shouldDrawSceneInstance } from "./renderCulling.js";
import { WORLD_LIMIT } from "../gameplayContent.js";
import {
  createWrappedWorldTopology,
  WORLD_WRAP_AXIS_X,
  WORLD_WRAP_AXIS_Z
} from "../world/worldTopology.js";
import {
  WORLD_CURVATURE_CONFIG,
  resolveWorldCurvatureOrigin
} from "./worldCurvature.js";

export function createWorldRenderer({
  gl,
  worldCanvas,
  camera,
  program,
  uniforms,
  attribs,
  spriteProgram,
  spriteUniforms,
  spriteAttribs,
  spriteQuadBuffer,
  spriteQuadIndices,
  skyProgram,
  skyUniforms,
  skyAttribs,
  skyQuadBuffer,
  skyQuadIndices,
  jitterState
}) {
  const pixelSnap = new Float32Array(2);
  const GROUND_HIGHLIGHT_ELEVATION = 0.065;
  const GROUND_HIGHLIGHT_TEXTURE_SIZE = 32;
  const GROUND_HIGHLIGHT_SELECTED_SCALE = 1.05;
  const GROUND_HIGHLIGHT_MARKED_SCALE = 0.98;
  const GROUND_HIGHLIGHT_ACTION_PULSE_SCALE = 1.12;
  const GROUND_HIGHLIGHT_ACTION_PULSE_SCALE_RANGE = 0.46;
  const SPRITE_DRAW_DISTANCE_FROM_CAMERA_TARGET = 72;
  const RESOURCE_MARKER_DRAW_DISTANCE_FROM_CAMERA_TARGET = 34;
  const WORLD_MARKER_DRAW_DISTANCE_FROM_CAMERA_TARGET = 46;
  const worldCurvatureOrigin = new Float32Array(3);
  const worldRenderTopology = createWrappedWorldTopology({
    id: "small-island-render-wrap",
    limit: WORLD_LIMIT,
    axes: [WORLD_WRAP_AXIS_X, WORLD_WRAP_AXIS_Z]
  });
  const renderInstanceOffset = new Float32Array(3);
  const spriteRenderPosition = new Float32Array(3);
  const wrappedCullingOptions = {
    getPlanarDistanceSquared: worldRenderTopology.getPlanarDistanceSquared
  };
  let spritePassCameraTarget = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createGroundQuadPrimitive() {
    const interleaved = new Float32Array([
      -0.5, 0, -0.5, 0, 0, 0, 1, 0,
      0.5, 0, -0.5, 1, 0, 0, 1, 0,
      -0.5, 0, 0.5, 0, 1, 0, 1, 0,
      0.5, 0, 0.5, 1, 1, 0, 1, 0
    ]);
    const indices = new Uint16Array([0, 2, 1, 1, 2, 3]);
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
      indexType: gl.UNSIGNED_SHORT
    };
  }

  function createGroundHighlightTexture({ fill, border, outerBorder }) {
    const size = GROUND_HIGHLIGHT_TEXTURE_SIZE;
    const pixels = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const edgeDistance = Math.min(x, y, size - 1 - x, size - 1 - y);
        const color = edgeDistance < 2 ? outerBorder : edgeDistance < 4 ? border : fill;
        const offset = (y * size + x) * 4;
        pixels[offset + 0] = color[0];
        pixels[offset + 1] = color[1];
        pixels[offset + 2] = color[2];
        pixels[offset + 3] = color[3];
      }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei?.(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      size,
      size,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }

  const groundHighlightPrimitive = createGroundQuadPrimitive();
  const groundHighlightModel = {
    offset: [0, 0, 0],
    scale: 1,
    size: [1, 0.01, 1],
    texture: null,
    primitives: [groundHighlightPrimitive]
  };
  const selectedWaterGroundHighlightTexture = createGroundHighlightTexture({
    fill: [124, 231, 255, 28],
    border: [158, 248, 255, 220],
    outerBorder: [7, 23, 36, 210]
  });
  const selectedLeafGroundHighlightTexture = createGroundHighlightTexture({
    fill: [91, 238, 132, 34],
    border: [126, 255, 165, 228],
    outerBorder: [8, 40, 20, 212]
  });
  const selectedFireGroundHighlightTexture = createGroundHighlightTexture({
    fill: [255, 88, 54, 40],
    border: [255, 90, 54, 232],
    outerBorder: [60, 8, 0, 218]
  });
  const selectedInvalidGroundHighlightTexture = createGroundHighlightTexture({
    fill: [255, 143, 47, 56],
    border: [255, 211, 122, 232],
    outerBorder: [84, 48, 0, 220]
  });
  const markedGroundHighlightTexture = createGroundHighlightTexture({
    fill: [255, 212, 71, 72],
    border: [255, 240, 161, 230],
    outerBorder: [80, 52, 0, 198]
  });

  function syncPixelSnap() {
    pixelSnap[0] = worldCanvas.width * 0.5;
    pixelSnap[1] = worldCanvas.height * 0.5;
  }

  function clearScenePass() {
    gl.viewport(0, 0, worldCanvas.width, worldCanvas.height);
    gl.clearColor(0.5294, 0.8078, 0.9216, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  function configureScenePass(viewProjection) {
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection);
    gl.uniform1f(uniforms.jitterAmount, jitterState.amount);
    syncWorldCurvatureUniforms(uniforms);
    syncPixelSnap();
    gl.uniform2fv(uniforms.pixelSnap, pixelSnap);
    gl.uniform1f(uniforms.time, performance.now() * 0.001);
    gl.uniform1i(uniforms.texture, 0);
  }

  function syncWorldCurvatureUniforms(targetUniforms) {
    const cameraTarget = camera.getPose?.()?.target || [0, 0, 0];
    const origin = resolveWorldCurvatureOrigin(cameraTarget);
    worldCurvatureOrigin[0] = origin[0];
    worldCurvatureOrigin[1] = origin[1];
    worldCurvatureOrigin[2] = origin[2];

    gl.uniform3fv(targetUniforms.worldCurvatureOrigin, worldCurvatureOrigin);
    gl.uniform1f(
      targetUniforms.worldCurvatureStrength,
      WORLD_CURVATURE_CONFIG.enabled ? WORLD_CURVATURE_CONFIG.strength : 0
    );
    gl.uniform1f(targetUniforms.worldCurvatureMaxDrop, WORLD_CURVATURE_CONFIG.maxDrop);
  }

  function getSkyOrientation() {
    const pose = camera.getPose?.();
    const direction = pose?.direction || [1, 0, 0];
    const lookDirection = [
      -(direction[0] || 0),
      -(direction[1] || 0),
      -(direction[2] || 0)
    ];
    const lookLength = Math.hypot(
      lookDirection[0],
      lookDirection[1],
      lookDirection[2]
    ) || 1;
    const normalizedLook = [
      lookDirection[0] / lookLength,
      lookDirection[1] / lookLength,
      lookDirection[2] / lookLength
    ];

    return {
      yaw: Math.atan2(normalizedLook[0], normalizedLook[2]),
      pitch: Math.asin(clamp(normalizedLook[1], -1, 1))
    };
  }

  function drawSky(skyTexture) {
    if (!skyTexture || !skyProgram || !skyQuadBuffer || !skyQuadIndices) {
      return;
    }

    const { yaw, pitch } = getSkyOrientation();

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.useProgram(skyProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyTexture);
    gl.uniform1i(skyUniforms.texture, 0);
    gl.uniform1f(skyUniforms.yaw, yaw);
    gl.uniform1f(skyUniforms.pitch, pitch);

    gl.bindBuffer(gl.ARRAY_BUFFER, skyQuadBuffer);
    gl.enableVertexAttribArray(skyAttribs.position);
    gl.vertexAttribPointer(skyAttribs.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyQuadIndices);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  function bindScenePrimitive(primitive) {
    gl.bindBuffer(gl.ARRAY_BUFFER, primitive.vertexBuffer);
    gl.enableVertexAttribArray(attribs.position);
    gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(attribs.texCoord);
    gl.vertexAttribPointer(attribs.texCoord, 2, gl.FLOAT, false, 32, 12);
    if (attribs.normal >= 0) {
      gl.enableVertexAttribArray(attribs.normal);
      gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 32, 20);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBuffer);
  }

  function drawSceneObject(sceneObject, cameraTarget = null) {
    gl.uniform3fv(uniforms.modelOffset, sceneObject.model.offset);
    gl.uniform1f(uniforms.modelScale, sceneObject.model.scale);
    gl.uniform1f(uniforms.modelHeight, sceneObject.model.size[1]);
    gl.uniform1f(uniforms.brightness, sceneObject.brightness ?? 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneObject.model.texture);

    for (const instance of sceneObject.instances) {
      if (instance.active === false) {
        continue;
      }

      if (!shouldDrawSceneInstance(instance, sceneObject, cameraTarget, wrappedCullingOptions)) {
        continue;
      }

      const instanceOffset = worldRenderTopology.getRenderPosition(
        instance.offset,
        cameraTarget,
        renderInstanceOffset
      );
      gl.uniform3fv(uniforms.instanceOffset, instanceOffset);
      gl.uniform1f(uniforms.instanceScale, instance.scale);
      gl.uniform1f(uniforms.instanceYaw, instance.yaw || 0);
      gl.uniform1f(uniforms.instancePitch, instance.pitch || 0);
      gl.uniform1f(uniforms.instanceRoll, instance.roll || 0);
      gl.uniform3fv(uniforms.instanceTint, instance.tint || [1, 1, 1]);
      gl.uniform1f(uniforms.instanceTintStrength, instance.tintStrength || 0);
      const instanceAlpha = instance.alpha ?? 1;
      const isTransparentInstance = instanceAlpha < 0.999;
      gl.uniform1f(uniforms.instanceAlpha, instanceAlpha);
      if (uniforms.localYaw) {
        gl.uniform1f(uniforms.localYaw, instance.localYaw || 0);
      }

      if (uniforms.localPivot) {
        gl.uniform3fv(uniforms.localPivot, instance.localPivot || [0, 0, 0]);
      }
      gl.uniform1f(uniforms.swayStrength, instance.swayStrength || 0);

      if (isTransparentInstance) {
        gl.depthMask?.(false);
      }

      for (const primitive of sceneObject.model.primitives) {
        bindScenePrimitive(primitive);
        gl.drawElements(gl.TRIANGLES, primitive.indexCount, primitive.indexType, 0);
      }

      if (isTransparentInstance) {
        gl.depthMask?.(true);
      }
    }
  }

  function createGroundHighlightInstance(groundCell, scaleMultiplier) {
    if (!Array.isArray(groundCell?.offset)) {
      return null;
    }

    const tileSpan = groundCell.tileSpan || groundCell.size?.[0] || 1;
    const surfaceY = Number.isFinite(groundCell.surfaceY) ? groundCell.surfaceY : 0;

    return {
      offset: [
        groundCell.offset[0],
        surfaceY + GROUND_HIGHLIGHT_ELEVATION,
        groundCell.offset[2]
      ],
      scale: tileSpan * scaleMultiplier,
      yaw: 0,
      pitch: 0,
      roll: 0
    };
  }

  function drawGroundHighlightCells(texture, groundCells, scaleMultiplier) {
    const instances = groundCells
      .map((groundCell) => createGroundHighlightInstance(groundCell, scaleMultiplier))
      .filter(Boolean);

    if (!instances.length) {
      return;
    }

    drawSceneObject({
      brightness: 1,
      model: {
        ...groundHighlightModel,
        texture
      },
      instances
    }, camera.getPose?.()?.target || null);
  }

  function getSelectedGroundHighlightTexture(groundCell) {
    if (groundCell?.highlightAbilityId === "leafage") {
      return selectedLeafGroundHighlightTexture;
    }

    if (groundCell?.highlightAbilityId === "fire") {
      return selectedFireGroundHighlightTexture;
    }

    if (groundCell?.highlightAbilityId === "invalid") {
      return selectedInvalidGroundHighlightTexture;
    }

    return selectedWaterGroundHighlightTexture;
  }

  function prepareSpritePass(viewProjection) {
    const { right: quadRight, up: quadUp } = camera.getBillboardAxes();
    spritePassCameraTarget = camera.getPose?.()?.target || null;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(spriteProgram);
    gl.uniformMatrix4fv(spriteUniforms.viewProjection, false, viewProjection);
    syncWorldCurvatureUniforms(spriteUniforms);
    syncPixelSnap();
    gl.uniform2fv(spriteUniforms.pixelSnap, pixelSnap);
    gl.uniform3fv(spriteUniforms.quadRight, quadRight);
    gl.uniform3fv(spriteUniforms.quadUp, quadUp);
    gl.uniform1i(spriteUniforms.spriteTexture, 0);
    gl.uniform1f(spriteUniforms.spriteRotation, 0);
    gl.uniform1f(spriteUniforms.spriteAlpha, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, spriteQuadBuffer);
    gl.enableVertexAttribArray(spriteAttribs.corner);
    gl.vertexAttribPointer(spriteAttribs.corner, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(spriteAttribs.texCoord);
    gl.vertexAttribPointer(spriteAttribs.texCoord, 2, gl.FLOAT, false, 16, 8);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spriteQuadIndices);
  }

  function getSpriteCullingTarget() {
    return camera.getPose?.()?.target || spritePassCameraTarget;
  }

  function shouldDrawWorldSprite(position, drawDistance = SPRITE_DRAW_DISTANCE_FROM_CAMERA_TARGET) {
    const cameraTarget = getSpriteCullingTarget();

    if (!(drawDistance > 0) || !Array.isArray(cameraTarget) || !Array.isArray(position)) {
      return true;
    }

    return worldRenderTopology.getPlanarDistanceSquared(
      position,
      cameraTarget
    ) <= drawDistance * drawDistance;
  }

  function drawSpriteQuad(texture, position, size, uvRect, { alpha = 1, rotation = 0 } = {}) {
    if (!shouldDrawWorldSprite(position)) {
      return false;
    }

    const renderPosition = worldRenderTopology.getRenderPosition(
      position,
      spritePassCameraTarget,
      spriteRenderPosition
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform3fv(spriteUniforms.worldPosition, renderPosition);
    gl.uniform2fv(spriteUniforms.spriteSize, size);
    gl.uniform4fv(spriteUniforms.uvRect, uvRect);
    gl.uniform1f(spriteUniforms.spriteRotation, rotation || 0);
    gl.uniform1f(spriteUniforms.spriteAlpha, alpha ?? 1);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    return true;
  }

  function drawSpriteBillboards(viewProjection, billboards) {
    if (!Array.isArray(billboards) || billboards.length === 0) {
      return;
    }

    prepareSpritePass(viewProjection);

    for (const billboard of billboards) {
      if (!billboard?.texture || !billboard?.position || !billboard?.size) {
        continue;
      }

      drawSpriteQuad(
        billboard.texture,
        billboard.position,
        billboard.size,
        billboard.uvRect || [0, 0, 1, 1],
        {
          alpha: billboard.alpha ?? billboard.opacity ?? 1,
          rotation: billboard.rotation || 0
        }
      );
    }
  }

  return {
    drawScene(viewProjection, sceneObjects, skyTexture = null) {
      clearScenePass();
      drawSky(skyTexture);

      if (!sceneObjects.length) {
        return;
      }
      configureScenePass(viewProjection);
      const cameraTarget = camera.getPose?.()?.target || null;

      for (const sceneObject of sceneObjects) {
        drawSceneObject(sceneObject, cameraTarget);
      }
    },

    drawGroundCellHighlight(viewProjection, {
      visible = false,
      groundCell = null,
      markedGroundCells = [],
      actionPulseGroundCell = null,
      actionPulsePhase = 0,
      actionPulseAbilityId = null
    } = {}) {
      const markedCells = (markedGroundCells || []).filter(Boolean);
      const selectedCells = visible && groundCell ? [groundCell] : [];
      const actionPulseCell = actionPulseGroundCell ?
        {
          ...actionPulseGroundCell,
          highlightAbilityId: actionPulseAbilityId || actionPulseGroundCell.highlightAbilityId
        } :
        null;
      const actionPulseCells = actionPulseCell ? [actionPulseCell] : [];

      if (!viewProjection || (!markedCells.length && !selectedCells.length && !actionPulseCells.length)) {
        return;
      }

      configureScenePass(viewProjection);
      gl.uniform1f(uniforms.jitterAmount, 0);
      gl.depthMask?.(false);
      drawGroundHighlightCells(
        markedGroundHighlightTexture,
        markedCells,
        GROUND_HIGHLIGHT_MARKED_SCALE
      );
      drawGroundHighlightCells(
        getSelectedGroundHighlightTexture(actionPulseCell),
        actionPulseCells,
        GROUND_HIGHLIGHT_ACTION_PULSE_SCALE +
          Math.max(0, Math.min(1, actionPulsePhase)) * GROUND_HIGHLIGHT_ACTION_PULSE_SCALE_RANGE
      );
      drawGroundHighlightCells(
        getSelectedGroundHighlightTexture(groundCell),
        selectedCells,
        GROUND_HIGHLIGHT_SELECTED_SCALE
      );
      gl.depthMask?.(true);
    },

    drawWoodDrops(viewProjection, woodTexture, woodDrops) {
      if (!woodTexture || !woodDrops.some((woodDrop) => !woodDrop.collected)) {
        return;
      }

      prepareSpritePass(viewProjection);

      for (const woodDrop of woodDrops) {
        if (woodDrop.collected) {
          continue;
        }

        drawSpriteQuad(woodTexture, woodDrop.position, woodDrop.size, woodDrop.uvRect);
      }
    },

    drawWorldMarkers(viewProjection, {
      storyState,
      resourceNodes,
      npcActors,
      interactables,
      markerTextures,
      worldMarkerHeight,
      worldMarkerSize,
      npcMarkerOffset,
      npcMarkerSize,
      fullUvRect,
      attentionTargetIds = [],
      isNpcActive,
      isInteractableActive,
      isResourceNodeActive
    }) {
      const markers = [];
      const attentionTargets = new Set(attentionTargetIds);
      const markerTime = performance.now() * 0.001;

      for (const npcActor of npcActors) {
        if (!isNpcActive(npcActor, storyState)) {
          continue;
        }

        const texture = markerTextures[npcActor.markerKey];
        if (!texture) {
          continue;
        }

        const position = npcActor.character.getPosition();
        if (!shouldDrawWorldSprite(position, WORLD_MARKER_DRAW_DISTANCE_FROM_CAMERA_TARGET)) {
          continue;
        }

        markers.push({
          id: npcActor.id,
          texture,
          position: [position[0], position[1] + npcMarkerOffset, position[2]],
          size: npcMarkerSize,
          attention: attentionTargets.has(npcActor.id)
        });
      }

      for (const interactable of interactables) {
        if (!isInteractableActive(interactable, storyState)) {
          continue;
        }

        const texture = markerTextures[interactable.markerKey];
        if (!texture) {
          continue;
        }

        if (!shouldDrawWorldSprite(interactable.position, WORLD_MARKER_DRAW_DISTANCE_FROM_CAMERA_TARGET)) {
          continue;
        }

        markers.push({
          id: interactable.id,
          texture,
          position: [
            interactable.position[0],
            interactable.position[1] + (interactable.markerHeight ?? worldMarkerHeight),
            interactable.position[2]
          ],
          size: worldMarkerSize,
          attention: attentionTargets.has(interactable.id)
        });
      }

      for (const resourceNode of resourceNodes) {
        if (!isResourceNodeActive(resourceNode, storyState)) {
          continue;
        }

        const texture = markerTextures[resourceNode.markerKey];
        if (!texture) {
          continue;
        }

        if (!shouldDrawWorldSprite(resourceNode.position, RESOURCE_MARKER_DRAW_DISTANCE_FROM_CAMERA_TARGET)) {
          continue;
        }

        markers.push({
          id: resourceNode.id,
          texture,
          position: [
            resourceNode.position[0],
            resourceNode.position[1] + worldMarkerHeight,
            resourceNode.position[2]
          ],
          size: worldMarkerSize,
          attention: attentionTargets.has(resourceNode.id)
        });
      }

      if (!markers.length) {
        return;
      }

      prepareSpritePass(viewProjection);

      for (const marker of markers) {
        if (!marker.attention) {
          drawSpriteQuad(marker.texture, marker.position, marker.size, fullUvRect);
          continue;
        }

        const pulse = (Math.sin(markerTime * 6.2) + 1) * 0.5;
        const bob = Math.sin(markerTime * 5.1) * 0.14;
        const popScale = 1 + pulse * 0.18;
        const echoScale = 1.34 + pulse * 0.12;
        const attentionPosition = [
          marker.position[0],
          marker.position[1] + bob,
          marker.position[2]
        ];

        drawSpriteQuad(
          marker.texture,
          [attentionPosition[0], attentionPosition[1] - 0.02, attentionPosition[2]],
          [marker.size[0] * echoScale, marker.size[1] * echoScale],
          fullUvRect
        );
        drawSpriteQuad(
          marker.texture,
          attentionPosition,
          [marker.size[0] * popScale, marker.size[1] * popScale],
          fullUvRect
        );
      }
    },

    drawCharacters(viewProjection, {
      storyState,
      playerCharacter,
      npcActors,
      characterTextures,
      isNpcActive
    }) {
      const visibleCharacters = [];

      if (playerCharacter && playerCharacter.renderCharacter !== false) {
        visibleCharacters.push(playerCharacter);
      }

      for (const npcActor of npcActors) {
        if (!isNpcActive(npcActor, storyState)) {
          continue;
        }

        if (npcActor.renderCharacter === false) {
          continue;
        }

        visibleCharacters.push(npcActor.character);
      }

      if (!visibleCharacters.length) {
        return;
      }

      prepareSpritePass(viewProjection);

      for (const character of visibleCharacters) {
        const renderState = character.getRenderState();
        const texture = characterTextures[renderState.textureKey];

        drawSpriteQuad(texture, renderState.position, renderState.size, renderState.uvRect);
      }
    },

    drawBillboard(viewProjection, texture, position, size, uvRect = [0, 0, 1, 1], options = {}) {
      if (!texture) {
        return;
      }

      prepareSpritePass(viewProjection);
      drawSpriteQuad(texture, position, size, uvRect, options);
    },

    drawBillboards: drawSpriteBillboards
  };
}
