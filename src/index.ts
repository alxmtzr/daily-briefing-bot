export const main = (): void => {
  console.log("Daily Briefing Bot started.");
};

// istanbul ignore next
if (require.main === module) {
  main();
}
