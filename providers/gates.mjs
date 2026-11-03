import {sampleRuns,evaluateRun} from '../public/core.js';
export default class TraceGate { id(){return 'recorded-trace-gate';} async callApi(prompt){const item=evaluateRun(sampleRuns().candidate).cases.find(row=>row.id===prompt.trim());if(!item)return {error:'Unknown case ID'};return {output:item.pass?'pass':'hold'};} }
