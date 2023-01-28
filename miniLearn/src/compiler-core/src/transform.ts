import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelper";

export function transform(root, options = {}) {
  // 1.遍历 深度优先
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);

  root.helpers = [...context.helpers.keys()];
}

// 根目录function生成
function createRootCodegen(root: any) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = child;
  }
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function traverseNode(node: any, context) {
  const { nodeTransforms } = context;
  const exitFns: any = [];

  if (nodeTransforms) {
    for (let i = 0; i < nodeTransforms.length; i++) {
      const transform = nodeTransforms[i];
      const onExit = transform?.(node, context);
      if (onExit) exitFns.push(onExit);
    }
    switch (node.type) {
      case NodeTypes.INTERPOLATION:
        context.helper(TO_DISPLAY_STRING);
        break;
      case NodeTypes.ROOT:
      case NodeTypes.ELEMENT:
        traverseChildren(node, context);
        break;
      default:
        break;
    }
    let i = exitFns.length;
    while (i--) {
      exitFns[i]();
    }
  }
}

function traverseChildren(node: any, context: any) {
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    const next = children[i];
    traverseNode(next, context);
  }
}
