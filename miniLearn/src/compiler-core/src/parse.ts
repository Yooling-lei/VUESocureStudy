import { NodeTypes } from "./ast";

type IContext = {
  source: string;
};

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context: IContext) {
  const nodes: Array<any> = [];

  let node;

  const { source } = context;
  if (source.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (source[0] === "<" && /[a-z]/i.test(source[1])) {
    node = parseElement(context);
  } else {
    node = parseText(context);
  }

  nodes.push(node);
  return nodes;
}

function parseText(context: IContext): any {
  // 1.获取content

  const content = parseTextData(context, context.source.length);
  // 2.推进
  advanceBy(context, content.length);

  return {
    type: NodeTypes.TEXT,
    contet: content,
  };
}

function parseTextData(context: IContext, length) {
  return context.source.slice(0, length);
}

function parseElement(context: IContext) {
  // 1.解析 tag
  const element = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  console.log("================>", context.source);

  return element;
}

function parseTag(context: IContext, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];

  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  if (type === TagType.End) return;

  // 2.删除处理完成的
  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
  };
}

// Path {{xxx}}
function parseInterpolation(context: IContext) {
  //{{messge}} =>
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  advanceBy(context, openDelimiter.length);
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength);

  const content = rawContent.trim();

  advanceBy(context, closeDelimiter.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}
function advanceBy(context, length) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return { children };
}

function createParserContext(content: string) {
  return {
    source: content,
  };
}
