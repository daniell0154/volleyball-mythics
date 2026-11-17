import {readFile,writeFile} from 'node:fs/promises';
const file=process.argv[2];if(!file)throw Error('Supply the exported 010-playtest-human.json path');
const report=JSON.parse(await readFile(file,'utf8'));
const partial=process.argv.includes('--partial');
if(report.participantType!=='human self-report'||(!partial&&(!report.skill?.trim()||!report.opinion?.trim())))throw Error('Record participant experience and opinion in the exported report');
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1]??0;
const summaries=['1v1','2v2'].map(mode=>{
 const rows=report.measurements.filter(r=>r.mode===mode&&r.rulesVersion===3).slice(0,20);
 if(rows.length<20&&!partial)throw Error('Need 20 measured rallies for '+mode+' on profile 3');
 for(const row of rows)if(!Number.isFinite(row.durationSeconds)||!Number.isInteger(row.contactsAfterServe)||row.contactsAfterServe<0||typeof row.returnedServe!=='boolean'||typeof row.served!=='boolean')throw Error('Invalid measurement');
 const served=rows.filter(r=>r.served),returnRate=served.length?served.filter(r=>r.returnedServe).length/served.length:0;
 const medianContacts=percentile(served.map(r=>r.contactsAfterServe),.5);
 return{mode,rallies:rows.length,legalServes:served.length,returnRate,medianContacts,medianDurationSeconds:percentile(served.map(r=>r.durationSeconds),.5),targetMet:rows.length<20?null:returnRate>=.7&&medianContacts>=3};
});
const summary={participantType:report.participantType,skill:report.skill,opinion:report.opinion,timestamp:report.timestamp,userAgent:report.userAgent,summaries};
console.log(JSON.stringify(summary,null,2));if(process.argv[3]&&process.argv[3]!=='--partial')await writeFile(process.argv[3],JSON.stringify(summary,null,2)+'\n');
