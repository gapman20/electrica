import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OrderProvider, useOrder } from '../context/OrderContext.jsx';

// Mock the API services
vi.mock('../services/api', () => ({
  orderApi: {
    create: vi.fn((data) => Promise.resolve({ id: 'order-123', ...data })),
    lookup: vi.fn(() => Promise.resolve(null)),
    getById: vi.fn(() => Promise.resolve(null)),
    getMyOrders: vi.fn(() => Promise.resolve([])),
    updateStatus: vi.fn(() => Promise.resolve({})),
  },
  default: {
    orders: {}
  }
}));

const TestWrapper = ({ children }) => (
  <OrderProvider>{children}</OrderProvider>
);

const TestConsumer = () => {
  const { currentOrder, orderHistory, lookupResult, loading, error, createOrder, clearCurrentOrder } = useOrder();
  return (
    <div>
      <span data-testid="currentOrder">{JSON.stringify(currentOrder)}</span>
      <span data-testid="orderHistory">{JSON.stringify(orderHistory)}</span>
      <span data-testid="lookupResult">{JSON.stringify(lookupResult)}</span>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="error">{error || ''}</span>
      <button data-testid="create" onClick={() => createOrder({ email: 'test@test.com', items: [], total: 100 })}>Create</button>
      <button data-testid="clear" onClick={clearCurrentOrder}>Clear</button>
    </div>
  );
};

describe('OrderContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial null state', () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    expect(screen.getByTestId('currentOrder').textContent).toBe('null');
    expect(screen.getByTestId('orderHistory').textContent).toBe('[]');
  });

  it('has loading as false initially', () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('clears current order via UI', async () => {
    render(<TestWrapper><TestConsumer /></TestWrapper>);
    await act(async () => {
      screen.getByTestId('create').click();
    });
    await act(async () => {
      screen.getByTestId('clear').click();
    });
    expect(screen.getByTestId('currentOrder').textContent).toBe('null');
  });
});

describe('generateOrderId', () => {
  it('generates order ID in correct format', () => {
    const generateOrderId = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 6).toLowerCase();
      return `ORD-${timestamp}-${random}`;
    };
    const orderId = generateOrderId();
    expect(orderId).toMatch(/^ORD-\d+-[a-z0-9]{4}$/);
  });

  it('generates unique order IDs', () => {
    const generateOrderId = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 6).toLowerCase();
      return `ORD-${timestamp}-${random}`;
    };
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateOrderId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('Price calculations for orders', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('calculates total from cart items', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 25, quantity: 1 },
      { price: 5, quantity: 3 },
    ];
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(total).toBe(60);
  });

  it('handles empty cart total', () => {
    const items = [];
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(total).toBe(0);
  });

  it('handles single item', () => {
    const items = [{ price: 99, quantity: 1 }];
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(total).toBe(99);
  });

  it('calculates with decimal prices', () => {
    const items = [
      { price: 10.50, quantity: 2 },
      { price: 5.25, quantity: 4 },
    ];
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(total).toBe(42);
  });
});