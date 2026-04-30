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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

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
    syncPixelSnap();
    gl.uniform2fv(uniforms.pixelSnap, pixelSnap);
    gl.uniform1f(uniforms.time, performance.now() * 0.001);
    gl.uniform1i(uniforms.texture, 0);
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

  function drawSceneObject(sceneObject) {
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

      gl.uniform3fv(uniforms.instanceOffset, instance.offset);
      gl.uniform1f(uniforms.instanceScale, instance.scale);
      gl.uniform1f(uniforms.instanceYaw, instance.yaw || 0);
      gl.uniform1f(uniforms.instancePitch, instance.pitch || 0);
      gl.uniform1f(uniforms.instanceRoll, instance.roll || 0);
      if (uniforms.localYaw) {
        gl.uniform1f(uniforms.localYaw, instance.localYaw || 0);
      }

      if (uniforms.localPivot) {
        gl.uniform3fv(uniforms.localPivot, instance.localPivot || [0, 0, 0]);
      }
      gl.uniform1f(uniforms.swayStrength, instance.swayStrength || 0);

      for (const primitive of sceneObject.model.primitives) {
        bindScenePrimitive(primitive);
        gl.drawElements(gl.TRIANGLES, primitive.indexCount, primitive.indexType, 0);
      }
    }
  }

  function prepareSpritePass(viewProjection) {
    const { right: quadRight, up: quadUp } = camera.getBillboardAxes();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(spriteProgram);
    gl.uniformMatrix4fv(spriteUniforms.viewProjection, false, viewProjection);
    syncPixelSnap();
    gl.uniform2fv(spriteUniforms.pixelSnap, pixelSnap);
    gl.uniform3fv(spriteUniforms.quadRight, quadRight);
    gl.uniform3fv(spriteUniforms.quadUp, quadUp);
    gl.uniform1i(spriteUniforms.spriteTexture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, spriteQuadBuffer);
    gl.enableVertexAttribArray(spriteAttribs.corner);
    gl.vertexAttribPointer(spriteAttribs.corner, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(spriteAttribs.texCoord);
    gl.vertexAttribPointer(spriteAttribs.texCoord, 2, gl.FLOAT, false, 16, 8);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spriteQuadIndices);
  }

  function drawSpriteQuad(texture, position, size, uvRect) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform3fv(spriteUniforms.worldPosition, position);
    gl.uniform2fv(spriteUniforms.spriteSize, size);
    gl.uniform4fv(spriteUniforms.uvRect, uvRect);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
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
        billboard.uvRect || [0, 0, 1, 1]
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

      for (const sceneObject of sceneObjects) {
        drawSceneObject(sceneObject);
      }
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

        markers.push({
          id: interactable.id,
          texture,
          position: [
            interactable.position[0],
            interactable.position[1] + worldMarkerHeight,
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

      if (playerCharacter) {
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

    drawBillboard(viewProjection, texture, position, size, uvRect = [0, 0, 1, 1]) {
      if (!texture) {
        return;
      }

      prepareSpritePass(viewProjection);
      drawSpriteQuad(texture, position, size, uvRect);
    },

    drawBillboards: drawSpriteBillboards
  };
}
