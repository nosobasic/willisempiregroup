import { useState } from 'react';
import { db } from './client';
type Inventory = { schema_version:string; tasks:Record<string,unknown>[]; evidence_index:Record<string,unknown>[] };
export function InventoryImport({orgId,refresh}:{orgId:string;refresh:()=>Promise<void>}) {
 const [pending,setPending]=useState<{payload:Inventory;revision:string}|null>(null);
 const [pasted,setPasted]=useState('');
 const [note,setNote]=useState(''), [busy,setBusy]=useState(false);
 async function read(file?:File) {
  setPending(null);setNote(''); if(!file)return;
  try {
   if(file.size>500000)throw new Error('Inventory is too large.');
   const bytes=await file.arrayBuffer();
   const revision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   const payload=JSON.parse(new TextDecoder().decode(bytes)) as Inventory;
   if(payload.schema_version!=='1.0'||!Array.isArray(payload.tasks)||!Array.isArray(payload.evidence_index)||!payload.tasks.length||payload.tasks.length>100)throw new Error('Unsupported inventory format.');
   if(new Set(payload.tasks.map(t=>t.id)).size!==payload.tasks.length)throw new Error('Duplicate source IDs.');
   setPending({payload,revision});
  } catch(e){setNote(e instanceof Error?e.message:'Unable to read inventory.');}
 }
 async function apply(){if(!pending)return;setBusy(true);try{
  const {data,error}=await db().rpc('import_reviewed_inventory',{target_org:orgId,revision:pending.revision,items:pending.payload.tasks,evidence:pending.payload.evidence_index});
  if(error)throw error;
  setNote(`Import saved: ${data.inserted} added, ${data.unchanged} unchanged.`);await refresh();setPending(null);
 }catch(e){setNote(e instanceof Error?e.message:String((e as {message?:string}).message||e));}finally{setBusy(false);}}
 return <details className="import-panel"><summary>Import reviewed inventory</summary><p>Choose a reviewed JSON file. New source IDs are added; identical revisions are skipped. Conflicting sources stop the whole import. Existing manual edits are preserved.</p><label>Paste inventory JSON<textarea aria-label="Paste inventory JSON" value={pasted} onChange={e=>setPasted(e.target.value)} /></label><button className="secondary" disabled={busy || !pasted} onClick={()=>void read(new File([pasted],"inventory.json",{type:"application/json"}))}>Review pasted inventory</button><label>Or choose Inventory JSON<input type="file" accept="application/json,.json" disabled={busy} onChange={e=>void read(e.target.files?.[0])}/></label>{pending&&<><p>{pending.payload.tasks.length} records ready for review. Source evidence, original dates, holds and uncertainty will be retained. Recorded approvals do not authorize action.</p><p className="source-detail">SHA-256: {pending.revision}</p><details><summary>Review task titles and statuses</summary><ul>{pending.payload.tasks.map(t=><li key={String(t.id)}>{String(t.title)} — {String(t.status)}</li>)}</ul></details><button className="primary" disabled={busy} onClick={()=>void apply()}>{busy?'Importing…':'Import reviewed records'}</button></>}{note&&<p role="status">{note}</p>}</details>;
}
