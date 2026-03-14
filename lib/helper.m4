dnl SPDX-License-Identifier: GPL-3.0-or-later
dnl
divert(-1)

define(NOW, Math.floor(Date.now() / 1000))

define(IPC_INIT, [[{}]])
define(RP_INIT,  [[{ asssets: {}, timestamps: {} }]])

divert(0)dnl
