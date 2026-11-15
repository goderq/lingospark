import assert from 'node:assert/strict';
import {lessons} from '../src/data/course.js';
import {tenseModules} from '../src/data/advancedCourse.js';
import {grammarQuestions,placementQuestions} from '../src/data/practice.js';
import {addContentReport,choiceQualityIssues,distinctDistractors,reportReasons} from '../src/utils/contentQuality.js';
let checked=0;
for(const item of [...lessons.flatMap((entry)=>entry.exercises),...tenseModules.flatMap((entry)=>entry.exercises),...grammarQuestions,...placementQuestions]){
  assert.deepEqual(choiceQualityIssues(item),[],item.prompt);
  if(item.type!=='build'&&item.options)checked++;
}
assert.ok(choiceQualityIssues({answer:'Hi',options:['Hi','hi!']}).length);
assert.ok(choiceQualityIssues({answer:'Hi',answers:['Hello'],options:['Hi','Hello']}).length);
assert.deepEqual(distinctDistractors(['прием','встреча','приём','счёт','СЧЁТ!','стол'],['приём','встреча']),['счёт','стол']);
const item={id:'same',prompt:'How are you?',answer:'Как дела?',options:['Как дела?','Как тебя зовут?']};
const first=addContentReport([],item,{topic:'A1',selected:'Как тебя зовут?'},reportReasons[0],'2026-11-15T00:00:00Z');
const repeated=addContentReport(first,item,{topic:'A1'},reportReasons[0],'2026-11-15T01:00:00Z');
assert.equal(repeated.length,1);assert.equal(repeated[0].count,2);assert.equal(repeated[0].createdAt,first[0].createdAt);
assert.equal(addContentReport(first,{...item,prompt:'Another question'},{topic:'A1'},reportReasons[0]).length,2,'Same ID in different contexts must not merge reports');
assert.equal(addContentReport(first,item,{},'not-a-reason'),first);
let bounded=[];for(let i=0;i<110;i++)bounded=addContentReport(bounded,{...item,prompt:`Question ${i}`},{},reportReasons[0]);assert.equal(bounded.length,100);
console.log(`Quality checks passed: ${checked} choice exercises structurally verified; accepted synonyms excluded from distractors; reports deduplicate and retain at most 100 entries.`);
