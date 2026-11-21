/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import '../../testUtils/setupDom';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { act, renderHook } from '@testing-library/react';
import { routerMock } from '../../testUtils/docusaurusMocks/router';
import { usePackageWorkspaceState } from './usePackageWorkspaceState';

const validPackages = [
  '@backstage/plugin-catalog',
  '@backstage/plugin-catalog-backend',
];

function location(search = '', hash = '') {
  return {
    pathname: '/plugins/backstage-software-catalog',
    search,
    hash,
  };
}

describe('usePackageWorkspaceState', () => {
  beforeEach(() => {
    routerMock.reset(location());
  });

  it('resolves the package and tab from the URL, falling back to the default package', () => {
    const resolve = (search: string) => {
      routerMock.location = location(search);
      const { result } = renderHook(() =>
        usePackageWorkspaceState(validPackages, '@backstage/plugin-catalog'),
      );
      return [result.current.selectedPackageName, result.current.selectedTab];
    };

    assert.deepEqual(resolve(''), ['@backstage/plugin-catalog', 'readme']);
    // The tab is honoured even without a package.
    assert.deepEqual(resolve('?tab=install'), [
      '@backstage/plugin-catalog',
      'install',
    ]);
    assert.deepEqual(resolve('?package=unknown&tab=install'), [
      '@backstage/plugin-catalog',
      'install',
    ]);
    assert.deepEqual(resolve('?package=unknown&tab=unknown'), [
      '@backstage/plugin-catalog',
      'readme',
    ]);
    assert.deepEqual(
      resolve('?package=%40backstage%2Fplugin-catalog&tab=unknown'),
      ['@backstage/plugin-catalog', 'readme'],
    );
    assert.deepEqual(
      resolve('?package=%40backstage%2Fplugin-catalog-backend&tab=install'),
      ['@backstage/plugin-catalog-backend', 'install'],
    );
  });

  it('pushes package changes, replaces tab changes and keeps the URL hash', () => {
    routerMock.location = location('', '#details');
    const { result, rerender } = renderHook(() =>
      usePackageWorkspaceState(validPackages, '@backstage/plugin-catalog'),
    );

    act(() =>
      result.current.selectPackage('@backstage/plugin-catalog-backend'),
    );
    assert.equal(routerMock.replace.mock.callCount(), 0);
    assert.deepEqual(routerMock.push.mock.calls.at(-1)?.arguments, [
      {
        pathname: '/plugins/backstage-software-catalog',
        search: '?package=%40backstage%2Fplugin-catalog-backend&tab=readme',
        hash: '#details',
      },
    ]);

    routerMock.location = location(
      '?package=%40backstage%2Fplugin-catalog&tab=readme',
      '#details',
    );
    rerender();
    act(() => result.current.selectTab('install'));
    assert.equal(routerMock.push.mock.callCount(), 1);
    assert.deepEqual(routerMock.replace.mock.calls.at(-1)?.arguments, [
      {
        pathname: '/plugins/backstage-software-catalog',
        search: '?package=%40backstage%2Fplugin-catalog&tab=install',
        hash: '#details',
      },
    ]);
  });
});
