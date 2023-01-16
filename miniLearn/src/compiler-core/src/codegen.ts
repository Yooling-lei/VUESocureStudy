import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelper";

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;

  // 注:preamble(序言)
  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");

  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");

  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast: any, context) {
  const { push } = context;
  const VueBinging = "Vue";
  // 判断有没有差值
  const aliasHelper = (s) => `${s}:_${s}`;

  // 有差值时就需要toDisplayString
  const { helpers } = ast;
  if (helpers.length > 0) {
    push(`const { ${helpers.map(aliasHelper).join(", ")} } = ${VueBinging} `);
  }
  push("\n");
  push("return ");
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;

    default:
      break;
  }
}

function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  const { push } = context;

  push(`_${TO_DISPLAY_STRING}(`);
  genNode(node.content, context);
  push(")");
}

function genExpression(node, context) {
  console.log("==========>", node);
  const { push } = context;
  push(`${node.content}`);
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
  };
  return context;
}
