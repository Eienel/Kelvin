# Submission metadata

`submission.json` follows the INITIATE hackathon schema defined at
<https://docs.initia.xyz/hackathon/submission-requirements.md>.

Three fields are placeholders until the rollup is live:

- `commit_sha` — the 40-char hex of the commit being submitted. Set via
  `git rev-parse HEAD > .initia/.commit && sed -i "s|\"commit_sha\": .*|\"commit_sha\": \"$(cat .initia/.commit)\",|" .initia/submission.json`
  right before submission.
- `deployed_address` — filled from the `forge script Deploy.s.sol`
  broadcast artifact; we submit the **LBFactory** address as the
  canonical deployed entrypoint (the whole system is reachable from it).
- `demo_video_url` — replace `PENDING` with the final YouTube link
  once the video is uploaded.

Schema note: `native_feature` takes a single enum value. Kelvin
implements both **auto-signing** (hero) and **initia-usernames** (on
the leaderboard); we report the hero feature here per the schema's
one-value constraint. The second feature is evidenced in the README
and frontend code.
