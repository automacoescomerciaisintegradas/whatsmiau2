---
description: Reset node_modules e reinstala dependência
---

/ turbo-all
1. Delete node_modules
·· · bash
rm - rf node_modules
2. Delete lock files
·· · bash
rm -f package-lock. json yarn. lock pnpm-lock. yaml
3. Limpe cache
.. . bash
nom cache clean -force
4. Reinstale
" bash
nom install
5. Confirme que instalou sem erros