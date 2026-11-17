import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { lessons } from '../data/course';
import { getJourney } from '../data/learningJourney';
import { useProgress } from '../store/ProgressContext';
import { shuffleOptions } from '../utils/shuffle';
import { trainingPassed } from '../utils/trainingResult';
import PracticeScreen from './PracticeScreen';
import { PrimaryButton } from '../components/UI';

export default function CourseTestScreen({ topicId, onClose, onComplete }) {
  const { progress, completeLesson, isUnlocked } = useProgress();
  const lesson = lessons.find(item => item.id === topicId);
  const journey = getJourney(topicId);
  const [seed] = useState(Date.now);
  const deck = useMemo(() => lesson ? shuffleOptions(lesson.exercises, seed) : [], [lesson, seed]);
  const prepared = journey?.stages.every(stage => progress.journeys?.[topicId]?.stages?.[stage.id]?.completedAt);
  if (!lesson || !isUnlocked(lesson) || !prepared && !progress.completed.includes(topicId)) return <View style={{ padding: 24, gap: 20 }}><Text style={{ color: 'white', fontSize: 22 }}>Сначала заверши учебные этапы темы</Text><PrimaryButton title="К теме" onPress={onClose} /></View>;
  return <PracticeScreen title={`Самопроверка: ${lesson.title}`} sessionKey={`course-test-${topicId}`} presetDeck={deck} onClose={onClose} onComplete={(score, total) => {
    onComplete?.(score, total);
    if (!trainingPassed(score, total)) return;
    const accuracy = Math.round(score / total * 100);
    completeLesson(lesson, { accuracy, correct: score, total, stars: accuracy >= 90 ? 3 : 2, source: 'course-test' });
  }} />;
}
