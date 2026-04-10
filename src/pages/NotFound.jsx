import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import SEO from '../components/SEO';

const NotFound = () => {
  return (
    <>
      <SEO title="Page Not Found | TCG Store" />
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '8rem',
            fontWeight: 'bold',
            color: '#3182ce',
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '2rem',
            marginTop: '1rem',
            color: '#2d3748',
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            fontSize: '1.125rem',
            color: '#718096',
            marginTop: '1rem',
            maxWidth: '500px',
          }}
        >
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3182ce',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
          >
            <Home size={20} />
            Go Home
          </Link>
          <Link
            to="/catalogo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              color: '#3182ce',
              border: '2px solid #3182ce',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            <Search size={20} />
            Browse Cards
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
