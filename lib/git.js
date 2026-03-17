/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2025 Jiamu Sun <barroit@linux.com>
 */

import { join } from 'node:path'
import { existsSync } from 'node:fs'

import { die, warn } from './mesg.js'
import exec from './exec.js'
import { str_split_lines } from './string.js'

export function git_ensure_exec()
{
	const [ _, __, exit ] = exec('git version')
	
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
	remotes = str_split_lines(remote)

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

function git_dir()
{
	const [ dir ] = exec('git rev-parse --git-dir')

	return dir
}

export function git_in_rebase()
{
	const dir = git_dir()

	return existsSync(`${dir}/rebase-merge`) ||
	       existsSync(`${dir}/rebase-apply/rebasing`)
}
