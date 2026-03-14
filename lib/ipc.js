/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */
divert(-1)

define(HANDSHAKE, 0x0)
define(FRAME,     0x1)

define(RESET, 0)
define(OP,    1)
define(DATA,  2)

define(XDG_RUNTIME_DIR_FLATPAK, `${XDG_RUNTIME_DIR}/app/com.discordapp.Discord`)
define(XDG_RUNTIME_DIR_SNAP,    `${XDG_RUNTIME_DIR}/snap.discord`)

divert(0)dnl

import { randomUUID } from 'node:crypto'
import { connect } from 'node:net'
import { platform, env, pid } from 'node:process'
import { StringDecoder } from 'node:string_decoder'

const { XDG_RUNTIME_DIR, TMPDIR } = env

async function try_connect(path)
{
	let release
	const barrier = new Promise(resolve => release = resolve)
	const socket = connect(path)

	socket.once('connect', release)
	socket.once('error', release)

	if (!(await barrier instanceof Error)) {
		socket.removeListener('error', release)
		return socket
	}

	socket.destroy()
}

async function find_socket(prefix)
{
	let socket
	let i

	for (i = 0; i < 10; i++) {
		socket = await try_connect(`${prefix}${i}`)
		if (socket)
			return socket
	}
}

function find_socket_at(dir)
{
	if (dir)
		return find_socket(`${dir}/discord-ipc-`)
}

async function resolve_ipc_socket()
{
	let socket

	switch (platform) {
	case 'win32':
		return find_socket(String.raw`\\.\pipe\discord-ipc-`)
	case 'linux':
		socket = await find_socket_at(XDG_RUNTIME_DIR)
		if (socket)
			break
		socket = await find_socket_at(XDG_RUNTIME_DIR_FLATPAK)
		if (socket)
			break
		socket = await find_socket_at(XDG_RUNTIME_DIR_SNAP)
		if (socket)
			break
	case 'darwin':
		socket = await find_socket_at(TMPDIR)
		if (socket)
			break
	default:
		socket = find_socket_at('/tmp')
	}

	return socket
}

function reset_rx_ctx(rx)
{
	rx.state = RESET
	rx.str = ''

	rx.len = 0
	rx.off = 0

	rx.str_dec.end()
}

export async function ipc_init(ctx)
{
	ctx.socket = await resolve_ipc_socket()
	ctx.rx = {}

	ctx.rx.str_dec = new StringDecoder('utf8')
	reset_rx_ctx(ctx.rx)
}

export function ipc_ready(ctx)
{
	return +(ctx.socket != undefined)
}

function filter_internal(k, v)
{
	if (!k.startsWith('__'))
		return v
}

function encode(op, data)
{
	const str = JSON.stringify(data, filter_internal)
	const len = Buffer.byteLength(str)
	const buf = Buffer.alloc(4 + 4 + len)

	buf.writeInt32LE(op, 0)
	buf.writeInt32LE(len, 4)
	buf.write(str, 8, len)

	return buf
}

function decode(ctx, cb)
{
	const socket = ctx.socket
	const rx = ctx.rx

	let chunk
	let avail
	let want
	let obj

	while (39) {
		switch (rx.state) {
		case RESET:
			chunk = socket.read(4)
			if (!chunk)
				return

			rx.op = chunk.readInt32LE(0)
			rx.state++
		case OP:
			chunk = socket.read(4)
			if (!chunk)
				return

			rx.len = chunk.readInt32LE(0)
			rx.state++
		case DATA:
			avail = socket.readableLength
			if (!avail)
				return

			want = rx.len - rx.off
			chunk = socket.read(Math.min(avail, want))

			rx.off += chunk.length
			rx.str += rx.str_dec.write(chunk)

			if (rx.off != rx.len)
				return

			/* We trust discord */
			obj = JSON.parse(rx.str)

			cb(obj.cmd, obj.evt, obj.data, obj, rx.op, rx.str)
			reset_rx_ctx(rx)
		}
	}
}

export function ipc_start_rx(ctx, cb, cb_data)
{
	const cb_fn = cb.bind(undefined, cb_data)
	const decode_fn = decode.bind(undefined, ctx, cb_fn)

	ctx.socket.on('readable', decode_fn)
}

export function ipc_replace_rx(ctx, cb, cb_data)
{
	ctx.socket.removeAllListeners('readable')
	ipc_start_rx(ctx, cb, cb_data)
}

function ipc_tx(ctx, op, args)
{
	const buf = encode(op, args)

	ctx.socket.write(buf)
}

export function ipc_handshake(ctx, app)
{
	const args = { v: 1, client_id: app }

	ipc_tx(ctx, HANDSHAKE, args)
}

export function ipc_presence(ctx, activity)
{
	const cmd = 'SET_ACTIVITY'
	const args = { pid, activity }
	const nonce = randomUUID()

	ipc_tx(ctx, FRAME, { cmd, args, nonce })
}
