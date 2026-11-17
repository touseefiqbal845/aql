import express from 'express';
import {randomUUID} from 'node:crypto';
import {Role, type AgentCard} from '@a2a-js/sdk';
import {DefaultRequestHandler, InMemoryTaskStore, type AgentExecutor} from '@a2a-js/sdk/server';
import {agentCardHandler,jsonRpcHandler,UserBuilder} from '@a2a-js/sdk/server/express';
export async function startA2A(){
 const app=express();app.use(express.json());
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const addr=server.address();if(!addr||typeof addr==='string')throw Error('No address');const base=`http://127.0.0.1:${addr.port}`;
 const card:AgentCard={name:'Invoice analyzer',description:'Deterministic local invoice analyzer',version:'1.0.0',supportedInterfaces:[{url:base+'/a2a',protocolBinding:'JSONRPC',protocolVersion:'1.0',tenant:''}],provider:undefined,capabilities:{streaming:false,pushNotifications:false,extendedAgentCard:false,extensions:[]},securitySchemes:{},securityRequirements:[],defaultInputModes:['application/json'],defaultOutputModes:['application/json'],skills:[{id:'invoice.analyze',name:'Analyze',description:'Summarize invoices',tags:['invoice'],examples:[],inputModes:['application/json'],outputModes:['application/json'],securityRequirements:[]}],signatures:[]};
 const executor:AgentExecutor={async execute(ctx,bus){const data=ctx.userMessage.parts[0]?.content;if(data?.$case!=='data'||!Array.isArray(data.value?.invoices))throw Error('Invalid input');const invoices=data.value.invoices as {amount:number}[];const sum=invoices.reduce((a,b)=>a+b.amount,0);bus.publish({kind:'message',data:{messageId:randomUUID(),contextId:ctx.contextId,taskId:'',role:Role.ROLE_AGENT,parts:[{content:{$case:'data',value:{summary:`${invoices.length} invoices totaling ${sum}`}},metadata:undefined,filename:'',mediaType:'application/json'}],metadata:undefined,extensions:[],referenceTaskIds:[]}});bus.finished()},async cancelTask(){}};
 const handler=new DefaultRequestHandler(card,new InMemoryTaskStore(),executor);
 app.use('/.well-known/agent-card.json',agentCardHandler({agentCardProvider:handler}));app.use('/a2a',jsonRpcHandler({requestHandler:handler,userBuilder:UserBuilder.noAuthentication}));
 return {base,close:()=>new Promise<void>((r,j)=>server.close(e=>e?j(e):r()))};
}
