export const enum NodeTypes {
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  ROOT,
  COMPOUND_EXPRESSION,
}

export function createVNodeCall(tag, props, children) {
  const vnodeElement = {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
  return vnodeElement;
}
