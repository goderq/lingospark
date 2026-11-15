import assert from 'node:assert/strict';
import {newRentalDialogue,rentalIntents,viewingTimes,availableRentalIntents,replyToLandlord,dialogueHelp,evaluateWorldQuestion,worldQuestionHelp} from '../src/utils/worldDialogue.js';
import {finishRental,restartRental,rentalListings,rentalInitialCost} from '../src/data/worldPaths.js';
for(const intent of rentalIntents){
  for(const phrase of intent.examples){
    const reply=replyToLandlord(newRentalDialogue(),intent.id,phrase);
    assert.ok(reply.accepted,phrase);
    if(intent.id==='decline')assert.equal(reply.dialogue.phase,'declined');
    if(intent.id==='viewing')assert.equal(reply.dialogue.phase,'time');
  }
  assert.notEqual(dialogueHelp(intent,1),intent.examples[0]);
  assert.notEqual(dialogueHelp(intent,2),intent.examples[0]);
  assert.equal(dialogueHelp(intent,3),intent.examples[0]);
}
let dialogue=newRentalDialogue();
const failed=replyToLandlord(dialogue,'viewing','I do not want a viewing');
assert.equal(failed.accepted,false,'Negated intent must not be accepted as agreement');
assert.equal(failed.dialogue.phase,'inquiry');
assert.equal(failed.dialogue.repairs,1);
dialogue=replyToLandlord(failed.dialogue,'budget','Is the rent negotiable?').dialogue;
assert.ok(!availableRentalIntents(dialogue).some((entry)=>entry.id==='budget'),'Discount cannot be repeated');
dialogue=replyToLandlord(dialogue,'repair','Could you fix the reported issues before I move in?').dialogue;
dialogue=replyToLandlord(dialogue,'viewing','Can I arrange a viewing?').dialogue;
assert.equal(replyToLandlord(dialogue,'decline','Thank you, but I will keep looking.').accepted,false,'Only offered intents may be submitted');
for(const time of viewingTimes){
  const done=replyToLandlord(dialogue,time.id,time.examples[0]).dialogue;
  assert.equal(done.phase,'done');
  const listing=rentalListings[0],world=finishRental({money:150},listing.id,'inventory',done);
  assert.equal(world.rental.initial,rentalInitialCost(listing)-20);
  assert.equal(world.rental.monthly,listing.rent+listing.bills-20);
  assert.equal(world.money,150);
  const replay=restartRental(world);
  assert.equal(replay.rental,null);
  assert.equal(replay.rentalHistory[0],world.rental);
}
const declined=replyToLandlord(newRentalDialogue(),'decline','Thanks, but I will keep looking.').dialogue;
assert.equal(finishRental({},rentalListings[0].id,'inventory',declined).rental,undefined,'Declining must not create a lease');
const question={type:'choice',answer:'Yes',options:['Yes','No']};
assert.equal(evaluateWorldQuestion(question,'No',0).lifeCost,0);
assert.equal(evaluateWorldQuestion(question,'No',1).lifeCost,1);
assert.equal(evaluateWorldQuestion(question,'Yes',1).lifeCost,0);
assert.notEqual(worldQuestionHelp(question,1),'Yes');
assert.equal(worldQuestionHelp(question,3),'Yes');
assert.equal(replyToLandlord(newRentalDialogue(),'viewing',' ').dialogue.attempts,0);
assert.equal(replyToLandlord(newRentalDialogue(),'viewing','Could I arrange a viewing please?').accepted,true);
assert.equal(replyToLandlord(newRentalDialogue(),'viewing','No, I cannot arrange a viewing.').accepted,false);
console.log('Dialogue tests passed: all prepared replies, clarification without life loss, decline, price agreement, repair, both viewing times, progressive help and replay history.');
