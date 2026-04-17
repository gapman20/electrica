import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext.jsx';
import { UserProvider } from './UserContext.jsx';

// Mock the API services
vi.mock('../services/api', () => ({
  cartApi: {
    get: vi.fn(() => Promise.resolve([])),
    add: vi.fn((item) => Promise.resolve({ id: 'new-id', ...item })),
    update: vi.fn(() => Promise.resolve({})),
    remove: vi.fn(() => Promise.resolve(true)),
    clear: vi.fn(() => Promise.resolve(true)),
  },
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
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

const TestConsumer = () => {
  const { items, subtotal, itemCount, addItem, removeItem, updateQuantity, clearCart } = useCart();
  return (
    <div>
      <span data-testid="items">{JSON.stringify(items)}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <span data-testid="itemCount">{itemCount}</span>
      <button data-testid="add" onClick={() => addItem({ id: 'card1', name: 'Test Card', price: 10, imageUrl: '', stock: 5, game: 'Pokemon', rarity: 'Rare' })}>Add</button>
      <button data-testid="remove" onClick={() => removeItem('card1')}>Remove</button>
      <button data-testid="update" onClick={() => updateQuantity('card1', 3)}>Update</button>
      <button data-testid="clear" onClick={clearCart}>Clear</button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial empty cart', () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    const items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items).toEqual([]);
  });

  it('calculates subtotal correctly for empty cart', () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    expect(screen.getByTestId('subtotal').textContent).toBe('0');
  });

  it('calculates itemCount correctly for empty cart', () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    expect(screen.getByTestId('itemCount').textContent).toBe('0');
  });

  it('adds item to cart', async () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    await act(async () => {
      screen.getByTestId('add').click();
    });
    await waitFor(() => {
      const items = JSON.parse(screen.getByTestId('items').textContent);
      expect(items.length).toBe(1);
      expect(items[0].cardId).toBe('card1');
      expect(items[0].quantity).toBe(1);
    });
  });

  it('increments quantity when adding existing item', async () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    await act(async () => {
      screen.getByTestId('add').click();
      screen.getByTestId('add').click();
    });
    await waitFor(() => {
      const items = JSON.parse(screen.getByTestId('items').textContent);
      expect(items[0].quantity).toBe(2);
    });
  });

  it('removes item from cart', async () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    await act(async () => {
      screen.getByTestId('add').click();
    });
    await act(async () => {
      screen.getByTestId('remove').click();
    });
    await waitFor(() => {
      const items = JSON.parse(screen.getByTestId('items').textContent);
      expect(items.length).toBe(0);
    });
  });

  it('updates item quantity', async () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    await act(async () => {
      screen.getByTestId('add').click();
    });
    await act(async () => {
      screen.getByTestId('update').click();
    });
    await waitFor(() => {
      const items = JSON.parse(screen.getByTestId('items').textContent);
      expect(items[0].quantity).toBe(3);
    });
  });

  it('clears cart', async () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    await act(async () => {
      screen.getByTestId('add').click();
    });
    await act(async () => {
      screen.getByTestId('clear').click();
    });
    await waitFor(() => {
      const items = JSON.parse(screen.getByTestId('items').textContent);
      expect(items.length).toBe(0);
    });
  });

  it('persists cart to localStorage for guest user', async () => {
    render(<TestWrapper user={false}><TestConsumer /></TestWrapper>);
    await act(async () => {
      screen.getByTestId('add').click();
    });
    await waitFor(() => {
      const stored = localStorage.getItem('guest_cart_v1');
      expect(stored).toBeTruthy();
    });
  });
});

describe('Price calculations', () => {
  it('calculates subtotal from multiple items', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 20, quantity: 1 },
    ];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(subtotal).toBe(40);
  });

  it('calculates itemCount from quantities', () => {
    const items = [
      { quantity: 2 },
      { quantity: 3 },
    ];
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    expect(itemCount).toBe(5);
  });

  it('handles empty cart', () => {
    const items = [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(subtotal).toBe(0);
  });

  it('handles single item', () => {
    const items = [{ price: 99, quantity: 1 }];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(subtotal).toBe(99);
  });
});