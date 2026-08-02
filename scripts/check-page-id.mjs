/** Small assert check for HashRouter page ID grouping. */
import assert from 'node:assert/strict';

function generatePageIdFromLocation(location) {
  const raw = (location.hash || '').replace(/^#/, '') || location.pathname || '/';
  const path = raw.split('?')[0] || '/';
  return path
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:id',
    );
}

assert.equal(
  generatePageIdFromLocation({ hash: '#/unit-admin/view-individual-unit/42' }),
  '/unit-admin/view-individual-unit/:id',
);
assert.equal(
  generatePageIdFromLocation({ hash: '#/kalamela' }),
  '/kalamela',
);
assert.equal(
  generatePageIdFromLocation({
    hash: '#/unit-admin/view-individual-unit/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  }),
  '/unit-admin/view-individual-unit/:id',
);

console.log('check-page-id: ok');
