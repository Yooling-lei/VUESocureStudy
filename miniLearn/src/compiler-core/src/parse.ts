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
  return createRoot(parseChildren(context, []));
}

function parseChildren(context: IContext, ancestors) {
  const nodes: Array<any> = [];

  while (!isEnd(context, ancestors)) {
    let node;
    const { source } = context;
    if (source.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (source[0] === "<" && /[a-z]/i.test(source[1])) {
      node = parseElement(context, ancestors);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
    console.log("==================>", node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  // 1.当source 为空
  // 2.当遇到结束标签时
  const { source }: { source: string } = context;
  if (source.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const { tag } = ancestors[i];
      if (startsWithEndTagOpen(source, tag)) {
        return true;
      }
    }
  }
  // if (parentTag && source.startsWith(`</${parentTag}>`)) return true;
  return !source;
}

function parseText(context: IContext): any {
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];
  for (let i = 0; i < endTokens.length; i++) {
    const element = endTokens[i];
    const index = context.source.indexOf(element);
    if (index > -1 && index < endIndex) {
      endIndex = index;
    }
  }

  // 1.获取content

  const content = parseTextData(context, endIndex);
  // 2.推进
  advanceBy(context, content.length);
  return {
    type: NodeTypes.TEXT,
    content: content,
  };
}

function parseTextData(context: IContext, length) {
  return context.source.slice(0, length);
}

function parseElement(context: IContext, ancestors) {
  // 1.解析 tag
  const element: any = parseTag(context, TagType.Start);
  // ancestors.push(element.tag);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签:${element.tag}`);
  }

  return element;
}

function startsWithEndTagOpen(source, tag) {
  return source.slice(2, 2 + tag.length) === tag;
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

  advanceBy(context, closeDelimiter.length + content.length);
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
  return { children, type: NodeTypes.ROOT };
}

function createParserContext(content: string) {
  return {
    source: content,
  };
}
