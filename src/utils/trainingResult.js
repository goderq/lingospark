export function trainingPassed(score, total) {
  return Number.isInteger(score) && Number.isInteger(total) && total > 0 && score >= 0 && score <= total && score / total >= 0.8;
}
