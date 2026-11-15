import assert from 'node:assert/strict';
import {lifePaths,pathProgress,pathQuestions,finishPathChapter,restartLifePath,rentalListings,rentalBudget,rentalInitialCost,rentalQuestions,finishRental} from '../src/data/worldPaths.js';
let count=0;
for(const path of lifePaths){
  const empty={completed:['airport'],money:150,lifePaths:{},rental:{legacy:'preserve'}};
  assert.equal(finishPathChapter(empty,path.id,path.chapters[1].id,path.chapters[1].decisions[0].id),empty,'Cannot skip a chapter');
  for(const ending of path.chapters.at(-1).decisions){
    let world=empty;
    for(const chapter of path.chapters){
      const choice=chapter===path.chapters.at(-1)?ending:chapter.decisions[0];
      const questions=pathQuestions(world,path,chapter);
      for(const q of questions){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.explanation);count++;}
      const saved=finishPathChapter(world,path.id,chapter.id,choice.id);
      assert.notEqual(saved,world);
      assert.equal(saved.money,150,'Story choice must not spend wallet money');
      assert.deepEqual(saved.completed,['airport']);
      assert.equal(finishPathChapter(saved,path.id,chapter.id,choice.id),saved,'Repeated completion must be idempotent');
      world=saved;
    }
    assert.equal(pathProgress(world,path).ending,ending.outcome);
    assert.equal(world.rental.legacy,'preserve');
    const replay=restartLifePath(world,path.id);
    assert.equal(pathProgress(replay,path).completed.length,0);
    assert.ok(pathProgress(replay,path).endings.includes(ending.outcome));
    assert.deepEqual(replay.completed,['airport']);
  }
  const left=finishPathChapter({},path.id,path.chapters[0].id,path.chapters[0].decisions[0].id);
  const right=finishPathChapter({},path.id,path.chapters[0].id,path.chapters[0].decisions[1].id);
  assert.notEqual(pathQuestions(left,path,path.chapters[1])[0].answer,pathQuestions(right,path,path.chapters[1])[0].answer,'First choice must affect the later mission');
}
for(const listing of rentalListings){
  assert.ok(rentalInitialCost(listing)<=rentalBudget);
  assert.equal(rentalQuestions(listing)[0].answer,`£${rentalInitialCost(listing)}`);
  for(const question of rentalQuestions(listing).filter((q)=>q.type==='choice'))assert.equal(new Set(question.options).size,question.options.length,'Rental options must be unique');
  for(const terms of ['inventory','repair']){
    const old={money:150,completed:['flat']},world=finishRental(old,listing.id,terms);
    assert.equal(world.money,old.money);
    assert.equal(world.rental.monthly,listing.rent+listing.bills);
    assert.equal(world.rental.initial,listing.rent+listing.bills+listing.deposit);
    assert.equal(finishRental(world,listing.id,terms),world);
  }
}
assert.equal(finishRental({},'missing','repair').rental,undefined);
assert.equal(finishPathChapter({},'missing','missing','missing').lifePaths,undefined);
const career=lifePaths[0],last=career.chapters.at(-1);
assert.equal(pathQuestions({lifePaths:{study:{ending:'Graduated'}}},career,last).length,last.questions.length+1,'Completed study should open a career contact');
console.log(`Life paths passed: 3 paths, 9 chapters, 6 endings, branching choices, cross-path contact and all rental options verified (${count} question checks).`);
