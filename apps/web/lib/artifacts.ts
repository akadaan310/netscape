import {artifactDigest,preflightWorkspace,type SavedArtifact,type Workspace} from '@netscape/conformance';

export const PERSISTENCE_LIMIT_NOTICE='Local persistence limit reached (schema or replay budget). Existing saved work is kept. Export manifest to keep this realization.';

/** No write occurs until the locally constructed record meets restore bounds.
 * Untrusted records must use validateWorkspace, which also integrates replays. */
export function persistWorkspace(workspace:Workspace,write:(json:string)=>void):void{
  if(!preflightWorkspace(workspace))throw new Error(PERSISTENCE_LIMIT_NOTICE);
  write(JSON.stringify(workspace));
}

/** Append one cited artifact while keeping the bounded browser shelf. */
export function appendArtifact(current:SavedArtifact[],baseId:string,body:Omit<SavedArtifact,'id'|'digest'>,workspace:Omit<Workspace,'artifacts'>):SavedArtifact[]{
  const prefix=`${baseId}-`;
  const suffix=1+Math.max(0,...current.filter(a=>a.id.startsWith(prefix)).map(a=>Number(a.id.slice(prefix.length))).filter(Number.isSafeInteger));
  const complete={...body,id:`${baseId}-${suffix}`};
  const candidate=[{...complete,digest:artifactDigest(complete)},...current].slice(0,50);
  if(!preflightWorkspace({...workspace,artifacts:candidate}))throw new Error(PERSISTENCE_LIMIT_NOTICE);
  return candidate;
}
