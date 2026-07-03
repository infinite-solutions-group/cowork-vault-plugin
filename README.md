# Cowork Studio — plugin marketplace

Public distribution for the **Cowork Studio** plugin: a `bootstrap-vault` skill
that scaffolds a [Cowork](https://claude.com/blog/cowork-plugins) vault —
governance docs, normalized skills, a memory layout, scheduled-task guidance,
inbox/outbox routing — and installs a 7-skill starter pack so you have something
working in the first thirty minutes.

> This repo is a **distribution mirror**. Development happens in the private
> monorepo; the plugin here is published from it. Source & issues:
> the converter site links back for feedback.

## Install

### Claude Code

```shell
/plugin marketplace add infinite-solutions-group/cowork-studio-plugin
/plugin install cowork-studio@infinite-solutions
```

Then run `/reload-plugins`. The plugin's skills are namespaced under
`cowork-studio` (for example `/cowork-studio:bootstrap-vault`).

### Cowork · Claude Desktop

Download the plugin and upload it:

- **[Download `cowork-studio.zip`](https://cowork-studio-web.vercel.app/cowork-studio.zip)**
- Claude Desktop → **Cowork** → **Customize** → **Upload custom plugin**

Or, from Claude Code, load it for a single session without installing:

```shell
claude --plugin-url https://cowork-studio-web.vercel.app/cowork-studio.zip
```

## What's in here

```
.
├── .claude-plugin/marketplace.json   # catalog (this marketplace lists the plugin below)
└── plugins/
    └── cowork-studio/                # the plugin
        ├── .claude-plugin/plugin.json
        └── skills/…
```

## License

[Apache-2.0](./LICENSE) © 2026 Michael Ludden
