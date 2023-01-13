export function transform(root, options) {
  // 1.遍历 深度优先

  const context = createTransformContext(root, options);
  traverseNode(root, context);
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  };
  return context;
}

function traverseNode(node: any, context) {
  const { nodeTransforms } = context;
  if (nodeTransforms) {
    for (let i = 0; i < nodeTransforms.length; i++) {
      const fun = nodeTransforms[i];
      fun?.(node);
    }
  }
  const { children } = node;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const next = children[i];
    traverseNode(next, context);
  }
  return node;
}
