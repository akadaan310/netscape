import {artifactDigest,type SavedArtifact} from '@netscape/conformance';

/** Append one cited artifact while keeping the bounded browser shelf. */
export function appendArtifact(current:SavedArtifact[],baseId:string,body:Omit<SavedArtifact,'id'|'digest'>):SavedArtifact[]{
  const prefix=`${baseId}-`;
  const suffix=1+Math.max(0,...current.filter(a=>a.id.startsWith(prefix)).map(a=>Number(a.id.slice(prefix.length))).filter(Number.isSafeInteger));
  const complete={...body,id:`${baseId}-${suffix}`};
  return [{...complete,digest:artifactDigest(complete)},...current].slice(0,50);
}
