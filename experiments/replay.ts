import {generateSurface,GRAMMAR_VERSION,type Display,type Family,type SemanticGraph} from '../packages/core/src/index.ts';
import {sha256} from './oracles.ts';
export type ReplayManifest={version:1;grammarVersion:string;fixtureHTML:string;fixtureSHA256:string;graph:SemanticGraph;graphSHA256:string;seed:number;family:Family;display:Display;expectedSurfaceSHA256:string};
export function createReplayManifest(graph:SemanticGraph,fixtureHTML:string,seed:number,family:Family,display:Display):ReplayManifest {
 const surface=generateSurface(graph,{seed,family,display});
 return {version:1,grammarVersion:GRAMMAR_VERSION,fixtureHTML,fixtureSHA256:sha256(fixtureHTML),graph,graphSHA256:sha256(graph),seed,family,display,expectedSurfaceSHA256:sha256(surface)};
}
export function replay(manifest:ReplayManifest){
 if(manifest.version!==1||manifest.grammarVersion!==GRAMMAR_VERSION)throw new Error('Replay version mismatch');
 if(sha256(manifest.fixtureHTML)!==manifest.fixtureSHA256)throw new Error('Fixture SHA-256 mismatch');
 if(sha256(manifest.graph)!==manifest.graphSHA256)throw new Error('Graph SHA-256 mismatch');
 const surface=generateSurface(manifest.graph,{seed:manifest.seed,family:manifest.family,display:manifest.display});
 if(sha256(surface)!==manifest.expectedSurfaceSHA256)throw new Error('Surface SHA-256 mismatch');
 return surface;
}
