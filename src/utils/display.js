import chalk from 'chalk';
import { stringify } from 'smol-toml';

export function printSection(title, content) {
  console.log('');
  console.log(chalk.bold.cyan(`--- ${title} ---`));
  console.log(content);
}

export function displayJSONConfig(title, filePath, data) {
  printSection(`${title} (${filePath})`, JSON.stringify(data, null, 2));
}

export function displayTOMLConfig(title, filePath, tomlText) {
  printSection(`${title} (${filePath})`, tomlText);
}

export function displayProjectConfigs(title, projectConfigs) {
  for (const { dir, tool, filePath, data, format } of projectConfigs) {
    const label = `${title} - ${tool} project config for ${dir}`;
    if (format === 'toml') {
      displayTOMLConfig(label, filePath, data);
    } else {
      displayJSONConfig(label, filePath, data);
    }
  }
}

export function printSummary(results) {
  console.log('');
  console.log(chalk.bold.green('Done! Files written:'));
  for (const r of results) {
    if (r.backupPath) {
      console.log(`  ${chalk.dim('backup:')} ${r.backupPath}`);
    }
    console.log(`  ${chalk.white(r.filePath)}`);
  }
}
