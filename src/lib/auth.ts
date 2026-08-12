// Auth is not handled in this repo. `turfifa-server` (Express + JWT + bcrypt)
// owns registration, login, token issuance, and password reset — see
// Turfifa-PRD.md §11. This frontend only calls those endpoints via
// `lib/api-client.ts` and holds the resulting access token in `lib/auth-store.ts`.
