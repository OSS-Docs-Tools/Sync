// node dist/index.js pull  asda/asdasd 111 --from-cwd ./fixtures/target --to-cwd fixtures/source
// node dist/index.js delete-translations  asda/asdasd 111 --from-cwd ./fixtures/target --to-cwd fixtures/source

import { readFileSync, readdirSync } from "fs"
import { deleteLocaleFiles, moveLocaleFoldersIn } from "../util/setupFolders"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import { ghRepresentationForPath } from "../util/refForPath"
import { getGHTar } from "../util/getGHTar"

export const setup = async (opts: { target: string; toCwd: string; fromCwd?: string }) => {
  const ghRep = ghRepresentationForPath(opts.target)

  const cachedir: string = require("cachedir")("oss-doc-sync")
  const [user, repo] = ghRep.repoSlug!.split("/")
  let localCopy = opts.fromCwd
  const toDir = opts.toCwd

  // Grab a copy of the other repo, and pull in the files
  if (!localCopy) {
    if (!existsSync(cachedir)) mkdirSync(cachedir, { recursive: true })
    if (!existsSync(join(cachedir, user))) mkdirSync(join(cachedir, user))

    await getGHTar({
      user,
      repo,
      branch: ghRep.branch,
      to: join(cachedir, user, repo),
    })

    const unzipped = join(cachedir, user, repo)
    localCopy = join(unzipped, readdirSync(unzipped).find(p => !p.startsWith("."))!)
  }

  const localizeJSONPath = join(localCopy, "localize.json")
  if (!existsSync(localizeJSONPath)) {
    throw new Error(
      `There isn't a localize.json file in the root of this: ${user}/${repo}#${ghRep.branch} (locally found at ${localizeJSONPath})`
    )
  }

  const settings = JSON.parse(readFileSync(localizeJSONPath, "utf8"))
  return { toDir, localCopy, settings }
}


export const rmCommand = async (opts: { target: string; toCwd: string; fromCwd?: string }) => {
  const {toDir, localCopy, settings } = await setup(opts)
  deleteLocaleFiles(toDir, localCopy, settings)
}


export const pullCommand = async (opts: { target: string; toCwd: string; fromCwd?: string }) => {
  const {toDir, localCopy, settings } = await setup(opts)
  moveLocaleFoldersIn(toDir, localCopy, settings)
}
