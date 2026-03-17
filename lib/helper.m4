dnl SPDX-License-Identifier: GPL-3.0-or-later
dnl
divert(-1)

define(DEVICON, https://cdn.jsdelivr.net/gh/barroit/devicon@master/icons)

define(NOW, Math.floor(Date.now() / 1000))

define(IPC_INIT, [[{ ignore: 0 }]])
define(RP_INIT,  [[{ assets: {}, timestamps: { start: NOW } }]])

define(BIND, $1.bind(undefined, [[shift($@)]]))

divert(0)dnl
