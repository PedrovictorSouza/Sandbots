import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import {
  formatArchitectureAnnotationBlock,
  isPragtAnnotationCommentText,
  parseArchitectureAnnotationText,
  translateArchitectureAnnotation
} from "../refactor/architecture-annotations.js";

const traverse = traverseModule.default;
const DEFAULT_PARSER_PLUGINS_TS = [
  "jsx",
  "typescript",
  "classProperties",
  "optionalChaining",
  "nullishCoalescingOperator",
  "dynamicImport",
  "topLevelAwait"
];

const DEFAULT_PARSER_PLUGINS_FLOW = [
  "jsx",
  "flow",
  "classProperties",
  "optionalChaining",
  "nullishCoalescingOperator",
  "dynamicImport",
  "topLevelAwait"
];

function parseSourceFile(sourceText) {
  try {
    return {
      ast: parse(sourceText, {
        sourceType: "module",
        plugins: DEFAULT_PARSER_PLUGINS_TS
      })
    };
  } catch (_typescriptError) {
    return {
      ast: parse(sourceText, {
        sourceType: "module",
        plugins: DEFAULT_PARSER_PLUGINS_FLOW
      })
    };
  }
}

function hasNamedFunction(ast, functionName) {
  return Boolean(findNamedFunctionAttachment(ast, functionName));
}

function getLineStartIndex(sourceText, index) {
  const previousLineBreak = sourceText.lastIndexOf("\n", Math.max(0, index - 1));
  return previousLineBreak === -1 ? 0 : previousLineBreak + 1;
}

function getIndentAt(sourceText, index) {
  const lineStart = getLineStartIndex(sourceText, index);
  const match = sourceText.slice(lineStart, index).match(/^[ \t]*/);

  return match?.[0] || "";
}

function detectEol(sourceText) {
  return sourceText.includes("\r\n") ? "\r\n" : "\n";
}

function resolveAttachmentNode(functionPath) {
  if (!functionPath) {
    return null;
  }

  if (
    functionPath.parentPath?.node?.type === "ExportNamedDeclaration" ||
    functionPath.parentPath?.node?.type === "ExportDefaultDeclaration"
  ) {
    return functionPath.parentPath.node;
  }

  if (functionPath.parentPath?.isVariableDeclarator()) {
    const declarationPath = functionPath.parentPath.parentPath;

    if (declarationPath?.isVariableDeclaration()) {
      if (
        declarationPath.parentPath?.node?.type === "ExportNamedDeclaration" ||
        declarationPath.parentPath?.node?.type === "ExportDefaultDeclaration"
      ) {
        return declarationPath.parentPath.node;
      }

      return declarationPath.node;
    }

    return functionPath.parentPath.node;
  }

  return functionPath.node;
}

function getSortedComments(comments) {
  return Array.isArray(comments)
    ? [...comments].sort((left, right) => left.start - right.start)
    : [];
}

function collectImmediateLeadingComments(sourceText, comments, anchorLineStart) {
  const chain = [];
  let cursor = anchorLineStart;

  while (true) {
    const candidate = getSortedComments(comments)
      .filter((comment) => Number.isInteger(comment.start) && Number.isInteger(comment.end))
      .filter((comment) => comment.end <= cursor)
      .at(-1);

    if (!candidate) {
      break;
    }

    const candidateLineStart = getLineStartIndex(sourceText, candidate.start);
    const leadingSegment = sourceText.slice(candidateLineStart, candidate.start);
    const betweenSegment = sourceText.slice(candidate.end, cursor);

    if (!/^[ \t]*$/.test(leadingSegment) || !/^[ \t\r\n]*$/.test(betweenSegment)) {
      break;
    }

    chain.unshift({
      ...candidate,
      lineStart: candidateLineStart,
      text: sourceText.slice(candidate.start, candidate.end)
    });
    cursor = candidateLineStart;
  }

  return chain;
}

function getTrailingPragtComments(commentChain) {
  const trailing = [];

  for (let index = commentChain.length - 1; index >= 0; index -= 1) {
    if (!isPragtAnnotationCommentText(commentChain[index].text)) {
      break;
    }

    trailing.unshift(commentChain[index]);
  }

  return trailing;
}

export function findNamedFunctionAttachment(ast, functionName) {
  let match = null;

  traverse(ast, {
    FunctionDeclaration(functionPath) {
      if (match || functionPath.node.id?.name !== functionName) {
        return;
      }

      match = {
        functionPath,
        attachmentNode: resolveAttachmentNode(functionPath)
      };
      functionPath.stop();
    },
    VariableDeclarator(variablePath) {
      if (match) {
        return;
      }

      const { id, init } = variablePath.node;

      if (
        id?.type !== "Identifier" ||
        id.name !== functionName ||
        !init ||
        (init.type !== "ArrowFunctionExpression" &&
          init.type !== "FunctionExpression")
      ) {
        return;
      }

      const initPath = variablePath.get("init");

      match = {
        functionPath: initPath,
        attachmentNode: resolveAttachmentNode(initPath)
      };
      variablePath.stop();
    }
  });

  return match;
}

export function getArchitectureAnnotationForFunctionPath(functionPath, comments, sourceText) {
  const attachmentNode = resolveAttachmentNode(functionPath);

  if (!attachmentNode || !Number.isInteger(attachmentNode.start)) {
    return null;
  }

  const anchorLineStart = getLineStartIndex(sourceText, attachmentNode.start);
  const leadingComments = collectImmediateLeadingComments(sourceText, comments, anchorLineStart);
  const trailingPragtComments = getTrailingPragtComments(leadingComments);

  if (!trailingPragtComments.length) {
    return null;
  }

  const firstComment = trailingPragtComments[0];
  const lastComment = trailingPragtComments[trailingPragtComments.length - 1];
  const commentText = sourceText.slice(firstComment.start, lastComment.end);
  const parsed = parseArchitectureAnnotationText(commentText);

  return {
    ...parsed,
    comment: commentText,
    start: firstComment.start,
    end: lastComment.end,
    lineStart: firstComment.lineStart
  };
}

export function applyArchitectureAnnotation({
  sourceText,
  functionName,
  annotationText
}) {
  const { ast } = parseSourceFile(sourceText);
  const attachment = findNamedFunctionAttachment(ast, functionName);

  if (!attachment?.attachmentNode || !Number.isInteger(attachment.attachmentNode.start)) {
    throw new Error(`Funcao nao encontrada no arquivo: ${functionName}.`);
  }

  const trimmedAnnotation = String(annotationText || "").trim();

  if (!trimmedAnnotation) {
    throw new Error("Architecture annotation vazia.");
  }

  const translation = translateArchitectureAnnotation(trimmedAnnotation);
  const anchorLineStart = getLineStartIndex(sourceText, attachment.attachmentNode.start);
  const indent = getIndentAt(sourceText, attachment.attachmentNode.start);
  const eol = detectEol(sourceText);
  const commentBlock = formatArchitectureAnnotationBlock(translation.translatedText, {
    indent,
    eol
  });
  const leadingComments = collectImmediateLeadingComments(sourceText, ast.comments, anchorLineStart);
  const trailingPragtComments = getTrailingPragtComments(leadingComments);
  const replaceStart = trailingPragtComments.length
    ? trailingPragtComments[0].lineStart
    : anchorLineStart;
  const nextSource =
    sourceText.slice(0, replaceStart) +
    `${commentBlock}${eol}` +
    sourceText.slice(anchorLineStart);
  if (!hasNamedFunction(parseSourceFile(nextSource).ast, functionName)) {
    throw new Error(`A funcao ${functionName} nao foi encontrada apos inserir a annotation.`);
  }

  return {
    nextSource,
    translatedText: translation.translatedText,
    translatedLines: translation.translatedLines,
    commentBlock
  };
}
