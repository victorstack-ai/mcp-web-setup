import chalk from 'chalk';
import { checkbox } from '@inquirer/prompts';

export function printBanner() {
  console.log('');
  console.log(chalk.bold.cyan('  mcp-web-setup'));
  console.log(chalk.dim('  Configure MCP servers for web development'));
  console.log(chalk.dim('  Supports: Claude Code, Codex CLI, Gemini CLI'));
  console.log('');
}

export async function selectTools() {
  const tools = await checkbox({
    message: 'Which AI coding tools do you use?',
    choices: [
      { name: 'Claude Code', value: 'claude', checked: true },
      { name: 'Codex CLI', value: 'codex', checked: true },
      { name: 'Gemini CLI', value: 'gemini', checked: true },
    ],
    required: true,
  });
  return tools;
}
