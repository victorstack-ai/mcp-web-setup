import { checkbox } from '@inquirer/prompts';
import { categories } from '../servers/categories.js';

export async function selectCategories() {
  const selected = await checkbox({
    message: 'Which server categories do you want to install?',
    choices: categories.map((cat) => ({
      name: cat.label,
      value: cat.id,
      checked: cat.id !== 'project', // project tools unchecked by default
    })),
    required: true,
  });
  return selected;
}
