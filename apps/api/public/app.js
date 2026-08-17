/*
 * Client for the SMM API.
 *
 * Plain modules, no framework and no build step. The whole surface is a handful
 * of forms over a JSON API, and a toolchain would cost more to maintain than it
 * saves. It also keeps the page compatible with the strict content security
 * policy the server sets, which forbids inline script.
 */

const $ = (id) => document.getElementById(id);

/** Bluesky's limit. Shown live so nobody discovers it after scheduling. */
const BLUESKY_LIMIT = 300;

/** Counts user-perceived characters, so an emoji is one and not two. */
const segmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

function countCharacters(text) {
  if (segmenter === null) return [...text].length;
  let n = 0;
  for (const _ of segmenter.segment(text)) n += 1;
  return n;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
    // The session is an HttpOnly cookie, so it has to be sent explicitly.
    credentials: 'same-origin',
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message ?? body.error ?? `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = body;
    throw error;
  }
  return body;
}

function show(element, visible) {
  element.hidden = !visible;
}

function setError(element, message) {
  element.textContent = message ?? '';
  show(element, Boolean(message));
}

/**
 * Submit handler that disables the button while in flight.
 *
 * Double submission on a slow connection is otherwise routine, and on the
 * compose form that means two identical posts.
 */
function onSubmit(form, handler) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type=submit]');
    const label = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Working…';
    }
    try {
      await handler();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = label;
      }
    }
  });
}

// --- authentication ---------------------------------------------------------

function selectTab(which) {
  const signin = which === 'signin';
  $('tab-signin').setAttribute('aria-selected', String(signin));
  $('tab-signup').setAttribute('aria-selected', String(!signin));
  show($('form-signin'), signin);
  show($('form-signup'), !signin);
  setError($('auth-error'), '');
}

$('tab-signin').addEventListener('click', () => selectTab('signin'));
$('tab-signup').addEventListener('click', () => selectTab('signup'));

onSubmit($('form-signin'), async () => {
  setError($('auth-error'), '');
  try {
    await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('signin-email').value,
        password: $('signin-password').value,
      }),
    });
    await start();
  } catch (error) {
    setError($('auth-error'), error.message);
  }
});

onSubmit($('form-signup'), async () => {
  setError($('auth-error'), '');
  try {
    await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: $('signup-name').value,
        organizationName: $('signup-org').value,
        email: $('signup-email').value,
        password: $('signup-password').value,
        // Sending the browser's zone means the first brand is created in the
        // user's own timezone rather than in UTC, which is almost never what
        // they meant.
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    await start();
  } catch (error) {
    setError($('auth-error'), error.message);
  }
});

$('signout').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  location.reload();
});

// --- connecting an account --------------------------------------------------

/**
 * Render whatever the adapter says it needs.
 *
 * The server returns either a redirect or a list of steps, so the shape of a
 * network's connect flow lives in the adapter rather than here.
 */
async function renderConnectSteps() {
  try {
    const start = await api('/api/networks/bluesky/connect');
    if (start.redirectUrl) {
      $('connect-steps').innerHTML = '';
      location.href = start.redirectUrl;
      return;
    }

    const container = $('connect-steps');
    container.innerHTML = '';
    for (const step of start.instructions ?? []) {
      if (step.kind !== 'external_action') continue;
      const p = document.createElement('p');
      p.textContent = `${step.detail} `;
      if (step.url) {
        const a = document.createElement('a');
        a.href = step.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Open Bluesky settings';
        p.append(a);
      }
      container.append(p);
    }
  } catch {
    // Not fatal: the form below still works without the preamble.
  }
}

onSubmit($('form-connect'), async () => {
  setError($('connect-error'), '');
  try {
    await api('/api/networks/bluesky/connect', {
      method: 'POST',
      body: JSON.stringify({
        profileGroupId: state.profileGroupId,
        // A pasted handle very often carries the @ from a profile page.
        identifier: $('connect-handle').value.trim().replace(/^@/, ''),
        appPassword: $('connect-password').value.trim(),
      }),
    });
    $('connect-password').value = '';
    $('connect').open = false;
    await refresh();
  } catch (error) {
    setError($('connect-error'), error.message);
  }
});

onSubmit($('form-mastodon'), async () => {
  setError($('mastodon-error'), '');
  try {
    // The server decides where to send the user: it registers a client on that
    // instance and mints the state that binds the callback to this workspace.
    const start = await api(
      `/api/networks/mastodon/connect?instance=${encodeURIComponent($('mastodon-instance').value)}` +
        `&profileGroupId=${encodeURIComponent(state.profileGroupId ?? '')}`,
    );
    if (start.redirectUrl) {
      location.href = start.redirectUrl;
      return;
    }
    setError($('mastodon-error'), 'That server did not offer an authorisation page.');
  } catch (error) {
    setError($('mastodon-error'), error.message);
  }
});

/**
 * Report the outcome of a connect that happened via redirect.
 *
 * The callback cannot render a message itself — it has to send the browser
 * somewhere — so the result travels back as a query parameter and is cleared
 * from the URL once shown, to keep it out of history and out of any link the
 * user later copies.
 */
function reportConnectOutcome() {
  const params = new URLSearchParams(location.search);
  const outcome = params.get('connect');
  if (outcome === null) return;

  const reason = params.get('reason');
  const message =
    outcome === 'ok'
      ? null
      : outcome === 'cancelled'
        ? 'Connection cancelled.'
        : `Could not connect that account${reason === null ? '' : ` (${reason.replace(/_/g, ' ')})`}.`;

  if (message !== null) {
    setError($('mastodon-error'), message);
    $('connect-mastodon').open = true;
  }
  history.replaceState({}, '', location.pathname);
}

// --- composing --------------------------------------------------------------

$('compose-body').addEventListener('input', () => {
  const count = countCharacters($('compose-body').value);
  const counter = $('counter');
  counter.textContent = String(count);
  counter.parentElement.classList.toggle('over-limit', count > BLUESKY_LIMIT);
});

onSubmit($('form-compose'), async () => {
  setError($('compose-error'), '');
  show($('compose-ok'), false);

  const targets = [...$('compose-targets').selectedOptions].map((o) => o.value);
  if (targets.length === 0) {
    setError($('compose-error'), 'Choose at least one account.');
    return;
  }

  try {
    const result = await api('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        profileGroupId: state.profileGroupId,
        body: $('compose-body').value,
        socialProfileIds: targets,
        // Sent as a wall clock, never as an instant: the server records the
        // zone alongside it so a timezone rule change stays correctable.
        scheduledLocal: $('compose-when').value.slice(0, 16),
        timezone: $('compose-tz').value,
      }),
    });

    const when = new Date(result.targets[0]?.scheduledAt);
    $('compose-ok').textContent = `Scheduled for ${when.toLocaleString()}.`;
    show($('compose-ok'), true);
    $('compose-body').value = '';
    $('counter').textContent = '0';
    await refresh();
  } catch (error) {
    setError($('compose-error'), error.message);
  }
});

// --- state ------------------------------------------------------------------

const state = { profileGroupId: null };

function renderProfiles(profiles) {
  const list = $('profiles');
  const select = $('compose-targets');
  list.innerHTML = '';
  select.innerHTML = '';

  show($('profiles-empty'), profiles.length === 0);

  for (const profile of profiles) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = profile.handle ?? profile.display_name;
    li.append(name);

    if (profile.status !== 'active') {
      const badge = document.createElement('span');
      badge.className = 'badge failed';
      badge.textContent = profile.status.replace(/_/g, ' ');
      li.append(badge);
    }
    list.append(li);

    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = `${profile.network} — ${profile.handle ?? profile.display_name}`;
    select.append(option);
  }
}

function renderPosts(posts) {
  const body = $('posts');
  body.innerHTML = '';
  show($('posts-empty'), posts.length === 0);
  show($('posts-table'), posts.length > 0);

  for (const post of posts) {
    const row = document.createElement('tr');

    const text = document.createElement('td');
    text.textContent = post.body.length > 80 ? `${post.body.slice(0, 80)}…` : post.body;
    row.append(text);

    const network = document.createElement('td');
    network.textContent = post.network;
    row.append(network);

    const when = document.createElement('td');
    // The local wall clock and its zone are shown rather than a converted
    // instant, because that is what the user actually chose.
    when.textContent = post.scheduled_local
      ? `${String(post.scheduled_local).replace('T', ' ').slice(0, 16)} ${post.scheduled_timezone ?? ''}`
      : '—';
    row.append(when);

    const status = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${post.target_status}`;
    badge.textContent = post.target_status.replace(/_/g, ' ');
    status.append(badge);

    if (post.remote_url) {
      const link = document.createElement('a');
      link.href = post.remote_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = ' view';
      status.append(link);
    }
    // A failure the user can act on is worth more than a red dot.
    if (post.failure_message) {
      const why = document.createElement('div');
      why.className = 'hint';
      why.textContent = post.failure_message;
      status.append(why);
    }
    row.append(status);
    body.append(row);
  }
}

function fillTimezones() {
  const select = $('compose-tz');
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones =
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [local];

  for (const zone of zones) {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone;
    option.selected = zone === local;
    select.append(option);
  }
}

async function refresh() {
  const [{ socialProfiles }, { posts }] = await Promise.all([
    api('/api/social-profiles'),
    api('/api/posts'),
  ]);
  renderProfiles(socialProfiles);
  renderPosts(posts);
}

async function start() {
  try {
    const me = await api('/api/me');
    const { profileGroups } = await api('/api/profile-groups');
    state.profileGroupId = profileGroups[0]?.id ?? null;

    $('who').textContent = me.user.email;
    show($('auth'), false);
    show($('app'), true);

    await renderConnectSteps();
    reportConnectOutcome();
    await refresh();
  } catch (error) {
    if (error.status === 401) {
      show($('app'), false);
      show($('auth'), true);
      selectTab('signin');
      return;
    }
    throw error;
  }
}

fillTimezones();
// Default the schedule field to an hour out, rounded to the next five minutes.
{
  const when = new Date(Date.now() + 3_600_000);
  when.setMinutes(Math.ceil(when.getMinutes() / 5) * 5, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  $('compose-when').value =
    `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}` +
    `T${pad(when.getHours())}:${pad(when.getMinutes())}`;
}

start();
