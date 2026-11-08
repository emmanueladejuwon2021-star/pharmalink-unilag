import '@testing-library/jest-dom';
import { configure, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

configure({ asyncUtilTimeout: 15000 });

afterEach(() => {
  cleanup();
});
