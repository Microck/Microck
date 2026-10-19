# npm download badge

Run `node scripts/update-npm-downloads.mjs` with Node 24 or newer. No install or token is needed.
The GitHub Action runs daily at 08:17 UTC and can also be run manually.

The total includes the full available download history of every public package
currently returned by npm's `maintainer:microck` search, including scoped and
platform-specific packages. Each package counts once. It is a download count,
not a count of distinct users. Packages no longer maintained by this account
will leave the total; newly maintained packages enter with their full history.

Requests run at most once per second, with at most two retries for HTTP 429.
The script starts at each package's creation date, or January 10, 2015, whichever
is later. It queries non-overlapping calendar-year chunks through npm's latest
available day. It recalculates history on each run so npm corrections are included.
Any failed request or incomplete response fails the run before either output is
written, leaving the previous badge in place. Fix the reported error and rerun
the workflow to recover.

`assets/npm-downloads.json` records the cutoff date and individual counts.
`assets/npm-downloads.svg` displays their exact sum in the profile README.
The workflow commits only these two generated files when they change.
The [shared badge renderer](github-downloads.md#appearance) keeps its appearance
consistent with the GitHub badges and Spotify widget.

Sources: [npm downloads API](https://github.com/npm/registry/blob/main/docs/download-counts.md)
and [registry search API](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#get-v1search).
