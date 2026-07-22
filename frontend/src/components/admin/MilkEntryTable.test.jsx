import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MilkEntryTable } from './MilkEntryTable';

describe('MilkEntryTable', () => {
  it('renders milk entry rows with the shared table component', () => {
    render(
      <MilkEntryTable
        entries={[
          {
            _id: 'entry-1',
            date: '2024-01-01T00:00:00.000Z',
            userId: { username: 'Ravi' },
            quantity: 2,
            pricePerLitre: 45,
            totalPrice: 90,
            session: 'morning',
          },
        ]}
        handleDelete={jest.fn()}
      />
    );

    expect(screen.getByText('Recent entries')).toBeInTheDocument();
    expect(screen.getByText('Ravi')).toBeInTheDocument();
    expect(screen.getByText('2 L')).toBeInTheDocument();
  });
});
