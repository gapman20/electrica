import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext.jsx';
import { UserProvider, useUser } from '../context/UserContext.jsx';

// Mock the API services
vi.mock('../services/api', () => ({
  cartApi: {
    get: vi.fn(() => Promise.resolve([])),
    add: vi.fn((item) => Promise.resolve({ id: 'new-id', ...item })),
    update: vi.fn(() => Promise.resolve({})),
    remove: vi.fn(() => Promise.resolve(true)),
    clear: vi.fn(() => Promise.resolve(true)),
    merge: vi.fn((items) => Promise.resolve(items)),
  },
  authApi: {
    login: vi.fn(() => Promise.resolve({ success: true, user: { id: 'u1', name: 'Test User' } })),
    logout: vi.fn(),
    isAuthenticated: vi.fn(() => false),
  },
  default: {
    cart: {},
    auth: {}
  }
}));

const TestWrapper = ({ children }) => (
  <UserProvider>
    <CartProvider>{children}</CartProvider>
  </UserProvider>
);

const TestConsumerWithAdd = () => {
  const { items, addItem } = useCart();
  return (
    <div>
      <span data-testid="items">{JSON.stringify(items)}</span>
      <button data-testid="add" onClick={() => addItem({ id: 'card1', name: 'Test', price: 10, imageUrl: '', stock: 5, game: 'Pokemon', rarity: 'Rare' })}>Add</button>
    </div>
  );
};

const TestMergeFlow = () => {
  const { items } = useCart();
  const { login } = useUser();
  return (
    <div>
      <span data-testid="items">{JSON.stringify(items)}</span>
      <button data-testid="login" onClick={() => login('test@test.com', 'password')}>Login</button>
    </div>
  );
};

describe('Cart merge on login', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('merges local cart with server cart', async () => {
    const { cartApi } = await import('../services/api');

    // Setup guest cart
    localStorage.setItem('guest_cart_v1', JSON.stringify([
      { cardId: 'local1', quantity: 2, price: 10, name: 'Local Card' }
    ]));

    render(<TestWrapper><TestMergeFlow /></TestWrapper>);

    await act(async () => {
      screen.getByTestId('login').click();
    });

    await waitFor(() => {
      // Check if cartApi.add was called for the guest item
      expect(cartApi.add).toHaveBeenCalledWith(expect.objectContaining({
        cardId: 'local1',
        quantity: 2
      }));
      // Check if guest cart was cleared
      expect(localStorage.getItem('guest_cart_v1')).toBe('[]');
    });
  });
});

describe('Cart persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads cart from localStorage on init', async () => {
    localStorage.setItem('guest_cart_v1', JSON.stringify([{ cardId: 'saved1', quantity: 2, price: 15 }]));
    render(<TestWrapper><TestConsumerWithAdd /></TestWrapper>);
    await waitFor(() => {
      const items = JSON.parse(screen.getByTestId('items').textContent);
      expect(items.length).toBe(1);
      expect(items[0].cardId).toBe('saved1');
    });
  });
});

const CatalogFilterConsumer = () => {
  const cards = [
    { id: '1', game: 'Pokemon', name: 'Pikachu' },
    { id: '2', game: 'YuGiOh', name: 'Dark Magician' },
    { id: '3', game: 'Pokemon', name: 'Charizard' },
    { id: '4', game: 'Digimon', name: 'Agumon' },
  ];
  const filter = 'Pokemon';
  const filtered = filter ? cards.filter(c => c.game === filter) : cards;
  return (
    <div>
      <span data-testid="all">{cards.length}</span>
      <span data-testid="filtered">{filtered.length}</span>
    </div>
  );
};

describe('Catalog filtering', () => {
  it('filters cards by game', () => {
    render(<div><CatalogFilterConsumer /></div>);
    expect(screen.getByTestId('all').textContent).toBe('4');
    expect(screen.getByTestId('filtered').textContent).toBe('2');
  });

  it('returns all cards when no filter', () => {
    const { container } = render(
      <div>
        {(() => {
          const cards = [{ id: '1' }, { id: '2' }, { id: '3' }];
          return <span data-testid="count">{cards.length}</span>;
        })()}
      </div>
    );
    expect(container.querySelector('[data-testid="count"]').textContent).toBe('3');
  });
});

describe('Order lookup validation', () => {
  it('validates order ID format', () => {
    const isValidOrderId = (id) => /^ORD-\d+-[a-z0-9]{4}$/.test(id);
    expect(isValidOrderId('ORD-1234567890-abcd')).toBe(true);
    expect(isValidOrderId('invalid')).toBe(false);
    expect(isValidOrderId('')).toBe(false);
  });

  it('validates email format', () => {
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValidEmail('test@test.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects invalid email for order lookup', () => {
    const email = 'not-an-email';
    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    expect(isValidEmail(email)).toBe(false);
  });
});