---
type: project
created: 2026-07-18
updated: 2026-07-18
---

# Technical Decisions

- Component metadata uses SemVer while the toolkit release keeps CalVer.
- `manifest.json` and `manifest.lock.json` must remain synchronized with component frontmatter.
- Arquitetura Multi-Rally: Suporte a sub-salas dentro da mesma sessão de canal de voz (`channelId + subRoomId`), permitindo múltiplos rallies simultâneos e independentes na mesma chamada com áudio e contagem sincronizados por equipe.
