# Cowork Vault — plugin marketplace

Public distribution for the **Cowork Vault** plugin: a `bootstrap-vault` skill
that scaffolds a [Cowork](https://claude.com/blog/cowork-plugins) vault —
governance docs, normalized skills, a memory layout, scheduled-task guidance,
inbox/outbox routing — and installs a 7-skill starter pack so you have something
working in the first thirty minutes. An optional **realtor-pack** adds three
real-estate transaction skills (intake, briefing, emailer).

> This repo is a **distribution mirror**. Development happens in the private
> monorepo; the plugin here is published from it. Source & issues:
> the converter site links back for feedback.

## Install

### Claude Code

```shell
/plugin marketplace add infinite-solutions-group/cowork-vault-plugin
/plugin install cowork-vault@infinite-solutions
```

Then run `/reload-plugins`. The plugin's skills are namespaced under
`cowork-vault` (for example `/cowork-vault:bootstrap-vault`).

> Upgrading from the old `cowork-studio` plugin? Remove it first —
> `/plugin uninstall cowork-studio@infinite-solutions` and
> `/plugin marketplace remove cowork-studio-plugin` — then add the marketplace
> above. The plugin name changed from `cowork-studio` to `cowork-vault`.

### Cowork · Claude Desktop

Download the plugin and upload it:

- **[Download `cowork-vault.zip`](https://cowork-studio-web.vercel.app/cowork-vault.zip)**
- Claude Desktop → **Cowork** → **Customize** → **Upload custom plugin**

Or, from Claude Code, load it for a single session without installing:

```shell
claude --plugin-url https://cowork-studio-web.vercel.app/cowork-vault.zip
```

## What's in here

```
.
├── .claude-plugin/marketplace.json   # catalog (this marketplace lists the plugin below)
└── plugins/
    └── cowork-vault/                 # the plugin
        ├── .claude-plugin/plugin.json
        └── skills/…
```

## License

[Apache-2.0](./LICENSE) © 2026 Michael Ludden
