import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { printBanner, selectTools } from './prompts/welcome.js';
import { selectCategories } from './prompts/categories.js';
import { collectCredentials } from './prompts/credentials.js';
import { collectWorkspaces } from './prompts/accounts.js';
import { collectCMSTemplates } from './prompts/cms.js';
import { selectOutputMode } from './prompts/output.js';
import { servers } from './servers/definitions.js';
import { categories } from './servers/categories.js';
import { writeAll, buildAll, displayAll } from './writers/index.js';
import { printSummary } from './utils/display.js';

export async function run() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('dry-run', {
      type: 'boolean',
      description: 'Show what would be written without writing',
    })
    .option('print', {
      type: 'boolean',
      description: 'Print generated configs to terminal',
    })
    .help()
    .alias('h', 'help')
    .parse();

  // Determine CLI-specified output mode
  let cliMode = null;
  if (argv.dryRun) cliMode = 'dry-run';
  else if (argv.print) cliMode = 'print';

  printBanner();

  // 1. Select AI tools
  const tools = await selectTools();
  if (tools.length === 0) {
    console.log(chalk.yellow('No tools selected. Exiting.'));
    return;
  }

  // 2. Select server categories
  const selectedCategoryIds = await selectCategories();
  if (selectedCategoryIds.length === 0) {
    console.log(chalk.yellow('No categories selected. Exiting.'));
    return;
  }

  // 3. Resolve category IDs to server definitions
  const selectedServerNames = new Set();
  for (const catId of selectedCategoryIds) {
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      for (const name of cat.servers) {
        selectedServerNames.add(name);
      }
    }
  }

  const selectedServers = servers.filter((s) => selectedServerNames.has(s.name));
  const globalServers = selectedServers.filter((s) => s.scope === 'global');
  const projectServers = selectedServers.filter((s) => s.scope === 'project');

  // 4. Collect credentials for global servers
  const credentialValues = await collectCredentials(globalServers);

  // 5. Multi-workspace setup (if project tools selected)
  const workspaces = await collectWorkspaces(projectServers);

  // 6. CMS templates
  const cmsTemplates = await collectCMSTemplates();

  // 7. Output mode
  const mode = await selectOutputMode(cliMode);

  // 8. Execute
  if (mode === 'write') {
    console.log('');
    console.log(chalk.dim('  Writing configs...'));
    const results = await writeAll(tools, globalServers, credentialValues, workspaces, cmsTemplates, projectServers);
    printSummary(results);
  } else {
    // print or dry-run
    const configs = await buildAll(tools, globalServers, credentialValues, workspaces, cmsTemplates, projectServers);
    if (mode === 'dry-run') {
      console.log('');
      console.log(chalk.bold.yellow('  DRY RUN - no files will be written'));
    }
    displayAll(configs);
  }

  console.log('');
}
