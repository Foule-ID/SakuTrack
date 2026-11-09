// Display-name helpers for accounts created through Google or Apple.
export const displayNameOf = (user) => { const m = user?.user_metadata || {}; return m.name || m.full_name || m.display_name || ''; };
export const socialProviderOf = (user) => {
  const list = user?.app_metadata?.providers || (user?.app_metadata?.provider ? [user.app_metadata.provider] : []);
  return list.find((p) => p === 'google' || p === 'apple') || null;
};
const skipKey = (user) => 'saku.skipName.' + user.id;
export const skippedNamePrompt = (user) => { try { return !!localStorage.getItem(skipKey(user)); } catch { return false; } };
export const skipNamePrompt = (user) => { try { localStorage.setItem(skipKey(user), '1'); } catch { /* ignore */ } };
// Only social sign-ins that returned no name are asked for one; email sign-ups keep their optional name field unchanged.
export const needsNamePrompt = (user) => !!user && !!socialProviderOf(user) && !displayNameOf(user) && !skippedNamePrompt(user);
