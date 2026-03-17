dnl SPDX-License-Identifier: GPL-3.0-or-later
dnl
divert(-1)

define(JSDELIVR, https://cdn.jsdelivr.net)
define(MATERIALICON_REPO, JSDELIVR/gh/barroit/vscode-material-icon-theme@master)
define(MATERIALICON, MATERIALICON_REPO/icons)

define(NOW, Math.floor(Date.now() / 1000))

define(IPC_INIT, [[{ ignore: 0 }]])
define(RP_INIT,  [[{ assets: {}, timestamps: { start: NOW } }]])

define(BIND, $1.bind(undefined, [[shift($@)]]))

divert(0)dnl
