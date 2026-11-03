import {spawn} from 'node:child_process';
import path from 'node:path';
export default class LocalModel {
 id(){return 'local-peft-intake';}
 async callApi(prompt){
  const root=process.env.INTAKE_MODEL_REPO;
  if(!root)return {error:'Set INTAKE_MODEL_REPO to a trained intake-model-lab checkout.'};
  const started=performance.now();
  return new Promise(resolve=>{const child=spawn(process.env.PYTHON_BIN||'python3',[path.join(root,'scripts/predict.py')],{env:process.env,stdio:['pipe','pipe','pipe']});let out='',err='';const timer=setTimeout(()=>{child.kill();resolve({error:'Local inference timed out.'});},60000);child.stdout.on('data',chunk=>out+=chunk);child.stderr.on('data',chunk=>err=(err+chunk).slice(-1000));child.on('error',error=>{clearTimeout(timer);resolve({error:error.message});});child.on('close',code=>{clearTimeout(timer);try{if(code)throw new Error(err);const result=JSON.parse(out.trim().split('\n').at(-1));resolve({output:result.label,metadata:{latencyMs:performance.now()-started,modelScore:result.score,paidApiCalls:0}});}catch(error){resolve({error:error.message});}});child.stdin.end(JSON.stringify({text:prompt}));});
 }
}
