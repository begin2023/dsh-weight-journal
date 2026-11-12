# dsh-weight-journal

A daily weight journal for the DeepSeek Harness Web GUI: one page, one reading a
day, one honest trend.

## Where it lives

A scale icon sits in the left sidebar's panel row (above Settings). It opens the
**Weight journal** main-panel page, beside Plugins and Schedules.

## The reminder capsule

While the app is open, a small capsule holds the centre of the conversation title
row — the strip that stays visible on every panel — and cycles every 5.4 seconds
through one sentence in eight languages, starting in the language the app is set
to. Clicking it selects the journal, so the page has a second entrance.

It reads the journal before painting, so it states today truthfully: the day's
weight once recorded, with the trend mark inside turning accent and its end dot
filling in, or "nothing yet" before that. It registers into the frame's
`shell.overlay` seat, a whole-app layer that is click-through by default; the
capsule opts back into pointer events for its own 30-pixel row only. Being
centred, it stays clear of the session title on the left and the utilities on the
right until the window is narrow enough for the three to meet.

## What the page does

- **Record** — type today's weight (or use `−` / `+` in 0.1 steps), pick another
  day from the date field, add an optional note, and save. One reading per
  calendar day: saving a day that already exists replaces it.
- **Read the trend** — a monotone-cubic curve that never overshoots a reading,
  over a 7-day, 30-day, 90-day, or all-time window, with the entries' 7-reading
  mean, a dashed goal line, and a hover crosshair showing that day's weight and
  its change against the previous reading.
- **See the movement** — weekly mean weight compared with the previous week as a
  diverging bar chart, beside the recent entries.
- **Edit safely** — clicking a row loads it back into the form; deleting asks for
  an inline confirmation instead of acting on one click.
- **Personalise** — under Settings, a height adds BMI to the header and a goal
  weight adds the progress track.

## What the model can do

The same journal is reachable through the `weight_journal` tool (`record`,
`list`, `delete`). Both callers share one implementation, so a weight stated in a
conversation lands in the page the moment it refreshes.

## Where the data goes

`$DSH_HOME/storages/weight-journal.json`, written atomically. The plugin makes no
network request and reads nothing else. Disabling the plugin hides the page and
the tool; the file stays where it is.

## Layout of this bundle

| File | Role |
|---|---|
| `index.js` | Host half: the JSON store, two `ctx.connection.fetch` routes, the tool |
| `client.js` | Browser half: the page, the chart, the reminder capsule, the sidebar icon, the copy |
| `cordis.patch.yml` | Inserts the Host row |
| `locale/*.json` | Plugin Manager title, description, detail document |
| `docs/` | The detail document and its one feature image |
| `icon.svg` | Plugin Manager icon |

## Install and update

The bundle is a plain package directory; DSH installs it by linking it into the
profile, so **where the directory lives is part of the installation**.

- **Install:** in the Web GUI open Plugins and use *Add plugin* to pick this
  directory, or call the `plugin_manager` tool with
  `action: install_bundle` and this absolute path.
- **Update:** edit the files here. The browser half is re-read from this
  directory, so a page refresh picks it up; a change to `index.js` (the Host
  half) needs the app restarted.
- **Move or rename the directory:** the profile holds an absolute `link:` path,
  so a move leaves a dangling link. Re-install as above, or run
  `plugin_manager` `remove_bundle` and then `install_bundle` with the new path.

## Notes on the UI

The page composes only from the host's `--dsw-alias-*` and `--dsw-radius-*`
theme tokens, so it follows light, dark, and every shipped theme without a local
palette. It imports no Harness Client package: React arrives from the browser
module table and every control is written here.
