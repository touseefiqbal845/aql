import {createToken, Lexer, CstParser, EOF, type IToken, type CstNode} from 'chevrotain';
import type {Program, Expr, Invoke} from './ast.js';
const White=createToken({name:'White',pattern:/\s+/,group:Lexer.SKIPPED});
const kw=(name:string)=>createToken({name,pattern:new RegExp(name+'\\b')});
const Let=kw('LET'), Invoke=kw('INVOKE'), With=kw('WITH'), Require=kw('REQUIRE'), Approval=kw('APPROVAL'), Return=kw('RETURN');
const StringToken=createToken({name:'StringToken',pattern:/'(?:[^'\\]|\\.)*'/});
const NumberToken=createToken({name:'NumberToken',pattern:/-?(?:0|[1-9]\d*)(?:\.\d+)?/});
const Bool=createToken({name:'Bool',pattern:/\b(?:true|false|null)\b/});
const Identifier=createToken({name:'Identifier',pattern:/[a-zA-Z_][a-zA-Z_0-9]*/});
const Eq=createToken({name:'Eq',pattern:/=/}), Dot=createToken({name:'Dot',pattern:/\./}), Comma=createToken({name:'Comma',pattern:/,/}), Semi=createToken({name:'Semi',pattern:/;/});
const tokens=[White,Let,Invoke,With,Require,Approval,Return,StringToken,NumberToken,Bool,Identifier,Eq,Dot,Comma,Semi];
const lexer=new Lexer(tokens);
class Parser extends CstParser {
 constructor(){super(tokens); const $=this;
 $.RULE('program',()=>{$.MANY(()=>$.SUBRULE($.statement));$.CONSUME(EOF);});
 $.RULE('statement',()=>{$.OR([{ALT:()=>{$.OPTION(()=>{$.CONSUME(Let);$.CONSUME(Identifier,{LABEL:'variable'});$.CONSUME(Eq)});$.CONSUME(Invoke);$.CONSUME(StringToken,{LABEL:'capability'});$.OPTION2(()=>{$.CONSUME(With);$.SUBRULE($.argument);$.MANY(()=>{$.CONSUME(Comma);$.SUBRULE2($.argument)})});$.OPTION3(()=>{$.CONSUME(Require);$.CONSUME(Approval)});$.CONSUME(Semi)}},{ALT:()=>{$.CONSUME(Return);$.SUBRULE($.expression);$.CONSUME2(Semi)}}]);});
 $.RULE('argument',()=>{$.CONSUME(Identifier);$.CONSUME(Eq);$.SUBRULE($.expression)});
 $.RULE('expression',()=>{$.OR([{ALT:()=>$.CONSUME(StringToken)},{ALT:()=>$.CONSUME(NumberToken)},{ALT:()=>$.CONSUME(Bool)},{ALT:()=>{$.CONSUME(Identifier);$.MANY(()=>{$.CONSUME(Dot);$.CONSUME2(Identifier)})}}])});
 this.performSelfAnalysis(); }
 program!:()=>CstNode; statement!:()=>CstNode; argument!:()=>CstNode; expression!:()=>CstNode;
}
const parser=new Parser();
const tok=(x:unknown)=>x as IToken; const node=(x:unknown)=>x as CstNode;
function expr(n:CstNode):Expr {const c=n.children;if(c.StringToken){const s=tok(c.StringToken[0]).image.slice(1,-1);return {kind:'literal',value:s.replace(/\\(['\\])/g,'$1')}}if(c.NumberToken)return {kind:'literal',value:Number(tok(c.NumberToken[0]).image)};if(c.Bool)return {kind:'literal',value:JSON.parse(tok(c.Bool[0]).image)};return {kind:'reference',path:(c.Identifier??[]).map(x=>tok(x).image)}}
export function parse(source:string):Program {const l=lexer.tokenize(source);if(l.errors.length){const e=l.errors[0];throw new Error(`Lexical error at ${e.line}:${e.column}: ${e.message}`)}parser.input=l.tokens;const tree=parser.program();if(parser.errors.length){const e=parser.errors[0];throw new Error(`Syntax error at ${e.token.startLine??'?'}:${e.token.startColumn??'?'}: ${e.message}`)}if(!parser.input.length)throw new Error('Empty program');const out:Program=(tree.children.statement??[]).map(x=>{const c=node(x).children;if(c.RETURN)return {kind:'return',value:expr(node(c.expression[0]))};const args:Record<string,Expr>={};for(const a of c.argument??[]){const ac=node(a).children;const name=tok(ac.Identifier[0]).image;if(Object.hasOwn(args,name))throw new Error(`Duplicate argument ${name}`);args[name]=expr(node(ac.expression[0]));}return {kind:'invoke',capability:tok(c.capability[0]).image.slice(1,-1),variable:c.variable?tok(c.variable[0]).image:undefined,args,approval:!!c.REQUIRE} as Invoke});return out}
