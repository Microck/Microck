# GitHub release download badge

Run `node scripts/update-github-downloads.mjs` with Node 24 and the GitHub CLI
installed. Authenticate `gh` locally; Actions uses its built-in `GH_TOKEN`.
The workflow runs daily at 08:47 UTC and supports manual runs.

The total covers uploaded release assets in all public non-fork repositories
owned by Microck, including archived repositories and prereleases. Draft releases
and disabled repositories are excluded. The JSON report lists disabled repositories.
The metadata filter excludes filenames containing `checksum`, `sha256`, `sha512`,
`.sbom.`, or `.intoto.`, and filenames ending in `.sig` or `.asc`, ignoring case.
Other uploaded assets count, including archives and source bundles.
GitHub's automatically generated source archives have no asset counters and do
not enter the total. Deleted releases and assets cannot contribute historical counts.

The script paginates repositories and releases and recalculates every count.
Any request failure stops the run before writing either output. Fix the reported
error and rerun the workflow; the existing badge remains in place meanwhile.

`assets/github-downloads.json` records each repository's included and excluded
downloads, the total, and the date checked. `assets/github-downloads.svg` displays
the total beside the npm badge. The workflow commits only these generated files.
These are download events, not distinct users, and may overlap other platforms.

Source: [GitHub release asset API](https://docs.github.com/en/rest/releases/assets).
