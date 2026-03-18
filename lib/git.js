/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2025 Jiamu Sun <barroit@linux.com>
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

import { die, warn } from './mesg.js'
import exec from './exec.js'

function read_file(path)
{
	let str

	try {
		str = readFileSync(path, 'utf8')
	} catch {
		return
	}

	return str.trimEnd()
}

export function git_ensure_exec()
{
	const [ _, __, exit ] = exec('git version', cwd())
	
	if (exit)
		die('git is missing in PATH')
}

export function git_inside_worktree()
{
	const [ _, __, exit ] = exec('git rev-parse --is-inside-work-tree')

	return exit == 0
}

export function git_resolve_remote(branch)
{
	let [ remote ] = exec(`git config get branch.${branch}.remote`)

	if (!remote)
		remote = exec(`git config get branch.${branch}.pushRemote`)[0]

	return remote
}

export function git_guess_remote()
{
	let [ remote ] = exec('git config get remote.pushDefault')
	let remotes

	if (remote)
		return remote

	remote = exec('git remote')[0]
	remotes = remote.split('\n')

	if (remotes.find(str => str == 'origin'))
		return 'origin'

	return remotes[0]
}

export function git_resolve_remote_url(remote)
{
	const [ url ] = exec(`git remote get-url ${remote}`)

	return url
}

export function git_resolve_head()
{
	const [ ref, _, exit ] = exec('git symbolic-ref HEAD')

	if (!exit)
		return ref
}

export function git_verify_ref(ref)
{
	const [ _, __, exit ] = exec(`git show-ref --verify ${ref}`)

	return exit == 0
}

export function git_dir()
{
	const [ dir ] = exec('git rev-parse --absolute-git-dir')

	return dir
}

export function git_rebase_backend(git)
{
	if (existsSync(`${git}/rebase-merge/msgnum`) &&
	    existsSync(`${git}/rebase-merge/end`))
		return GIT_REBASE_MERGE
	else if (existsSync(`${git}/rebase-apply/rebasing/next`) &&
		 existsSync(`${git}/rebase-apply/rebasing/last`))
		return GIT_REBASE_APPLY
}

export function git_rebase_step_merge(git)
{
	let msgnum = read_file(`${git}/rebase-merge/msgnum`)
	let end = read_file(`${git}/rebase-merge/end`)

	msgnum = Number(msgnum)
	end = Number(end)

	return [ msgnum, end ]
}

export function git_rebase_step_apply(git)
{
	let next = read_file(`${git}/rebase-apply/next`)
	let last = read_file(`${git}/rebase-apply/last`)

	next = Number(next)
	last = Number(last)

	return [ next, last ]
}
