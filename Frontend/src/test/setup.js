// Vitest setup: importa matchers de jest-dom (toBeInTheDocument, etc.)
// y limpia mocks entre tests automáticamente.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
