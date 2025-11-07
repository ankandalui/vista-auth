/**
 * Simple prompts implementation for CLI
 */

const readline = require('readline');

async function prompts(questions) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answers = {};

  for (const question of questions) {
    if (question.type === 'select') {
      console.log(`\n${question.message}`);
      question.choices.forEach((choice, i) => {
        console.log(`  ${i + 1}. ${choice.title}`);
      });

      const answer = await new Promise((resolve) => {
        rl.question('\nEnter number: ', (input) => {
          const index = parseInt(input) - 1;
          resolve(question.choices[index]?.value || question.choices[0].value);
        });
      });

      answers[question.name] = answer;
    } else if (question.type === 'multiselect') {
      console.log(`\n${question.message} (comma-separated numbers)`);
      question.choices.forEach((choice, i) => {
        const selected = choice.selected ? ' (selected)' : '';
        console.log(`  ${i + 1}. ${choice.title}${selected}`);
      });

      const answer = await new Promise((resolve) => {
        rl.question('\nEnter numbers (e.g., 1,3,4) or press Enter for defaults: ', (input) => {
          if (!input.trim()) {
            resolve(question.choices.filter(c => c.selected).map(c => c.value));
          } else {
            const indices = input.split(',').map(s => parseInt(s.trim()) - 1);
            resolve(indices.map(i => question.choices[i]?.value).filter(Boolean));
          }
        });
      });

      answers[question.name] = answer;
    }
  }

  rl.close();
  return answers;
}

module.exports = { prompts };
