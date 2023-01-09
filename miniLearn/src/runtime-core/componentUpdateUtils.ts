export function shouldUpdateComponent(preVNode, nextvNode) {
  const { props: prevProps } = preVNode;
  const { props: nextProps } = nextvNode;

  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
