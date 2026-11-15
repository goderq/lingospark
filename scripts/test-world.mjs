import assert from 'node:assert/strict';
import {worldLocations} from '../src/data/lingoWorld.js';
import {buildWorldMission,worldArcs,worldUnlocked,worldDecisionAvailable,worldMemory,readWorldDraft} from '../src/data/worldExpansion.js';

const ids=worldLocations.map((item)=>item.id);
assert.deepEqual(worldArcs.flatMap((arc)=>arc.ids),ids);
let scenes=0;
for(const location of worldLocations){
  const original=JSON.stringify(location);
  const mission=buildWorldMission(location,{});
  assert.equal(JSON.stringify(location),original,'Mission generation mutated the shared catalogue');
  assert.equal(mission.scenes.filter((scene)=>scene.kind==='document').length,1,location.id);
  assert.equal(mission.scenes.filter((scene)=>scene.kind==='repair').length,1,location.id);
  assert.equal(new Set(mission.scenes.map((scene)=>scene.prompt)).size,mission.scenes.length,location.id);
  for(const scene of mission.scenes){
    assert.ok(scene.line&&scene.prompt&&scene.explanation);
    if(scene.type==='choice'){
      assert.ok(scene.options.includes(scene.answer),location.id);
      assert.equal(new Set(scene.options).size,scene.options.length,location.id);
    }
  }
  scenes+=mission.scenes.length;
}
assert.equal(worldUnlocked(worldLocations[0],{},worldLocations),true);
assert.equal(worldUnlocked(worldLocations[2],{completed:[ids[1]]},worldLocations),false,'Sparse old saves must not skip prerequisites');
assert.equal(worldUnlocked(worldLocations[2],{completed:ids.slice(0,2)},worldLocations),true);
assert.equal(worldUnlocked(worldLocations[8],{completed:[ids[8]]},worldLocations),true,'Completed old chapters must remain replayable');
assert.equal(worldDecisionAvailable({money:-20},{money:10}),false);
assert.equal(worldDecisionAvailable({money:-20},{money:20}),true);
const hotel=worldLocations[1];
const advisor=buildWorldMission(hotel,{decisions:{airport:{id:'ask-mia'}}});
const express=buildWorldMission(hotel,{decisions:{airport:{id:'express'}}});
assert.notEqual(advisor.scenes.at(-1).answer,express.scenes.at(-1).answer,'Previous choices must affect the later dialogue');
assert.equal(worldMemory(hotel,{decisions:{airport:{outcome:'Saved choice'}}}).at(-1),'Ранее в твоей истории: Saved choice');
const mission=buildWorldMission(worldLocations[0]);
const draft={version:1,locationId:mission.id,sceneCount:mission.scenes.length,index:2,lives:1,score:1,answer:'My draft',checked:false};
assert.equal(readWorldDraft({draft},mission).answer,'My draft');
assert.equal(readWorldDraft({draft:{...draft,index:999}},mission),null);
assert.equal(readWorldDraft({draft:{...draft,sceneCount:4}},mission),null);
assert.equal(readWorldDraft({},mission),null,'Old saves without drafts must load');
console.log(`World audit passed: ${worldLocations.length} chapters, ${scenes} scenes, 20 documents, 20 repairs; branches, old saves, unlocks and costs verified.`);
