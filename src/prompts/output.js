import { select } from '@inquirer/prompts';

// Ask the user how they want to output the generated configs.
// Returns 'write' | 'print' | 'dry-run'
export async function selectOutputMode(cliMode) {
  // If CLI flags already specified a mode, use that
  if (cliMode) return cliMode;

  const mode = await select({
    message: 'How do you want to output the configs?',
    choices: [
      { name: 'Write to disk (with backup)', value: 'write' },
      { name: 'Print to terminal (for copy-paste)', value: 'print' },
      { name: 'Dry run (show what would be written)', value: 'dry-run' },
    ],
  });
  return mode;
}
