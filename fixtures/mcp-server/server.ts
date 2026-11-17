import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
const server=new McpServer({name:'invoice-fixture',version:'1.0.0'});
server.registerTool('invoice_search',{description:'Find fixture invoices',inputSchema:{customer_id:z.string()}},async ({customer_id})=>({content:[{type:'text',text:JSON.stringify({results:[{id:'INV-1',customer_id,amount:120},{id:'INV-2',customer_id,amount:80}]})}]}));
await server.connect(new StdioServerTransport());
