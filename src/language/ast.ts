export type Expr = {kind:'literal'; value: unknown} | {kind:'reference'; path:string[]};
export type Invoke = {kind:'invoke'; capability:string; args:Record<string,Expr>; variable?:string; approval:boolean};
export type Statement = Invoke | {kind:'return'; value:Expr};
export type Program = Statement[];
