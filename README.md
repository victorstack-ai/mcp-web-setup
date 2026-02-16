# mcp-web-setup

Interactive CLI to configure MCP (Model Context Protocol) servers for web development across **Claude Code**, **Codex CLI**, and **Gemini CLI**.

## Quick Start

```bash
npx mcp-web-setup
```

## What It Does

Configures a curated suite of 18 MCP servers across three AI coding tools with a single interactive setup. Handles the config format differences between Claude (JSON), Codex (TOML), and Gemini (JSON) automatically.

## Included Servers

| Category | Servers |
|----------|---------|
| Design | figma-desktop, figma-developer |
| Database | mysql |
| Browser / Testing | playwright, chrome-devtools, browser-tools |
| Performance / SEO | lighthouse, pagespeed |
| Accessibility | a11y |
| CSS / Styling | css, tailwindcss |
| Linting | eslint |
| Images | image-optimizer |
| Components | storybook |
| Utilities | sequential-thinking |
| Project Tools | atlassian, bitbucket, gtm |

## CLI Options

```
npx mcp-web-setup              # Interactive setup
npx mcp-web-setup --dry-run    # Show configs without writing
npx mcp-web-setup --print      # Print configs for copy-paste
npx mcp-web-setup --help       # Show help
```

## Interactive Flow

1. Select AI tools (Claude Code, Codex CLI, Gemini CLI)
2. Select server categories
3. Enter credentials (Figma token, MySQL password, etc.)
4. Configure multi-workspace Bitbucket/Atlassian accounts
5. Add CMS templates (WordPress/Drupal via Lando)
6. Choose output mode (write to disk, print, or dry-run)

## Config Files

| Tool | Global Config | Project Config |
|------|--------------|----------------|
| Claude Code | `~/.claude.json` | `.mcp.json` |
| Codex CLI | `~/.codex/config.toml` | `.codex/config.toml` |
| Gemini CLI | `~/.gemini/settings.json` | `.gemini/settings.json` |

## Merge Behavior

- Existing config files are backed up before writing (`.backup-<timestamp>`)
- Only the MCP servers section is merged - all other settings are preserved
- Existing servers you already have configured are kept

## Multi-Workspace Support

If you work with multiple Bitbucket/Atlassian accounts (different clients/orgs), the tool creates per-directory project configs with workspace-specific credentials.

## CMS Templates

For WordPress or Drupal projects using Lando, the tool generates a project-level MySQL MCP config pre-filled with Lando's default database credentials.

## License

MIT
