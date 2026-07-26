import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Pagination } from '../Pagination';

afterEach(() => {
  cleanup();
});

function renderPagination(props) {
  const onPageChange = props.onPageChange ?? vi.fn();
  const utils = render(
    <Pagination
      currentPage={props.currentPage ?? 1}
      totalPages={props.totalPages}
      totalItems={props.totalItems}
      pageSize={props.pageSize ?? 20}
      onPageChange={onPageChange}
      siblingCount={props.siblingCount}
    />
  );
  return { ...utils, onPageChange };
}

describe('Pagination', () => {
  it('muestra el indicador "Mostrando 1-20 de 50" con 50 items y pageSize 20', () => {
    renderPagination({ currentPage: 1, totalPages: 3, totalItems: 50, pageSize: 20 });

    expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
    expect(screen.getByText('1-20')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('click en "Siguiente" llama a onPageChange con la página siguiente', () => {
    const { onPageChange } = renderPagination({
      currentPage: 2,
      totalPages: 5,
      totalItems: 100,
      pageSize: 20,
    });

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('botón "Anterior" está disabled en la página 1', () => {
    renderPagination({ currentPage: 1, totalPages: 5, totalItems: 100, pageSize: 20 });

    const prevBtn = screen.getByRole('button', { name: /página anterior/i });
    expect(prevBtn).toBeDisabled();
  });

  it('botón "Siguiente" está disabled en la última página', () => {
    renderPagination({ currentPage: 5, totalPages: 5, totalItems: 100, pageSize: 20 });

    const nextBtn = screen.getByRole('button', { name: /página siguiente/i });
    expect(nextBtn).toBeDisabled();
  });

  it('muestra "Sin resultados" cuando totalItems es 0', () => {
    renderPagination({ currentPage: 1, totalPages: 0, totalItems: 0, pageSize: 20 });

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('con 1 página exacta (15 items) solo renderiza el indicador, sin flechas', () => {
    renderPagination({ currentPage: 1, totalPages: 1, totalItems: 15, pageSize: 20 });

    // Branch de totalPages <= 1: indicador compacto "Mostrando N de N" (sin rango).
    expect(screen.getByText(/Mostrando 15 de 15/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /página anterior/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /página siguiente/i })).not.toBeInTheDocument();
  });

  it('click en un número de página llama a onPageChange con ese número', () => {
    const { onPageChange } = renderPagination({
      currentPage: 1,
      totalPages: 5,
      totalItems: 100,
      pageSize: 20,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('muestra elipsis cuando totalPages > 7 con siblingCount=1', () => {
    renderPagination({
      currentPage: 10,
      totalPages: 20,
      totalItems: 400,
      pageSize: 20,
      siblingCount: 1,
    });

    // Con 20 páginas y sibling=1 alrededor de la 10: 1 ... 9 10 11 ... 20
    const ellipses = screen.getAllByText('…');
    expect(ellipses.length).toBeGreaterThanOrEqual(2);

    // Las páginas 1, 9, 10, 11 y 20 deben existir como botones.
    expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 9' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 11' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 20' })).toBeInTheDocument();

    // La página 5 (no es adyacente a la 10) NO debe aparecer.
    expect(screen.queryByRole('button', { name: 'Página 5' })).not.toBeInTheDocument();
  });

  it('marca la página actual con aria-current="page"', () => {
    renderPagination({
      currentPage: 3,
      totalPages: 5,
      totalItems: 100,
      pageSize: 20,
    });

    const currentBtn = screen.getByRole('button', { name: 'Página 3' });
    expect(currentBtn).toHaveAttribute('aria-current', 'page');
  });
});
